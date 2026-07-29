"use client";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MythoriaAlert } from "@/components/ui/MythoriaAlert";
import { MythoriaSpinner } from "@/components/ui/MythoriaSpinner";

type Character = {
  id: string;
  user_id: string;
  name: string;
  race: string;
  character_class: string;
  level: number;
  experience: number;
  health: number;
  max_health: number;
  mana: number;
  max_mana: number;
  gold: number;
};
type Session = {
  id: string;
  character_id: string;
  user_id: string;
  title: string;
  status: string;
  started_at: string;
  updated_at: string;
};
type Message = {
  id: string;
  session_id: string;
  role: "user" | "assistant" | "system" | "npc";
  content: string;
  structured_data: unknown;
  created_at: string;
};

export default function AdventurePage() {
  const { id } = useParams<{ id: string }>();
  const supabase = useMemo(() => createClient(), []);
  const [character, setCharacter] = useState<Character | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Du bist nicht angemeldet.");
      setLoading(false);
      return;
    }
    const { data: c, error: ce } = await supabase
      .from("characters")
      .select(
        "id,user_id,name,race,character_class,level,experience,health,max_health,mana,max_mana,gold",
      )
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle()
      .overrideTypes<Character | null, { merge: false }>();
    if (ce || !c) {
      setError(ce?.message ?? "Charakter nicht gefunden.");
      setLoading(false);
      return;
    }
    setCharacter(c);
    const { data: s, error: se } = await supabase
      .from("adventure_sessions")
      .select("id,character_id,user_id,title,status,started_at,updated_at")
      .eq("character_id", id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle()
      .overrideTypes<Session | null, { merge: false }>();
    if (se) {
      setError(se.message);
      setLoading(false);
      return;
    }
    setSession(s);
    if (s) {
      const { data: m, error: me } = await supabase
        .from("adventure_messages")
        .select("id,session_id,role,content,structured_data,created_at")
        .eq("session_id", s.id)
        .order("created_at", { ascending: true })
        .overrideTypes<Message[], { merge: false }>();
      if (me) setError(me.message);
      else setMessages(m ?? []);
    } else setMessages([]);
    setLoading(false);
  }, [id, supabase]);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  async function start() {
    setBusy(true);
    setError("");
    const { error: e } = await supabase.rpc("start_or_resume_adventure", {
      p_character_id: id,
    });
    if (e) setError(e.message);
    else await load();
    setBusy(false);
  }
  async function complete() {
    if (
      !session ||
      !window.confirm(
        "Möchtest du diese Chronik wirklich abschließen? Sie bleibt anschließend im Archiv lesbar.",
      )
    )
      return;
    setBusy(true);
    setError("");
    const { error: completeError } = await supabase.rpc("complete_adventure", {
      p_session_id: session.id,
    });
    if (completeError) setError(completeError.message);
    else await load();
    setBusy(false);
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!session || text.length < 2) return;
    if (text.length > 2000) {
      setError("Deine Handlung darf höchstens 2.000 Zeichen enthalten.");
      return;
    }
    setBusy(true);
    setError("");
    setSaved("");
    try {
      const response = await fetch("/api/adventure/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          requestId: crypto.randomUUID(),
          action: text,
        }),
      });
      const result: unknown = await response.json();
      if (!response.ok)
        throw new Error(
          isRecord(result) && typeof result.error === "string"
            ? result.error
            : "Der KI-Spielleiter konnte nicht antworten.",
        );
      setInput("");
      setSaved("Die neue Szene wurde in deiner Chronik gespeichert.");
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Ein unerwarteter Fehler ist aufgetreten.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (loading)
    return (
      <main className="mythoria-page flex min-h-screen items-center justify-center">
        <MythoriaSpinner size="large" />
      </main>
    );
  if (!character) return <State text={error || "Charakter nicht gefunden."} />;
  if (!session)
    return (
      <main className="mythoria-page mx-auto max-w-4xl px-4 py-10">
        <section className="mythoria-panel p-8 text-center sm:p-12">
          <p className="text-sm font-bold tracking-[.18em] text-[var(--mythoria-green-bright)]">
            ABENTEUER
          </p>
          <h1 className="mythoria-heading mt-3">
            Ein neues Kapitel für {character.name}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-[var(--mythoria-text-muted)]">
            Eröffne eine dauerhaft gespeicherte Chronik. Deine Handlungen
            bleiben erhalten und können später fortgesetzt werden.
          </p>
          {error && (
            <MythoriaAlert variant="error" className="mt-6">
              {error}
            </MythoriaAlert>
          )}
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              onClick={() => void start()}
              disabled={busy}
              className="mythoria-button-primary"
            >
              {busy ? "Chronik wird geöffnet …" : "Abenteuer beginnen"}
            </button>
            <Link
              href={"/dashboard/characters/" + id}
              className="mythoria-button-secondary"
            >
              Zurück
            </Link>
            <Link
              href={`/dashboard/characters/${id}/adventure/history`}
              className="mythoria-button-secondary"
            >
              Chronikarchiv
            </Link>
          </div>
        </section>
      </main>
    );
  const choices = lastChoices(messages);
  return (
    <main className="mythoria-page mx-auto max-w-[1440px] px-4 py-6">
      <header className="mythoria-panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold tracking-[.18em] text-[var(--mythoria-green-bright)]">
            LAUFENDE CHRONIK
          </p>
          <h1 className="mt-2 text-2xl">{session.title}</h1>
          <p className="mt-1 text-sm text-[var(--mythoria-text-muted)]">
            Automatisch gespeichert ·{" "}
            {new Date(session.updated_at).toLocaleString("de-DE")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/dashboard/characters/${id}/adventure/history`}
            className="mythoria-button-secondary"
          >
            Archiv
          </Link>
          <button
            type="button"
            onClick={() => void complete()}
            disabled={busy}
            className="mythoria-button-secondary"
          >
            Chronik abschließen
          </button>
          <Link
            href={"/dashboard/characters/" + id}
            className="mythoria-button-secondary"
          >
            Zum Charakter
          </Link>
        </div>
      </header>
      <div className="mt-5 grid gap-5 xl:grid-cols-[250px_minmax(0,1fr)_250px]">
        <CharacterPanel character={character} />
        <section className="min-w-0">
          <div className="mythoria-panel min-h-[420px] space-y-5 p-5 sm:p-7">
            {messages.map((message) => (
              <article
                key={message.id}
                className={
                  message.role === "user"
                    ? "ml-auto max-w-[88%] rounded-2xl border border-[var(--mythoria-border)] bg-[var(--mythoria-green-dark)]/20 p-4"
                    : "max-w-[95%] rounded-2xl border border-[var(--mythoria-border-gold)] bg-[var(--mythoria-surface)] p-5"
                }
              >
                <p className="text-xs font-bold tracking-wide text-[var(--mythoria-gold-light)]">
                  {message.role === "user" ? "DEINE HANDLUNG" : "CHRONIK"}
                </p>
                <p className="mt-2 whitespace-pre-wrap leading-7 text-[var(--mythoria-text-secondary)]">
                  {message.content}
                </p>
                <AdventureEffects data={message.structured_data} />
              </article>
            ))}
          </div>
          {choices.length > 0 && (
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {choices.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  onClick={() => setInput(choice)}
                  className="mythoria-button-secondary text-left"
                >
                  {choice}
                </button>
              ))}
            </div>
          )}
          {error && (
            <MythoriaAlert variant="error" className="mt-4">
              {error}
            </MythoriaAlert>
          )}
          {saved && (
            <MythoriaAlert variant="success" className="mt-4">
              {saved}
            </MythoriaAlert>
          )}
          <form onSubmit={submit} className="mythoria-panel mt-4 p-4">
            <label
              htmlFor="adventure-action"
              className="text-sm font-bold text-[var(--mythoria-gold-light)]"
            >
              Was unternimmst du?
              <textarea
                id="adventure-action"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={2000}
                rows={4}
                placeholder="Beschreibe deine Handlung …"
                className="mythoria-textarea mt-2"
              />
            </label>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-xs text-[var(--mythoria-text-muted)]">
                {input.length}/2000
              </span>
              <button
                disabled={busy || input.trim().length < 2}
                className="mythoria-button-primary"
              >
                {busy ? "Der Spielleiter antwortet …" : "Handlung ausführen"}
              </button>
            </div>
          </form>
        </section>
        <aside className="mythoria-card h-fit p-5">
          <p className="text-xs font-bold text-[var(--mythoria-gold-light)]">
            CHRONIKSTATUS
          </p>
          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <dt className="text-[var(--mythoria-text-muted)]">Begonnen</dt>
              <dd>
                {new Date(session.started_at).toLocaleDateString("de-DE")}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--mythoria-text-muted)]">Einträge</dt>
              <dd>{messages.length}</dd>
            </div>
            <div>
              <dt className="text-[var(--mythoria-text-muted)]">
                KI-Dungeon-Master
              </dt>
              <dd className="text-[var(--mythoria-success)]">Aktiv</dd>
            </div>
          </dl>
        </aside>
      </div>
    </main>
  );
}
function CharacterPanel({ character }: { character: Character }) {
  return (
    <aside className="mythoria-card h-fit p-5">
      <p className="text-xs font-bold text-[var(--mythoria-gold-light)]">
        CHARAKTER
      </p>
      <h2 className="mt-2 text-xl">{character.name}</h2>
      <p className="mt-1 text-sm text-[var(--mythoria-text-muted)]">
        Stufe {character.level} · {character.race} · {character.character_class}
      </p>
      <Stat
        label="Leben"
        value={character.health}
        max={character.max_health}
        color="var(--mythoria-health)"
      />
      <Stat
        label="Mana"
        value={character.mana}
        max={character.max_mana}
        color="var(--mythoria-mana)"
      />
      <p className="mt-5 text-sm font-bold text-[var(--mythoria-gold-light)]">
        {character.gold} Gold
      </p>
      <p className="mt-2 text-xs text-[var(--mythoria-text-muted)]">
        {character.experience} Erfahrung
      </p>
    </aside>
  );
}
function Stat({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const safe = Math.max(max, 1);
  return (
    <div className="mt-5">
      <div className="flex justify-between text-xs">
        <span>{label}</span>
        <span>
          {value}/{safe}
        </span>
      </div>
      <div className="mythoria-stat-bar mt-2">
        <div
          className="h-full rounded-full"
          style={{
            width:
              String(Math.min(100, Math.max(0, (value / safe) * 100))) + "%",
            background: color,
          }}
        />
      </div>
    </div>
  );
}
function lastChoices(messages: Message[]) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const data = messages[i].structured_data;
    if (isRecord(data) && Array.isArray(data.choices))
      return data.choices.filter(
        (choice): choice is string => typeof choice === "string",
      );
  }
  return [];
}
function AdventureEffects({ data }: { data: unknown }) {
  if (!isRecord(data)) return null;
  const effectData = isRecord(data.effects) ? data.effects : {};
  const labels: Array<[string, string]> = [
    ["health", "Leben"],
    ["mana", "Mana"],
    ["gold", "Gold"],
    ["experience", "EP"],
  ];
  const effects = labels.flatMap(([key, label]) => {
    const value = effectData[key];
    return typeof value === "number" && value !== 0 ? [{ label, value }] : [];
  });
  const rewards = Array.isArray(data.itemRewards)
    ? data.itemRewards.filter(isRecord)
    : [];
  const questUpdates = Array.isArray(data.questUpdates)
    ? data.questUpdates.filter(isRecord)
    : [];
  if (effects.length === 0 && rewards.length === 0 && questUpdates.length === 0)
    return null;
  return (
    <div
      className="mt-4 flex flex-wrap gap-2"
      aria-label="Auswirkungen der Szene"
    >
      {effects.map(({ label, value }) => (
        <span
          key={label}
          className={`rounded-full border px-3 py-1 text-xs font-bold ${
            value > 0
              ? "border-[var(--mythoria-success)]/40 text-[var(--mythoria-success)]"
              : "border-[var(--mythoria-health)]/40 text-[var(--mythoria-health)]"
          }`}
        >
          {label} {value > 0 ? "+" : ""}
          {value}
        </span>
      ))}
      {rewards.map((reward, index) => (
        <span
          key={`reward-${index}`}
          className="rounded-full border border-[var(--mythoria-border-gold)] px-3 py-1 text-xs font-bold text-[var(--mythoria-gold-light)]"
        >
          Gegenstand:{" "}
          {typeof reward.name === "string" ? reward.name : "Belohnung"}
        </span>
      ))}
      {questUpdates.map((update, index) => (
        <span
          key={`quest-${index}`}
          className="rounded-full border border-[var(--mythoria-mana)]/40 px-3 py-1 text-xs font-bold text-[var(--mythoria-mana)]"
        >
          Quest +{typeof update.progress === "number" ? update.progress : 0}%
        </span>
      ))}
    </div>
  );
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function State({ text }: { text: string }) {
  return (
    <main className="mythoria-page flex min-h-screen items-center justify-center px-4">
      <section className="mythoria-panel max-w-xl p-8 text-center">
        <h1>Abenteuer nicht verfügbar</h1>
        <p className="mt-4 text-[var(--mythoria-text-muted)]">{text}</p>
        <Link
          href="/dashboard/characters"
          className="mythoria-button-secondary mt-6"
        >
          Zur Übersicht
        </Link>
      </section>
    </main>
  );
}
