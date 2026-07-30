import Link from "next/link";

const links = [["Impressum","/impressum"],["Datenschutz","/datenschutz"],["Cookies","/cookies"],["Nutzungsbedingungen","/nutzungsbedingungen"],["Widerruf","/widerruf"],["Support","/support"]] as const;

export function LegalFooter(){return <footer className="border-t border-[var(--mythoria-border)] bg-[var(--mythoria-black)] px-4 py-6"><nav aria-label="Rechtliche Navigation" className="mx-auto flex max-w-7xl flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-[var(--mythoria-text-muted)]">{links.map(([label,href])=><Link key={href} href={href} className="hover:text-[var(--mythoria-gold-light)]">{label}</Link>)}</nav><p className="mx-auto mt-3 max-w-4xl text-center text-[11px] text-[var(--mythoria-text-disabled)]">Mythoria ist ein Fantasy-Rollenspiel. KI-Ausgaben können fehlerhaft oder unerwartet sein und ersetzen keine fachliche Beratung.</p></footer>}
