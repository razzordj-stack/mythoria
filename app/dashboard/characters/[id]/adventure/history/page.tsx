"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MythoriaAlert } from "@/components/ui/MythoriaAlert";
import { MythoriaSpinner } from "@/components/ui/MythoriaSpinner";

type Session = {
  id: string;
  title: string;
  status: string;
  started_at: string;
  completed_at: string | null;
};
type Message = {
  id: string;
  role: string;
  content: string;
  created_at: string;
};

export default function AdventureHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = useMemo(() => createClient(), []);
  const [characterName, setCharacterName] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMessages = useCallback(
    async (sessionId: string) => {
      setSelectedId(sessionId);
      const { data, error: messageError } = await supabase
        .from("adventure_messages")
        .select("id,role,content,created_at")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true })
        .overrideTypes<Message[], { merge: false }>();
      if (messageError) setError(messageError.message);
      else setMessages(data ?? []);
    },
    [supabase],
  );

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Du bist nicht angemeldet.");
        setLoading(false);
        return;
      }
      const { data: character } = await supabase
        .from("characters")
        .select("name")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!character) {
        setError("Charakter nicht gefunden.");
        setLoading(false);
        return;
      }
      setCharacterName(character.name);
      const { data, error: sessionError } = await supabase
        .from("adventure_sessions")
        .select("id,title,status,started_at,completed_at")
        .eq("character_id", id)
        .eq("user_id", user.id)
        .order("started_at", { ascending: false })
        .overrideTypes<Session[], { merge: false }>();
      if (sessionError) setError(sessionError.message);
      else {
        const rows = data ?? [];
        setSessions(rows);
        if (rows[0]) await loadMessages(rows[0].id);
      }
      setLoading(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [id, loadMessages, supabase]);

  if (loading)
    return (
      <main className="mythoria-page flex min-h-screen items-center justify-center">
        <MythoriaSpinner size="large" />
      </main>
    );
  return (
    <main className="mythoria-page mx-auto max-w-6xl px-4 py-8">
      <header className="mythoria-page-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold tracking-[.18em] text-[var(--mythoria-green-bright)]">
            ARCHIV
          </p>
          <h1 className="mythoria-heading mt-2">
            Chroniken von {characterName || "Mythoria"}
          </h1>
          <p className="mt-2 text-sm text-[var(--mythoria-text-muted)]">
            Abgeschlossene Geschichten bleiben unveränderlich erhalten.
          </p>
        </div>
        <Link
          href={`/dashboard/characters/${id}/adventure`}
          className="mythoria-button-secondary"
        >
          Zum Abenteuer
        </Link>
      </header>
      {error && (
        <MythoriaAlert variant="error" className="mt-5">
          {error}
        </MythoriaAlert>
      )}
      <div className="mt-5 grid gap-5 lg:grid-cols-[280px_1fr]">
        <aside className="mythoria-panel h-fit p-4">
          <h2 className="px-2 text-lg">Chroniken</h2>
          <div className="mt-3 space-y-2">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => void loadMessages(session.id)}
                className={`w-full rounded-xl border p-3 text-left ${selectedId === session.id ? "border-[var(--mythoria-border-gold)] bg-[var(--mythoria-green-dark)]/30" : "border-[var(--mythoria-border)]"}`}
              >
                <span className="block font-bold text-[var(--mythoria-gold-light)]">
                  {session.title}
                </span>
                <span className="mt-1 block text-xs text-[var(--mythoria-text-muted)]">
                  {new Date(session.started_at).toLocaleDateString("de-DE")} ·{" "}
                  {session.status === "active" ? "Laufend" : "Abgeschlossen"}
                </span>
              </button>
            ))}
            {sessions.length === 0 && (
              <p className="px-2 py-4 text-sm text-[var(--mythoria-text-muted)]">
                Noch keine Chroniken vorhanden.
              </p>
            )}
          </div>
        </aside>
        <section className="mythoria-panel min-h-[420px] space-y-4 p-5 sm:p-7">
          {messages.map((message) => (
            <article
              key={message.id}
              className={
                message.role === "user"
                  ? "ml-auto max-w-[88%] rounded-2xl border border-[var(--mythoria-border)] p-4"
                  : "max-w-[95%] rounded-2xl border border-[var(--mythoria-border-gold)] bg-[var(--mythoria-surface)] p-5"
              }
            >
              <p className="text-xs font-bold text-[var(--mythoria-gold-light)]">
                {message.role === "user" ? "DEINE HANDLUNG" : "CHRONIK"}
              </p>
              <p className="mt-2 whitespace-pre-wrap leading-7 text-[var(--mythoria-text-secondary)]">
                {message.content}
              </p>
            </article>
          ))}
          {selectedId && messages.length === 0 && (
            <p className="text-[var(--mythoria-text-muted)]">
              Diese Chronik enthält noch keine Einträge.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
