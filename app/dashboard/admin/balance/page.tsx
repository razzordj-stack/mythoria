"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MythoriaAlert } from "@/components/ui/MythoriaAlert";
import { MythoriaPageHeader } from "@/components/ui/MythoriaPageHeader";
import { MythoriaSpinner } from "@/components/ui/MythoriaSpinner";

type Overview = {
  locations: number;
  quests: number;
  enemies: number;
  recipes: number;
  merchants: number;
  questReward: {
    xpMin: number;
    xpMax: number;
    goldMin: number;
    goldMax: number;
  };
  enemyStrength: {
    levelMin: number;
    levelMax: number;
    healthMin: number;
    healthMax: number;
  };
  activity: { combatSessions7d: number; completedCombats7d: number };
};

export default function BalancePage() {
  const supabase = useMemo(() => createClient(), []);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(async () => {
      const { data, error: rpcError } = await supabase.rpc(
        "get_content_balance_overview",
      );
      if (rpcError)
        setError("Du besitzt keine Berechtigung für die Inhaltsbalance.");
      else setOverview(data as Overview);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [supabase]);
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
  const cards = [
    { label: "Orte", value: overview.locations },
    { label: "Quests", value: overview.quests },
    { label: "Gegner", value: overview.enemies },
    { label: "Rezepte", value: overview.recipes },
    { label: "Händler", value: overview.merchants },
    { label: "Kämpfe · 7 Tage", value: overview.activity.combatSessions7d },
  ];
  return (
    <main className="mythoria-page mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <MythoriaPageHeader
        eyebrow="INHALTSBALANCE"
        title="Welt, Belohnungen und Spielaktivität"
        description="Echte Kennzahlen aus Mythoria für die laufende Qualitäts- und Balancing-Arbeit."
        actions={
          <Link href="/dashboard/admin" className="mythoria-button-secondary">
            Systemverwaltung
          </Link>
        }
      />
      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
          <h2 className="mythoria-subheading text-xl">Quest-Belohnungen</h2>
          <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
            <Metric
              label="EP-Spanne"
              value={`${overview.questReward.xpMin}–${overview.questReward.xpMax}`}
            />
            <Metric
              label="Gold-Spanne"
              value={`${overview.questReward.goldMin}–${overview.questReward.goldMax}`}
            />
          </dl>
        </article>
        <article className="mythoria-panel p-6">
          <h2 className="mythoria-subheading text-xl">Gegnerstärke</h2>
          <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
            <Metric
              label="Stufen"
              value={`${overview.enemyStrength.levelMin}–${overview.enemyStrength.levelMax}`}
            />
            <Metric
              label="Lebenspunkte"
              value={`${overview.enemyStrength.healthMin}–${overview.enemyStrength.healthMax}`}
            />
          </dl>
        </article>
        <article className="mythoria-panel p-6 lg:col-span-2">
          <h2 className="mythoria-subheading text-xl">Spieltests</h2>
          <p className="mt-3 text-sm text-[var(--mythoria-text-muted)]">
            Siege in den letzten sieben Tagen:{" "}
            <strong className="text-[var(--mythoria-gold-light)]">
              {overview.activity.completedCombats7d}
            </strong>
            . Nutze die Kennzahlen als Grundlage für Anpassungen an
            Gegnerstärke, Belohnungen und Rezeptkosten.
          </p>
        </article>
      </section>
    </main>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[var(--mythoria-text-muted)]">{label}</dt>
      <dd className="mt-1 text-xl font-bold">{value}</dd>
    </div>
  );
}
