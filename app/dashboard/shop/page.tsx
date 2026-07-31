import Link from "next/link";
import { MythoriaBadge } from "@/components/ui/MythoriaBadge";
import { MythoriaPageHeader } from "@/components/ui/MythoriaPageHeader";

const collections = [
  { code: "TS", title: "T-Shirts", description: "Shirts mit Mythoria-Logo, Wappen und Motiven aus den Reichen." },
  { code: "HD", title: "Hoodies", description: "Dunkle Kapuzenpullover für lange Abenteuer und kalte Nächte." },
  { code: "AC", title: "Accessoires", description: "Becher, Poster und weitere Sammlerstücke aus der Welt von Mythoria." },
] as const;

export default function ShopPage() {
  return (
    <main className="mythoria-page mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <MythoriaPageHeader
        eyebrow="MYTHORIA MERCHANDISE"
        title="Trage ein Stück Mythoria"
        description="Hier entsteht der offizielle Markenshop für Kleidung, Sammlerstücke und ausgewählte Editionen. Die Vorschau enthält noch keine Preise oder Bestellfunktion."
        actions={<MythoriaBadge variant="gold">In Vorbereitung</MythoriaBadge>}
      />

      <section className="mt-8 overflow-hidden rounded-3xl border border-[var(--mythoria-border-gold)] bg-[linear-gradient(135deg,rgba(38,59,13,.42),rgba(11,14,8,.94)_48%,rgba(73,47,12,.35))] p-6 shadow-2xl shadow-black/30 sm:p-9">
        <div className="max-w-2xl">
          <p className="text-xs font-bold tracking-[.24em] text-[var(--mythoria-gold-light)]">ERSTE KOLLEKTION</p>
          <h2 className="mt-3 text-2xl font-black text-[var(--mythoria-text)] sm:text-4xl">Die Chroniken-Kollektion</h2>
          <p className="mt-4 leading-7 text-[var(--mythoria-text-muted)]">
            Hochwertige Markenartikel im düsteren Fantasy-Stil von Mythoria. Produktbilder,
            Größen, Materialien und Lieferinformationen werden vor der Eröffnung ergänzt.
          </p>
        </div>
      </section>

      <section aria-labelledby="shop-categories" className="mt-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold tracking-[.2em] text-[var(--mythoria-green-bright)]">GEPLANTES SORTIMENT</p>
            <h2 id="shop-categories" className="mt-1 text-2xl font-black">Aus der Schmiede</h2>
          </div>
          <span className="text-xs text-[var(--mythoria-text-disabled)]">Noch nicht bestellbar</span>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {collections.map((collection) => (
            <article key={collection.title} className="mythoria-card overflow-hidden p-0">
              <div className="flex aspect-[4/3] items-center justify-center border-b border-[var(--mythoria-border)] bg-[radial-gradient(circle,rgba(147,182,64,.17),transparent_62%)]">
                <span className="flex h-24 w-24 items-center justify-center rounded-full border border-[var(--mythoria-border-gold)] bg-black/30 font-fantasy text-3xl font-black text-[var(--mythoria-gold-light)]">{collection.code}</span>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl font-black">{collection.title}</h3>
                  <MythoriaBadge>Bald</MythoriaBadge>
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--mythoria-text-muted)]">{collection.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mythoria-panel mt-8 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black">Der Shop öffnet später</h2>
          <p className="mt-2 text-sm text-[var(--mythoria-text-muted)]">Bis dahin kannst du die Entwicklung verfolgen und Mythoria über die Support-Seite unterstützen.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/support" className="mythoria-button-primary">Projekt unterstützen</Link>
          <Link href="/dashboard" className="mythoria-button-secondary">Zum Dashboard</Link>
        </div>
      </section>
    </main>
  );
}
