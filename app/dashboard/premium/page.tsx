"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MythoriaAlert } from "@/components/ui/MythoriaAlert";
import { MythoriaBadge } from "@/components/ui/MythoriaBadge";
import { MythoriaPageHeader } from "@/components/ui/MythoriaPageHeader";
import { MythoriaSpinner } from "@/components/ui/MythoriaSpinner";

type Membership = {
  tier: "free" | "premium";
  status: "active" | "trialing" | "past_due" | "canceled" | "expired";
  currentPeriodEnd: string | null;
};

export default function PremiumPage() {
  const supabase = useMemo(() => createClient(), []);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutBusy, setCheckoutBusy] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      const { data } = await supabase.rpc("get_current_membership");
      setMembership((data as Membership | null) ?? {
        tier: "free",
        status: "active",
        currentPeriodEnd: null,
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [supabase]);

  if (!membership)
    return (
      <main className="mythoria-page flex min-h-screen items-center justify-center">
        <MythoriaSpinner size="large" />
      </main>
    );

  const isPremium = membership.tier === "premium";
  async function startCheckout() {
    setCheckoutBusy(true);
    setCheckoutError("");
    const response = await fetch("/api/premium/checkout", { method: "POST" });
    const payload = (await response.json()) as { url?: string; error?: string };
    if (!response.ok || !payload.url) {
      setCheckoutError(payload.error ?? "Der Checkout konnte nicht gestartet werden.");
      setCheckoutBusy(false);
      return;
    }
    window.location.assign(payload.url);
  }
  return (
    <main className="mythoria-page mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <MythoriaPageHeader
        eyebrow="MITGLIEDSCHAFT"
        title="Mythoria Premium"
        description="Unterstütze die Chroniken und erhalte ein höheres Tageslimit für KI-Abenteuerzüge – ohne Pay-to-Win-Vorteile."
        actions={
          <MythoriaBadge variant={isPremium ? "gold" : "neutral"}>
            {isPremium ? "Premium aktiv" : "Kostenlos spielen"}
          </MythoriaBadge>
        }
      />
      <section className="mt-8 grid gap-5 lg:grid-cols-2">
        <article className="mythoria-card p-6">
          <p className="text-xs font-bold tracking-[.18em] text-[var(--mythoria-text-muted)]">
            KOSTENLOS
          </p>
          <h2 className="mythoria-heading mt-3 text-2xl">Abenteurer</h2>
          <ul className="mt-5 space-y-3 text-sm text-[var(--mythoria-text-secondary)]">
            <li>✦ Voller Zugriff auf Charaktere, Welt und Gruppenfunktionen</li>
            <li>✦ Tägliches Basislimit für KI-Abenteuerzüge</li>
            <li>✦ Keine spielerischen Nachteile</li>
          </ul>
        </article>
        <article className="mythoria-panel border-[var(--mythoria-border-gold)] p-6 shadow-[0_0_34px_rgba(207,163,86,.08)]">
          <p className="text-xs font-bold tracking-[.18em] text-[var(--mythoria-gold-light)]">
            PREMIUM
          </p>
          <h2 className="mythoria-heading mt-3 text-2xl">Chronist</h2>
          <ul className="mt-5 space-y-3 text-sm text-[var(--mythoria-text-secondary)]">
            <li>✦ Höheres tägliches Limit für KI-Abenteuerzüge</li>
            <li>✦ Sichtbarer Premium-Status im Profil</li>
            <li>✦ Alle Spielwerte, Kämpfe und Weltinhalte bleiben fair</li>
          </ul>
          {isPremium ? (
            <MythoriaAlert variant="success" className="mt-6">
              Deine Premium-Mitgliedschaft ist aktiv
              {membership.currentPeriodEnd
                ? ` bis ${new Date(membership.currentPeriodEnd).toLocaleDateString("de-DE")}.`
                : "."}
            </MythoriaAlert>
          ) : (
            <div className="mt-6 space-y-3">
              {checkoutError && <MythoriaAlert variant="error">{checkoutError}</MythoriaAlert>}
              <button className="mythoria-button-primary w-full" disabled={checkoutBusy} onClick={() => void startCheckout()}>
                {checkoutBusy ? "Checkout wird geöffnet …" : "Premium wählen · 5 € / Monat"}
              </button>
              <p className="text-xs text-[var(--mythoria-text-muted)]">Der Checkout öffnet sich sicher bei Stripe. Die Mitgliedschaft wird nach erfolgreicher Zahlung automatisch aktiviert.</p>
            </div>
          )}
        </article>
      </section>
      <section className="mythoria-panel mt-8 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="mythoria-subheading text-xl">Fair für alle</h2>
          <p className="mt-2 max-w-3xl text-sm text-[var(--mythoria-text-muted)]">
            Premium verändert keine Attribute, Beute, Kampfstärke oder Questbelohnungen. Es finanziert den Betrieb des KI-Spielleiters und bleibt ein Komfortangebot.
          </p>
        </div>
        <Link href="/support" className="mythoria-button-secondary">
          Unterstützung ansehen
        </Link>
      </section>
    </main>
  );
}
