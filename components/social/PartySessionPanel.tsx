"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MythoriaAlert } from "@/components/ui/MythoriaAlert";
import { MythoriaBadge } from "@/components/ui/MythoriaBadge";

type Session = {
  id: string;
  status: "active" | "completed";
  location_slug: string;
  location_name: string;
  started_at: string;
};
type Message = {
  id: string;
  author_id: string;
  content: string;
  created_at: string;
};
type Profile = { id: string; display_name: string };

export function PartySessionPanel({
  partyId,
  partyStatus,
  isLeader,
}: {
  partyId: string;
  partyStatus: string;
  isLeader: boolean;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    const { data: sessionData, error: sessionError } = await supabase
      .from("multiplayer_party_sessions")
      .select("id,status,location_slug,location_name,started_at")
      .eq("party_id", partyId)
      .maybeSingle()
      .overrideTypes<Session | null, { merge: false }>();
    if (sessionError) {
      setError(sessionError.message);
      return;
    }
    setSession(sessionData);
    if (!sessionData) {
      setMessages([]);
      setProfiles([]);
      return;
    }
    const { data: messageData, error: messageError } = await supabase
      .from("multiplayer_party_messages")
      .select("id,author_id,content,created_at")
      .eq("session_id", sessionData.id)
      .order("created_at", { ascending: true })
      .limit(80)
      .overrideTypes<Message[], { merge: false }>();
    if (messageError) {
      setError(messageError.message);
      return;
    }
    setMessages(messageData ?? []);
    const authorIds = [
      ...new Set((messageData ?? []).map((entry) => entry.author_id)),
    ];
    if (!authorIds.length) {
      setProfiles([]);
      return;
    }
    const { data: profileData } = await supabase
      .from("public_profiles")
      .select("id,display_name")
      .in("id", authorIds)
      .overrideTypes<Profile[], { merge: false }>();
    setProfiles(profileData ?? []);
  }, [partyId, supabase]);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  useEffect(() => {
    const channel = supabase
      .channel(`party-session-${partyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "multiplayer_party_sessions",
          filter: `party_id=eq.${partyId}`,
        },
        () => void load(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "multiplayer_party_messages" },
        () => void load(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load, partyId, supabase]);
  async function call(
    name: "start_multiplayer_party_session" | "end_multiplayer_party_session",
    success: string,
  ) {
    setBusy(true);
    setError("");
    setMessage("");
    const { error: rpcError } = await supabase.rpc(name, {
      p_party_id: partyId,
    });
    if (rpcError) setError(sessionError(rpcError.message));
    else {
      setMessage(success);
      await load();
    }
    setBusy(false);
  }
  async function send(event: FormEvent) {
    event.preventDefault();
    if (!session || !text.trim()) return;
    setBusy(true);
    setError("");
    const { error: rpcError } = await supabase.rpc(
      "send_multiplayer_party_message",
      { p_session_id: session.id, p_content: text.trim() },
    );
    if (rpcError) setError(sessionError(rpcError.message));
    else {
      setText("");
      await load();
    }
    setBusy(false);
  }
  const names = new Map(
    profiles.map((profile) => [profile.id, profile.display_name]),
  );
  const active = session?.status === "active";
  return (
    <section className="mt-6 border-t border-[var(--mythoria-border)] pt-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="mythoria-subheading text-xl">
            Gemeinsame Spielsitzung
          </h3>
          <p className="mt-1 text-sm text-[var(--mythoria-text-muted)]">
            Bereite die Gruppe vor, starte am gemeinsamen Ort und öffne das
            Live-Spielbrett.
          </p>
        </div>
        {session && (
          <MythoriaBadge variant={active ? "success" : "neutral"}>
            {active ? "Aktiv" : "Beendet"}
          </MythoriaBadge>
        )}
      </div>
      {error && (
        <MythoriaAlert variant="error" className="mt-4">
          {error}
        </MythoriaAlert>
      )}
      {message && (
        <MythoriaAlert variant="success" className="mt-4">
          {message}
        </MythoriaAlert>
      )}
      {!active ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--mythoria-border)] p-4">
          <p className="flex-1 text-sm text-[var(--mythoria-text-muted)]">
            Zum Start müssen mindestens zwei Mitglieder bereit sein und sich mit
            ihren Gruppencharakteren am selben Ort befinden.
          </p>
          {isLeader ? (
            <button
              disabled={busy || partyStatus !== "ready"}
              onClick={() =>
                void call(
                  "start_multiplayer_party_session",
                  "Gemeinsame Spielsitzung gestartet.",
                )
              }
              className="mythoria-button-primary"
            >
              Sitzung starten
            </button>
          ) : (
            <span className="text-xs text-[var(--mythoria-text-muted)]">
              Warte auf die Gruppenleitung.
            </span>
          )}
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--mythoria-border-gold)] bg-[var(--mythoria-green-dark)]/15 p-4">
            <div className="flex-1">
              <p className="font-bold">{session.location_name}</p>
              <p className="text-xs text-[var(--mythoria-text-muted)]">
                Gestartet {new Date(session.started_at).toLocaleString("de-DE")}
              </p>
            </div>
            <Link
              href={`/dashboard/world/${session.location_slug}/board`}
              className="mythoria-button-primary"
            >
              Live-Spielbrett öffnen
            </Link>
            {isLeader && (
              <button
                disabled={busy}
                onClick={() =>
                  void call(
                    "end_multiplayer_party_session",
                    "Spielsitzung beendet.",
                  )
                }
                className="mythoria-button-secondary"
              >
                Sitzung beenden
              </button>
            )}
          </div>
          <div className="mythoria-panel mt-4 p-4">
            <h4 className="font-bold text-[var(--mythoria-gold-light)]">
              Gruppenchat
            </h4>
            <div
              className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1"
              aria-live="polite"
            >
              {messages.length === 0 ? (
                <p className="text-sm text-[var(--mythoria-text-muted)]">
                  Noch keine Nachricht – stimmt euch für das Spielbrett ab.
                </p>
              ) : (
                messages.map((entry) => (
                  <article
                    key={entry.id}
                    className="rounded-lg border border-[var(--mythoria-border)] bg-black/20 p-3 text-sm"
                  >
                    <p className="font-bold">
                      {names.get(entry.author_id) ?? "Mitglied"}
                    </p>
                    <p className="mt-1 text-[var(--mythoria-text-secondary)]">
                      {entry.content}
                    </p>
                  </article>
                ))
              )}
            </div>
            <form onSubmit={send} className="mt-4 flex gap-2">
              <input
                value={text}
                onChange={(event) => setText(event.target.value)}
                maxLength={500}
                placeholder="Nachricht an die Gruppe"
                className="mythoria-input"
              />
              <button
                disabled={busy || !text.trim()}
                className="mythoria-button-secondary"
              >
                Senden
              </button>
            </form>
          </div>
        </>
      )}
    </section>
  );
}
function sessionError(error: string) {
  if (error.includes("party not ready"))
    return "Die Gruppe muss vollständig bereit sein.";
  if (error.includes("party members must share location"))
    return "Alle Gruppencharaktere müssen am selben Ort sein.";
  if (error.includes("no tactical map"))
    return "Für den gemeinsamen Ort ist noch kein Spielbrett verfügbar.";
  if (error.includes("leader required"))
    return "Nur die Gruppenleitung kann die Sitzung steuern.";
  return error;
}
