"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MythoriaAlert } from "@/components/ui/MythoriaAlert";
import { MythoriaBadge } from "@/components/ui/MythoriaBadge";
import { MythoriaPageHeader } from "@/components/ui/MythoriaPageHeader";
import { MythoriaSpinner } from "@/components/ui/MythoriaSpinner";

type ModelUsage = { provider: string; model: string; requests: number };
type Failure = { errorCode: string; count: number };
type Overview = {
  requests24h: number;
  completed24h: number;
  failed24h: number;
  requests7d: number;
  completed7d: number;
  failed7d: number;
  inputTokens7d: number;
  outputTokens7d: number;
  averageDurationMs7d: number;
  models: ModelUsage[];
  recentFailures: Failure[];
};

export default function AiOperationsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    setError("");
    const { data, error: rpcError } = await supabase.rpc(
      "get_ai_operations_overview",
    );
    if (rpcError) setError("Du besitzt keine Berechtigung für das KI-Monitoring.");
    else setOverview(data as Overview);
    setRefreshing(false);
  }, [supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  if (error)
    return (
      <main className="mythoria-page mx-auto max-w-3xl px-4 py-12">
        <MythoriaAlert variant="error" title="Zugriff verweigert">
          {error}
        </MythoriaAlert>
      </main>
    );
  if (!overview)
    return (
      <main className="mythoria-page flex min-h-screen items-center justify-center">
        <MythoriaSpinner size="large" />
      </main>
    );

  const completedRate = rate(overview.completed24h, overview.requests24h);
  const cards = [
    { label: "Anfragen · 24 Stunden", value: overview.requests24h },
    { label: "Erfolgreich · 24 Stunden", value: `${completedRate}%` },
    { label: "Fehler · 24 Stunden", value: overview.failed24h },
    { label: "Anfragen · 7 Tage", value: overview.requests7d },
    { label: "Eingabe-Tokens · 7 Tage", value: overview.inputTokens7d },
    { label: "Ausgabe-Tokens · 7 Tage", value: overview.outputTokens7d },
    { label: "Antwortzeit · 7 Tage", value: `${overview.averageDurationMs7d} ms` },
  ];

  return (
    <main className="mythoria-page mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <MythoriaPageHeader
        eyebrow="KI-BETRIEB"
        title="Spielleiter-Monitoring"
        description="Datensparsame Kennzahlen für Verfügbarkeit, Laufzeit und Verbrauch des KI-Spielleiters."
        actions={
          <div className="flex flex-wrap gap-3">
            <button
              className="mythoria-button-secondary"
              disabled={refreshing}
              onClick={() => void load()}
            >
              {refreshing ? "Aktualisiert …" : "Aktualisieren"}
            </button>
            <Link href="/dashboard/admin" className="mythoria-button-secondary">
              Systemverwaltung
            </Link>
          </div>
        }
      />
      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <article key={card.label} className="mythoria-card p-5">
            <p className="text-xs text-[var(--mythoria-text-muted)]">
              {card.label}
            </p>
            <p className="mt-2 text-3xl font-bold">{card.value}</p>
          </article>
        ))}
      </section>
      <section className="mt-10 grid gap-5 lg:grid-cols-2">
        <article className="mythoria-panel p-6">
          <h2 className="mythoria-subheading text-xl">Aktive Modelle</h2>
          {overview.models.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--mythoria-text-muted)]">
              Für die letzten sieben Tage liegen noch keine Verbrauchsdaten vor.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {overview.models.map((entry) => (
                <div
                  key={`${entry.provider}-${entry.model}`}
                  className="flex items-center justify-between gap-4 border-b border-[var(--mythoria-border)] pb-3 text-sm last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-bold">{entry.model}</p>
                    <p className="text-xs text-[var(--mythoria-text-muted)]">
                      {entry.provider}
                    </p>
                  </div>
                  <MythoriaBadge variant="gold">{entry.requests} Züge</MythoriaBadge>
                </div>
              ))}
            </div>
          )}
        </article>
        <article className="mythoria-panel p-6">
          <h2 className="mythoria-subheading text-xl">Fehlerbild</h2>
          {overview.recentFailures.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--mythoria-text-muted)]">
              In den letzten sieben Tagen wurden keine fehlgeschlagenen KI-Anfragen protokolliert.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {overview.recentFailures.map((failure) => (
                <div
                  key={failure.errorCode}
                  className="flex items-center justify-between gap-4 border-b border-[var(--mythoria-border)] pb-3 text-sm last:border-0 last:pb-0"
                >
                  <code className="text-[var(--mythoria-text-muted)]">
                    {failure.errorCode}
                  </code>
                  <MythoriaBadge variant="danger">{failure.count}</MythoriaBadge>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
      <MythoriaAlert variant="info" className="mt-10">
        Bei auffälligen Fehlerquoten zuerst die OpenAI-Nutzung und die Vercel-Logs prüfen. Der verbindliche Ablauf steht in der Betriebsdokumentation.
      </MythoriaAlert>
    </main>
  );
}

function rate(completed: number, requests: number) {
  if (requests === 0) return 100;
  return Math.round((completed / requests) * 100);
}
