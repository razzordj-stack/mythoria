"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MythoriaAlert } from "@/components/ui/MythoriaAlert";
import { MythoriaPageHeader } from "@/components/ui/MythoriaPageHeader";

const toneOptions = [
  ["heroic", "Heldenhaft"],
  ["dark", "Düster"],
  ["mysterious", "Geheimnisvoll"],
  ["lighthearted", "Leicht und humorvoll"],
] as const;
const lengthOptions = [
  ["compact", "Kompakt"],
  ["balanced", "Ausgewogen"],
  ["detailed", "Ausführlich"],
] as const;
const difficultyOptions = [
  ["forgiving", "Nachsichtig"],
  ["balanced", "Ausgewogen"],
  ["dangerous", "Gefährlich"],
] as const;

export default function SettingsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [tone, setTone] = useState("mysterious");
  const [length, setLength] = useState("balanced");
  const [difficulty, setDifficulty] = useState("balanced");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      const preferences = data.user?.user_metadata?.adventure_preferences;
      if (!isRecord(preferences)) return;
      if (toneOptions.some(([value]) => value === preferences.tone))
        setTone(String(preferences.tone));
      if (lengthOptions.some(([value]) => value === preferences.length))
        setLength(String(preferences.length));
      if (difficultyOptions.some(([value]) => value === preferences.difficulty))
        setDifficulty(String(preferences.difficulty));
    });
  }, [supabase]);

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const { error } = await supabase.auth.updateUser({
      data: { adventure_preferences: { tone, length, difficulty } },
    });
    setSuccess(!error);
    setMessage(
      error ? error.message : "Spielleiter-Einstellungen gespeichert.",
    );
    setBusy(false);
  }

  return (
    <main className="mythoria-page mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <MythoriaPageHeader
        eyebrow="EINSTELLUNGEN"
        title="Deine Spielweise"
        description="Passe die Erzählweise des KI-Spielleiters an. Die Regeln und Sicherheitsgrenzen bleiben für alle Spielweisen gleich."
      />
      <form
        onSubmit={save}
        className="mythoria-panel mt-8 space-y-7 p-6 sm:p-8"
      >
        <OptionGroup
          title="Stimmung"
          description="Bestimmt Sprache, Atmosphäre und Grundton der Szenen."
          name="tone"
          value={tone}
          setValue={setTone}
          options={toneOptions}
        />
        <hr className="mythoria-divider" />
        <OptionGroup
          title="Erzählumfang"
          description="Steuert die gewünschte Länge einer Spielleiterantwort."
          name="length"
          value={length}
          setValue={setLength}
          options={lengthOptions}
        />
        <hr className="mythoria-divider" />
        <OptionGroup
          title="Gefahrengefühl"
          description="Beeinflusst erzählerisches Risiko und Konsequenzen, aber niemals die festen Servergrenzen."
          name="difficulty"
          value={difficulty}
          setValue={setDifficulty}
          options={difficultyOptions}
        />
        {message && (
          <MythoriaAlert variant={success ? "success" : "error"}>
            {message}
          </MythoriaAlert>
        )}
        <button disabled={busy} className="mythoria-button-primary">
          {busy ? "Speichern …" : "Einstellungen speichern"}
        </button>
      </form>
    </main>
  );
}

function OptionGroup({
  title,
  description,
  name,
  value,
  setValue,
  options,
}: {
  title: string;
  description: string;
  name: string;
  value: string;
  setValue: (value: string) => void;
  options: ReadonlyArray<readonly [string, string]>;
}) {
  return (
    <fieldset>
      <legend className="mythoria-subheading text-lg">{title}</legend>
      <p className="mt-1 text-sm text-[var(--mythoria-text-muted)]">
        {description}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {options.map(([option, label]) => (
          <label
            key={option}
            className={`cursor-pointer rounded-xl border p-4 transition ${value === option ? "border-[var(--mythoria-border-gold)] bg-[var(--mythoria-green-dark)]/35" : "border-[var(--mythoria-border)] bg-[var(--mythoria-surface)]"}`}
          >
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => setValue(option)}
              className="sr-only"
            />
            <span className="font-bold text-[var(--mythoria-text-secondary)]">
              {label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
