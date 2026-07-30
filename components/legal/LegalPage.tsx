import Link from "next/link";
import { MythoriaLogo } from "@/components/branding/MythoriaLogo";
import { legalUpdated } from "@/lib/legal";

export function LegalPage({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return <main className="mythoria-page min-h-screen px-4 py-10 sm:px-6"><div className="mx-auto max-w-4xl"><Link href="/" aria-label="Zur Startseite"><MythoriaLogo size="small" /></Link><article className="mythoria-panel mt-8 p-6 sm:p-10"><p className="text-xs font-bold tracking-[.18em] text-[var(--mythoria-green-bright)]">RECHTLICHE INFORMATIONEN</p><h1 className="mythoria-heading mt-3">{title}</h1><p className="mt-4 leading-7 text-[var(--mythoria-text-secondary)]">{intro}</p><p className="mt-2 text-xs text-[var(--mythoria-text-disabled)]">Stand: {legalUpdated}</p><div className="legal-content mt-9 space-y-8">{children}</div></article></div></main>;
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="text-xl text-[var(--mythoria-gold-light)]">{title}</h2><div className="mt-3 space-y-3 leading-7 text-[var(--mythoria-text-secondary)]">{children}</div></section>;
}
