import Link from "next/link";

type CharacterDetailPageProps = {
    params: Promise<{
        id: string;
    }>;
};

export default async function CharacterDetailPage({
    params,
}: CharacterDetailPageProps) {
    const { id } = await params;

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#030605] px-5 text-white">
            <div className="pointer-events-none absolute left-1/2 top-[-300px] h-[750px] w-[750px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[170px]" />

            <section className="relative w-full max-w-2xl rounded-[2rem] border border-emerald-400/20 bg-white/[0.025] p-8 text-center sm:p-12">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10 text-4xl">
                    ⚔️
                </div>

                <p className="mt-7 text-sm font-black uppercase tracking-[0.25em] text-emerald-400">
                    Charakter gespeichert
                </p>

                <h1 className="mt-4 text-3xl font-black sm:text-5xl">
                    Dein Held wurde erschaffen
                </h1>

                <p className="mt-5 leading-7 text-gray-400">
                    Der Charakter befindet sich nun sicher in der Chronik von Mythoria.
                    Im nächsten Entwicklungsschritt laden wir hier alle gespeicherten
                    Charakterdaten.
                </p>

                <div className="mt-6 rounded-xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs uppercase tracking-wider text-gray-600">
                        Charakter-ID
                    </p>

                    <p className="mt-2 break-all font-mono text-sm text-emerald-300">
                        {id}
                    </p>
                </div>

                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                    <Link
                        href="/dashboard/characters"
                        className="rounded-xl bg-emerald-400 px-6 py-3 font-black text-black transition hover:bg-emerald-300"
                    >
                        Zur Charakterübersicht
                    </Link>

                    <Link
                        href="/dashboard"
                        className="rounded-xl border border-white/10 px-6 py-3 font-bold text-gray-300 transition hover:border-emerald-400/40"
                    >
                        Zum Dashboard
                    </Link>
                </div>
            </section>
        </main>
    );
}