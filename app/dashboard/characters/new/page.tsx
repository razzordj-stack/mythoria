import Link from "next/link";

export default function NewCharacterPage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-[#030605] px-5 text-white">
            <section className="w-full max-w-2xl rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center sm:p-12">
                <div className="text-6xl">⚔️</div>

                <p className="mt-6 text-sm font-black uppercase tracking-[0.25em] text-emerald-400">
                    Charaktereditor
                </p>

                <h1 className="mt-4 text-4xl font-black">
                    Ein neuer Held erwacht
                </h1>

                <p className="mt-5 leading-7 text-gray-400">
                    Hier bauen wir als Nächstes das Formular für Name, Rasse, Klasse und
                    Hintergrundgeschichte.
                </p>

                <Link
                    href="/dashboard/characters"
                    className="mt-8 inline-flex rounded-xl border border-white/10 px-6 py-3 font-bold transition hover:border-emerald-400/50 hover:text-emerald-300"
                >
                    Zurück zur Übersicht
                </Link>
            </section>
        </main>
    );
}