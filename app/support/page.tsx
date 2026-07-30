import Link from "next/link";
import { MythoriaLogo } from "@/components/branding/MythoriaLogo";

const milestones = [
  [
    "01",
    "Grundsystem",
    "Next.js, Supabase, Authentifizierung und abgesicherte Profile.",
  ],
  [
    "02",
    "Charaktere & Progression",
    "Attribute, Level, Inventar, Fähigkeiten, Quests und Ruf.",
  ],
  [
    "03",
    "Lebendige Welt",
    "Reisen, Orte, Händler, Begleiter und persistente Abenteuerchroniken.",
  ],
  [
    "04",
    "Gemeinschaft",
    "Freunde, Gilden, Gruppen, Benachrichtigungen und Administration.",
  ],
  [
    "05",
    "Live-Spielbrett",
    "Battlemaps, Fog of War, Tokens, SL-Werkzeuge und Gruppenwürfe.",
  ],
  [
    "06",
    "Studio-Design",
    "Responsive Oberfläche mit gebietsabhängiger Atmosphäre.",
  ],
] as const;
const roadmap = [
  [
    "Jetzt",
    "Release-Stabilisierung",
    "Health-Check, Public API, vollständige Tests und Fehlerbehebung.",
  ],
  [
    "Danach",
    "Mehrspieler vertiefen",
    "Gemeinsame Sitzungen, Gruppenchat, Zugreihenfolge und Live-Ereignisse.",
  ],
  [
    "Inhalt",
    "Mythoria erweitern",
    "Weitere Karten, Dungeons, Gegner, Quests und Balancing.",
  ],
  [
    "Abschluss",
    "KI-Spielleiter finalisieren",
    "Kostenlimits, Fallbacks, Sicherheit und lange Spielsitzungen abnehmen.",
  ],
] as const;
const support = [
  [
    "⚔",
    "Spiel testen",
    "Spiele vorhandene Systeme und melde reproduzierbare Fehler.",
  ],
  [
    "◆",
    "Feedback geben",
    "Melde unklare Abläufe, Navigation oder Balancing-Probleme konkret.",
  ],
  [
    "📖",
    "Inhalte mitdenken",
    "Ideen für Quests, Orte, Gegner und Begegnungen helfen beim Ausbau.",
  ],
  [
    "♧",
    "Projekt teilen",
    "Lade interessierte Rollenspieler später zu gemeinsamen Tests ein.",
  ],
] as const;
const packages = [
  { price:"Frei wählbar", name:"Freier Beitrag", tag:"Einmalig", description:"Unterstützung ohne zugesagte Gegenleistung. Optionaler Dank im Unterstützerbereich.", rewards:["Betrag selbst bestimmen","Öffentlicher Dank nur auf Wunsch","Keine Spielvorteile"] },
  { price:"5 €", name:"Chronist", tag:"Monatlich", description:"Für regelmäßige Begleitung der Entwicklung.", rewards:["Kosmetisches Unterstützerabzeichen","Monatlicher Entwicklungsbericht","Abstimmungen über kommende Inhalte"] },
  { price:"25 €", name:"Eigener Held", tag:"Einmalig · limitiert", description:"Dein Charakterkonzept kann als optionaler NPC in Mythoria erscheinen.", rewards:["Name und Kurzgeschichte einreichen","Redaktionell angepasster NPC-Auftritt","Nennung im Unterstützerbuch"] },
  { price:"50 €", name:"Weltenformer", tag:"Einmalig · limitiert", description:"Gestalte gemeinsam einen kleinen Ort, Gegenstand oder eine Begegnung.", rewards:["Gemeinsamer Konzeptentwurf","Ein redaktionell geprüfter Weltinhalt","Nennung im Unterstützerbuch"] },
] as const;

const stripeSupportLink = process.env.NEXT_PUBLIC_STRIPE_SUPPORT_LINK;

export default function SupportPage() {
  return (
    <main className="mythoria-page min-h-screen overflow-hidden">
      <nav className="sticky top-0 z-40 border-b border-[var(--mythoria-border)] bg-[var(--mythoria-black)]/90 px-4 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4">
          <Link href="/" aria-label="Zur Startseite">
            <MythoriaLogo size="small" />
          </Link>
          <div className="flex gap-2">
            <Link href="/login" className="mythoria-button-secondary">
              Einloggen
            </Link>
            <Link
              href="/register"
              className="mythoria-button-primary hidden sm:inline-flex"
            >
              Mitspielen
            </Link>
          </div>
        </div>
      </nav>
      <section className="relative border-b border-[var(--mythoria-border)] px-4 py-20 text-center">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(147,182,64,.18),transparent_38%)]"
        />
        <div className="relative mx-auto max-w-4xl">
          <p className="text-xs font-bold tracking-[.24em] text-[var(--mythoria-green-bright)]">
            MYTHORIA UNTERSTÜTZEN
          </p>
          <h1 className="mythoria-heading mt-4">
            Hilf uns, die nächste Chronik zu schreiben
          </h1>
          <p className="mx-auto mt-5 max-w-2xl leading-8 text-[var(--mythoria-text-secondary)]">
            Mythoria entsteht unabhängig und Schritt für Schritt. Unterstützung
            ist immer freiwillig – durch Tests, ehrliches Feedback, kreative
            Ideen oder später einen finanziellen Beitrag.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/register" className="mythoria-button-primary">
              Als Tester mitspielen
            </Link>
            <a href="#roadmap" className="mythoria-button-secondary">
              Roadmap ansehen
            </a>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <p className="text-xs font-bold tracking-[.2em] text-[var(--mythoria-green-bright)]">
          SO KANNST DU HELFEN
        </p>
        <h2 className="mythoria-heading mt-2">
          Unterstützung ohne Verpflichtung
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {support.map(([icon, title, text]) => (
            <article key={title} className="mythoria-card p-5">
              <span className="text-2xl text-[var(--mythoria-neon-soft)]">
                {icon}
              </span>
              <h3 className="mt-3 text-lg">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--mythoria-text-muted)]">
                {text}
              </p>
            </article>
          ))}
        </div>
        <div className="mt-14"><p className="text-xs font-bold tracking-[.2em] text-[var(--mythoria-green-bright)]">UNTERSTÜTZERPAKETE</p><h2 className="mythoria-heading mt-2">Belohnungen ohne Pay-to-Win</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--mythoria-text-muted)]">Alle Belohnungen bleiben kosmetisch oder redaktionell. Unterstützer erhalten keine stärkeren Charaktere, exklusiven Kampfwerte oder spielerischen Vorteile.</p><div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{packages.map((item, index)=><article key={item.name} className="mythoria-card flex flex-col p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold tracking-[.12em] text-[var(--mythoria-green-bright)]">{item.tag.toUpperCase()}</p><h3 className="mt-2 text-xl">{item.name}</h3></div><strong className="whitespace-nowrap text-lg text-[var(--mythoria-gold-light)]">{item.price}</strong></div><p className="mt-3 text-sm leading-6 text-[var(--mythoria-text-muted)]">{item.description}</p><ul className="mt-4 flex-1 space-y-2 text-sm text-[var(--mythoria-text-secondary)]">{item.rewards.map(reward=><li key={reward}>✦ {reward}</li>)}</ul>{index === 0 && stripeSupportLink ? <a href={stripeSupportLink} target="_blank" rel="noreferrer" className="mythoria-button-primary mt-5 w-full">Im Testmodus unterstützen ↗</a> : <button type="button" disabled className="mythoria-button-secondary mt-5 w-full">Noch nicht buchbar</button>}</article>)}</div></div>
        <aside className="mythoria-panel mt-8 grid gap-5 border-[var(--mythoria-border-gold)] p-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-xs font-bold tracking-[.18em] text-[var(--mythoria-green-bright)]">
              OFFIZIELLER COMMUNITY-SUPPORT
            </p>
            <h3 className="mt-2 text-xl">Mythoria auf Discord</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--mythoria-text-muted)]">
              Stelle Fragen, melde Fehler, teile Feedback und tausche dich mit
              anderen Spielern über die Entwicklung von Mythoria aus.
            </p>
          </div>
          <a
            href="https://discord.gg/S3kvQ5hJK"
            target="_blank"
            rel="noreferrer"
            className="mythoria-button-primary justify-center"
          >
            Discord beitreten ↗
          </a>
        </aside>
        <p className="mt-3 text-xs text-[var(--mythoria-text-disabled)]">
          Discord ist der Community-Supportkanal. Persönliche Daten, Passwörter
          oder API-Schlüssel dürfen dort niemals veröffentlicht werden.
        </p>
        <aside className="mythoria-panel mt-8 grid gap-5 p-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-xs font-bold tracking-[.18em] text-[var(--mythoria-gold-light)]">
              FINANZIELLE UNTERSTÜTZUNG
            </p>
            <h3 className="mt-2 text-xl">Noch nicht freigeschaltet</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--mythoria-text-muted)]">
              Ein offizieller Unterstützungsweg wird erst veröffentlicht, wenn
              Zahlungsanbieter, Datenschutz, Kostenverwendung und rechtliche
              Angaben vollständig eingerichtet sind.
            </p>
          </div>
          <span className="rounded-full border border-[var(--mythoria-border)] px-4 py-2 text-xs font-bold text-[var(--mythoria-text-muted)]">
            IN VORBEREITUNG
          </span>
        </aside>
        <section className="mt-8 grid gap-4 lg:grid-cols-2"><article className="mythoria-panel border-[var(--mythoria-border-gold)] p-6"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold tracking-[.18em] text-[var(--mythoria-green-bright)]">EMPFOHLENE UMSETZUNG</p><h3 className="mt-2 text-xl">Stripe Payment Links</h3></div><span className="rounded-full border border-[var(--mythoria-success)]/40 px-3 py-1 text-[10px] font-bold text-[var(--mythoria-success)]">EMPFOHLEN</span></div><p className="mt-3 text-sm leading-6 text-[var(--mythoria-text-muted)]">Passt am besten zur eigenen Mythoria-Seite: freie Beträge, Einmalzahlungen und Abonnements über einen gehosteten deutschen Checkout. Die späteren Buttons können direkt mit einzelnen Payment Links verbunden werden.</p><a href="https://stripe.com/de/payments" target="_blank" rel="noreferrer" className="mythoria-button-secondary mt-5">Stripe ansehen ↗</a></article><article className="mythoria-card p-6"><p className="text-xs font-bold tracking-[.18em] text-[var(--mythoria-gold-light)]">ALTERNATIVE</p><h3 className="mt-2 text-xl">Patreon-Mitgliedschaften</h3><p className="mt-3 text-sm leading-6 text-[var(--mythoria-text-muted)]">Geeignet, wenn Community-Beiträge und regelmäßige Entwicklungsupdates wichtiger sind als eine vollständig eigene Checkout-Erfahrung. Neue Creator-Seiten liegen laut Patreon im Standardplan bei 10 % Plattformgebühr zuzüglich weiterer Gebühren.</p><a href="https://support.patreon.com/hc/en-us/articles/11111747095181-Creator-fees-overview" target="_blank" rel="noreferrer" className="mythoria-button-secondary mt-5">Patreon vergleichen ↗</a></article></section>
        <div className="mt-5 rounded-xl border border-[var(--mythoria-warning)]/35 bg-[var(--mythoria-warning)]/5 p-4 text-sm leading-6 text-[var(--mythoria-text-muted)]"><strong className="text-[var(--mythoria-warning)]">Wichtiger Hinweis:</strong> Pakete mit einem eigenen Helden, NPC oder Weltinhalt sind Gegenleistungen und sollten als Verkauf beziehungsweise Unterstützerpaket behandelt werden. Vor Freischaltung werden Impressum, Datenschutz, Preisangaben, Widerrufsprozess und steuerliche Behandlung geprüft. Mythoria stellt keine Spendenbescheinigungen aus.</div>
      </section>
      <section className="border-y border-[var(--mythoria-border)] bg-[var(--mythoria-surface)]/55 px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold tracking-[.2em] text-[var(--mythoria-green-bright)]">
            ABGESCHLOSSEN
          </p>
          <h2 className="mythoria-heading mt-2">Was bereits entstanden ist</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {milestones.map(([number, title, text]) => (
              <article key={number} className="mythoria-card p-5">
                <div className="flex items-center gap-3">
                  <span className="font-fantasy text-xl font-black text-[var(--mythoria-border-gold)]">
                    {number}
                  </span>
                  <span className="rounded-full border border-[var(--mythoria-success)]/30 px-2 py-0.5 text-[10px] font-bold text-[var(--mythoria-success)]">
                    ABGESCHLOSSEN
                  </span>
                </div>
                <h3 className="mt-3 text-lg">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--mythoria-text-muted)]">
                  {text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section
        id="roadmap"
        className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6"
      >
        <p className="text-xs font-bold tracking-[.2em] text-[var(--mythoria-green-bright)]">
          ÖFFENTLICHE ROADMAP
        </p>
        <h2 className="mythoria-heading mt-2">Die nächsten Kapitel</h2>
        <div className="mt-8 space-y-3">
          {roadmap.map(([phase, title, text], index) => (
            <article
              key={phase}
              className="mythoria-panel grid gap-4 p-5 sm:grid-cols-[100px_1fr_auto] sm:items-center"
            >
              <span className="text-xs font-black tracking-[.14em] text-[var(--mythoria-gold-light)]">
                {phase.toUpperCase()}
              </span>
              <div>
                <h3 className="text-base">{title}</h3>
                <p className="mt-1 text-sm text-[var(--mythoria-text-muted)]">
                  {text}
                </p>
              </div>
              <span className="text-xs text-[var(--mythoria-text-disabled)]">
                {index + 1}/4
              </span>
            </article>
          ))}
        </div>
      </section>
      <section className="border-t border-[var(--mythoria-border)] px-4 py-16 text-center">
        <h2 className="mythoria-heading">Werde Teil der Entwicklung</h2>
        <p className="mx-auto mt-3 max-w-xl text-[var(--mythoria-text-muted)]">
          Die wertvollste Unterstützung ist derzeit ein echter Spieltest mit
          nachvollziehbarem Feedback.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/register" className="mythoria-button-primary">
            Kostenlos mitspielen
          </Link>
          <Link href="/" className="mythoria-button-secondary">
            Zur Startseite
          </Link>
        </div>
      </section>
    </main>
  );
}
