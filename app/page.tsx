import Link from "next/link";
import { MythoriaLogo } from "@/components/branding/MythoriaLogo";

const features = [
  ["♧", "Mehrspieler", "Gemeinsame Legenden und Gruppenabenteuer."],
  ["◆", "Würfelsystem", "Entscheidungen mit echten Konsequenzen."],
  [
    "📖",
    "Epische Geschichten",
    "Eine KI reagiert dynamisch auf deinen Helden.",
  ],
  [
    "⚔",
    "Taktische Kämpfe",
    "Fähigkeiten, Ausrüstung und kluge Entscheidungen.",
  ],
  ["⌖", "Endlose Welten", "Orte, Figuren und Chroniken, die sich verändern."],
] as const;

const steps = [
  [
    "01",
    "Charakter erschaffen",
    "Wähle Herkunft, Klasse und persönliche Geschichte.",
  ],
  ["02", "Abenteuer wählen", "Nimm Quests an und betrete unbekannte Regionen."],
  [
    "03",
    "Entscheidung treffen",
    "Sprich, kämpfe, handle oder suche einen eigenen Weg.",
  ],
  [
    "04",
    "Welt verändern",
    "Mythoria bewahrt Konsequenzen und deinen Fortschritt.",
  ],
] as const;

export default function HomePage() {
  return (
    <main className="mythoria-page overflow-hidden">
      <section className="relative flex min-h-screen items-center justify-center px-4 py-16 text-center">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(86,121,31,.2),transparent_34%),radial-gradient(circle_at_18%_70%,rgba(162,157,114,.08),transparent_25%)]"
        />
        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center">
          <MythoriaLogo size="hero" priority />
          <p className="mythoria-gold-text mt-5 font-fantasy text-lg font-bold tracking-[.08em] sm:text-2xl">
            Jeder Würfelwurf schreibt Geschichte.
          </p>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--mythoria-text-secondary)] sm:text-lg">
            Erschaffe deinen Helden und erlebe ein KI-Fantasy-Rollenspiel,
            dessen Dungeon Master auf deine Herkunft, Entscheidungen und Taten
            reagiert.
          </p>
          <div className="mt-8 flex w-full max-w-2xl flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/register" className="mythoria-button-primary flex-1">
              Abenteuer beginnen
            </Link>
            <a
              href="#mehr-erfahren"
              className="mythoria-button-secondary flex-1"
            >
              Mehr erfahren
            </a>
            <Link href="/support" className="mythoria-button-secondary flex-1">
              Projekt unterstützen
            </Link>
          </div>
        </div>
      </section>
      <section
        id="mehr-erfahren"
        className="mx-auto max-w-[1440px] px-4 py-20 sm:px-6 lg:px-10"
      >
        <div className="text-center">
          <p className="text-sm font-bold tracking-[.18em] text-[var(--mythoria-green-bright)]">
            DIE SÄULEN MYTHORIAS
          </p>
          <h2 className="mythoria-heading mt-3">
            Deine Legende. Deine Entscheidungen.
          </h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {features.map(([icon, title, text]) => (
            <article
              key={title}
              className="mythoria-card mythoria-card-interactive p-5"
            >
              <span
                aria-hidden="true"
                className="text-3xl text-[var(--mythoria-neon-soft)]"
              >
                {icon}
              </span>
              <h3 className="mythoria-subheading mt-4 text-lg">{title}</h3>
              <p className="mt-2 text-sm text-[var(--mythoria-text-muted)]">
                {text}
              </p>
            </article>
          ))}
        </div>
      </section>
      <section className="border-y border-[var(--mythoria-border)] bg-[var(--mythoria-surface)]/70 px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mythoria-heading text-center">
            So funktioniert Mythoria
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {steps.map(([number, title, text]) => (
              <article key={number} className="mythoria-panel p-6">
                <span className="font-fantasy text-3xl font-bold text-[var(--mythoria-border-gold)]">
                  {number}
                </span>
                <h3 className="mt-4 text-xl">{title}</h3>
                <p className="mt-2 text-sm text-[var(--mythoria-text-muted)]">
                  {text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-24 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-sm font-bold tracking-[.18em] text-[var(--mythoria-green-bright)]">
            KI-DUNGEON-MASTER
          </p>
          <h2 className="mythoria-heading mt-3">
            Eine Chronik, die dir zuhört
          </h2>
          <p className="mt-5 leading-8 text-[var(--mythoria-text-secondary)]">
            Der Dungeon Master berücksichtigt Charakterwerte, Vorgeschichte,
            Inventar, aktive Quests und frühere Entscheidungen. Dadurch
            entstehen Szenen, Dialoge und Konsequenzen, die zu deinem
            persönlichen Abenteuer gehören.
          </p>
        </div>
        <div className="mythoria-panel p-7">
          <ul className="space-y-5 text-[var(--mythoria-text-secondary)]">
            <li>✦ Dynamische Geschichten statt starrer Dialogbäume</li>
            <li>✦ Entscheidungen mit späteren Konsequenzen</li>
            <li>✦ Dauerhaft gespeicherte Charakterentwicklung</li>
          </ul>
        </div>
      </section>
      <section className="border-y border-[var(--mythoria-border)] bg-[var(--mythoria-surface)]/55 px-4 py-14">
        <div className="mythoria-panel mx-auto grid max-w-5xl gap-6 border-[var(--mythoria-border-gold)] p-6 sm:p-8 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-xs font-bold tracking-[.18em] text-[var(--mythoria-green-bright)]">
              COMMUNITY & SUPPORT
            </p>
            <h2 className="mythoria-heading mt-2 text-2xl">
              Tritt dem Mythoria-Discord bei
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--mythoria-text-muted)]">
              Erhalte Hilfe, melde Fehler, teile deine Ideen und tausche dich
              mit anderen Spielern über die Entwicklung von Mythoria aus.
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
        </div>
      </section>
      <section className="border-t border-[var(--mythoria-border)] px-4 py-20 text-center">
        <h2 className="mythoria-heading">Öffne deine Chronik</h2>
        <p className="mx-auto mt-4 max-w-xl text-[var(--mythoria-text-muted)]">
          Mythoria wartet auf den Helden, den nur du erschaffen kannst.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/register" className="mythoria-button-primary">
            Konto erstellen
          </Link>
          <Link href="/login" className="mythoria-button-secondary">
            Einloggen
          </Link>
          <Link href="/support" className="mythoria-button-secondary">
            Roadmap & Unterstützung
          </Link>
        </div>
      </section>
    </main>
  );
}
