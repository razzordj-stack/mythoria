import Link from "next/link";

type Character = {
    id: string;
    name: string;
    race: string;
    characterClass: string;
    level: number;
    background?: string;
};

/*
 * Später ersetzen wir dieses Array durch Charaktere aus Supabase.
 * Lass es zunächst leer, um den leeren Zustand zu testen.
 */
const characters: Character[] = [];

export default function CharactersPage() {
    return (
        <main className="min-h-screen bg-[#030605] px-5 py-10 text-white">
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute left-1/2 top-[-300px] h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[160px]" />

                <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:80px_80px]" />
            </div>

            <div className="relative mx-auto max-w-7xl">
                <header className="flex flex-col gap-6 border-b border-white/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <Link
                            href="/"
                            className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-400 transition hover:text-emerald-300"
                        >
                            Mythoria
                        </Link>

                        <h1 className="mt-4 text-4xl font-black sm:text-5xl">
                            Deine Charaktere
                        </h1>

                        <p className="mt-3 max-w-2xl text-gray-400">
                            Erstelle Helden, verwalte ihre Geschichten und bereite sie auf
                            gemeinsame Abenteuer vor.
                        </p>
                    </div>

                    <Link
                        href="/dashboard/characters/new"
                        className="inline-flex items-center justify-center rounded-xl bg-emerald-400 px-6 py-3 font-black text-black transition hover:bg-emerald-300"
                    >
                        <span className="mr-2 text-xl">+</span>
                        Charakter erstellen
                    </Link>
                </header>

                <section className="mt-8 grid gap-4 sm:grid-cols-3">
                    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                        <p className="text-sm text-gray-500">Charaktere</p>

                        <p className="mt-2 text-3xl font-black text-emerald-400">
                            {characters.length}
                        </p>
                    </article>

                    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                        <p className="text-sm text-gray-500">Höchstes Level</p>

                        <p className="mt-2 text-3xl font-black">
                            {characters.length > 0
                                ? Math.max(...characters.map((character) => character.level))
                                : "–"}
                        </p>
                    </article>

                    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                        <p className="text-sm text-gray-500">Freie Plätze</p>

                        <p className="mt-2 text-3xl font-black">
                            {Math.max(0, 6 - characters.length)}
                        </p>
                    </article>
                </section>

                {characters.length === 0 ? (
                    <EmptyCharacterState />
                ) : (
                    <CharacterGrid characters={characters} />
                )}
            </div>
        </main>
    );
}

function EmptyCharacterState() {
    return (
        <section className="mt-10 flex min-h-[430px] items-center justify-center rounded-[2rem] border border-dashed border-white/15 bg-white/[0.02] px-6 py-14 text-center">
            <div className="max-w-xl">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10 text-5xl">
                    🧙
                </div>

                <p className="mt-8 text-sm font-black uppercase tracking-[0.25em] text-emerald-400">
                    Die Chronik ist noch leer
                </p>

                <h2 className="mt-4 text-3xl font-black">
                    Erschaffe deinen ersten Helden
                </h2>

                <p className="mt-4 leading-7 text-gray-400">
                    Wähle einen Namen, eine Rasse und eine Klasse. Danach kannst du
                    Aussehen, Herkunft und Fähigkeiten deines Charakters festlegen.
                </p>

                <Link
                    href="/dashboard/characters/new"
                    className="mt-8 inline-flex items-center justify-center rounded-xl bg-emerald-400 px-7 py-4 font-black text-black transition hover:-translate-y-1 hover:bg-emerald-300"
                >
                    Charakter erschaffen
                </Link>
            </div>
        </section>
    );
}

function CharacterGrid({ characters }: { characters: Character[] }) {
    return (
        <section className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {characters.map((character) => (
                <article
                    key={character.id}
                    className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition hover:-translate-y-2 hover:border-emerald-400/40"
                >
                    <div className="flex h-52 items-center justify-center bg-gradient-to-br from-emerald-950 to-black text-7xl">
                        ⚔️
                    </div>

                    <div className="p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-black">{character.name}</h2>

                                <p className="mt-1 text-sm text-gray-400">
                                    {character.race} · {character.characterClass}
                                </p>
                            </div>

                            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
                                Level {character.level}
                            </span>
                        </div>

                        <p className="mt-5 line-clamp-3 min-h-[72px] leading-6 text-gray-400">
                            {character.background || "Noch keine Hintergrundgeschichte."}
                        </p>

                        <div className="mt-6 flex gap-3">
                            <Link
                                href={`/dashboard/characters/${character.id}`}
                                className="flex-1 rounded-xl bg-emerald-400 px-4 py-3 text-center font-black text-black transition hover:bg-emerald-300"
                            >
                                Öffnen
                            </Link>

                            <Link
                                href={`/dashboard/characters/${character.id}/edit`}
                                className="rounded-xl border border-white/10 px-4 py-3 font-bold transition hover:border-emerald-400/40"
                            >
                                Bearbeiten
                            </Link>
                        </div>
                    </div>
                </article>
            ))}
        </section>
    );
}