"use client";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MythoriaAlert } from "@/components/ui/MythoriaAlert";
import { MythoriaPageHeader } from "@/components/ui/MythoriaPageHeader";

export default function ProfilePage() {
  const supabase = useMemo(() => createClient(), []);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState("");
  const [language, setLanguage] = useState("de");
  const [createdAt, setCreatedAt] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (u) {
        setEmail(u.email ?? "");
        setName(
          typeof u.user_metadata.display_name === "string"
            ? u.user_metadata.display_name
            : "",
        );
        setAvatar(
          typeof u.user_metadata.avatar_url === "string"
            ? u.user_metadata.avatar_url
            : "",
        );
        setLanguage(
          typeof u.user_metadata.language === "string"
            ? u.user_metadata.language
            : "de",
        );
        setCreatedAt(u.created_at);
      }
    });
  }, [supabase]);
  async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setSuccess(false);
      setMessage("Erlaubt sind JPEG-, PNG- und WebP-Bilder.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setSuccess(false);
      setMessage("Das Profilbild darf höchstens 2 MB groß sein.");
      return;
    }
    setUploading(true);
    setSuccess(false);
    setMessage("");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setMessage("Deine Sitzung ist abgelaufen.");
      setUploading(false);
      return;
    }
    const path = `${user.id}/avatar`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: true,
      });
    if (uploadError) {
      setMessage(uploadError.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const avatarUrl = `${data.publicUrl}?v=${Date.now()}`;
    const { error: profileError } = await supabase.auth.updateUser({
      data: { avatar_url: avatarUrl },
    });
    if (profileError) setMessage(profileError.message);
    else {
      setAvatar(avatarUrl);
      setSuccess(true);
      setMessage("Profilbild hochgeladen.");
    }
    setUploading(false);
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setSuccess(false);
    const { error } = await supabase.auth.updateUser({
      data: { display_name: name.trim(), avatar_url: avatar, language },
    });
    setMessage(error ? error.message : "Profil gespeichert.");
    setSuccess(!error);
    setBusy(false);
  }
  const initial = (name || email || "M").slice(0, 1).toUpperCase();
  return (
    <main className="mythoria-page mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <MythoriaPageHeader
        eyebrow="ABENTEURERPROFIL"
        title="Dein Profil"
        description="Verwalte deine öffentlichen Kontodaten und Spracheinstellungen."
      />
      <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="mythoria-panel p-6 text-center">
          <div
            role={avatar ? "img" : undefined}
            aria-label={
              avatar ? `Profilbild von ${name || "Abenteurer"}` : undefined
            }
            style={
              avatar
                ? { backgroundImage: `url(${JSON.stringify(avatar)})` }
                : undefined
            }
            className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border-2 border-[var(--mythoria-border-gold)] bg-[var(--mythoria-green-dark)]/45 bg-cover bg-center font-fantasy text-5xl font-bold text-[var(--mythoria-neon-soft)] shadow-[0_0_28px_rgba(147,182,64,.16)]"
          >
            {!avatar && initial}
          </div>
          <h2 className="mt-5 text-xl">{name || "Unbenannter Abenteurer"}</h2>
          <p className="mt-1 break-all text-sm text-[var(--mythoria-text-muted)]">
            {email}
          </p>
          <hr className="mythoria-divider my-5" />
          <p className="text-xs font-bold tracking-wide text-[var(--mythoria-text-disabled)]">
            REGISTRIERT
          </p>
          <p className="mt-1 text-sm text-[var(--mythoria-text-secondary)]">
            {createdAt
              ? new Date(createdAt).toLocaleDateString("de-DE")
              : "Wird geladen …"}
          </p>
        </aside>
        <form onSubmit={save} className="mythoria-panel space-y-5 p-6 sm:p-8">
          <Field label="E-Mail">
            <input
              readOnly
              value={email}
              className="mythoria-input opacity-70"
            />
          </Field>
          <Field label="Anzeigename">
            <input
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mythoria-input"
            />
          </Field>
          <Field
            label="Profilbild"
            hint="JPEG, PNG oder WebP · maximal 2 MB. Das Bild wird sicher in deinem persönlichen Supabase-Ordner gespeichert."
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => void uploadAvatar(event)}
              disabled={uploading}
              className="mythoria-input file:mr-4 file:rounded-lg file:border-0 file:bg-[var(--mythoria-green-dark)] file:px-3 file:py-2 file:text-[var(--mythoria-gold-light)]"
            />
          </Field>
          <Field label="Sprache">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="mythoria-select"
            >
              <option value="de">Deutsch</option>
              <option value="en">English</option>
            </select>
          </Field>
          {message && (
            <MythoriaAlert variant={success ? "success" : "error"}>
              {message}
            </MythoriaAlert>
          )}
          <button
            disabled={busy || uploading}
            className="mythoria-button-primary"
          >
            {busy ? "Speichern …" : "Profil speichern"}
          </button>
        </form>
      </div>
    </main>
  );
}
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-bold text-[var(--mythoria-gold-light)]">
      {label}
      <span className="mt-2 block">{children}</span>
      {hint && (
        <span className="mt-2 block text-xs font-normal text-[var(--mythoria-text-muted)]">
          {hint}
        </span>
      )}
    </label>
  );
}
