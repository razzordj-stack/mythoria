import Link from "next/link";

type Feature = {
    icon: string;
    title: string;
    description: string;
};

type GameStep = {
    number: string;
    title: string;
    description: string;
};

type RoadmapPhase = {
    number: string;
    title: string;
    description: string;
    status: "completed" | "active" | "planned";
};

const features: Feature[] = [
    {
        icon: "🧙",
        title: "KI-Spielleiter",
        description:
            "Eine intelligente Spielleitung erschafft Szenen, verkörpert NPCs und reagiert dynamisch auf jede Entscheidung.",
    },
    {
        icon: "👥",
        title: "Gemeinsame Abenteuer",
        description:
            "Erstelle eine Gruppe, lade Freunde ein und erlebt zusammen eine fortlaufende Fantasy-Kampagne.",
    },
    {
        icon: "🎲",
        title: "Faires Regelsystem",
        description:
            "Würfelwürfe, Attribute, Schaden und Lebenspunkte werden transparent durch eine eigene Regel-Engine berechnet.",
    },
    {
        icon: "🧠",
        title: "Lebendige Erinnerungen",
        description:
            "Mythoria erinnert sich an Entscheidungen, Verbündete, Feinde, Versprechen und vergangene Abenteuer.",
    },
    {
        icon: "🌍",
        title: "Dynamische Welten",
        description:
            "Königreiche, Fraktionen und Orte verändern sich dauerhaft durch die Handlungen der Spieler.",
    },
    {
        icon: "⚔️",
        title: "Taktische Kämpfe",
        description:
            "Rundenbasierte Gefechte mit Initiative, Fähigkeiten, Zaubern, Zuständen, Beute und kritischen Treffern.",
    },
];

const gameSteps: GameStep[] = [
    {
        number: "01",
        title: "Erschaffe deinen Helden",
        description:
            "Wähle Name, Rasse, Klasse, Hintergrundgeschichte, Aussehen und Attribute.",
    },
    {
        number: "02",
        title: "Gründe eine Gruppe",
        description:
            "Lade Freunde ein oder beginne dein Abenteuer als einsamer Reisender.",
    },
    {
        number: "03",
        title: "Betritt deine Welt",
        description:
            "Die KI erschafft Schauplätze, Bewohner, Konflikte und eine Geschichte für eure Gruppe.",
    },
    {
        number: "04",
        title: "Schreibe deine Legende",
        description:
            "Jede Entscheidung verändert Beziehungen, Städte, Königreiche und den Verlauf der Kampagne.",
    },
];

const roadmap: RoadmapPhase[] = [
    {
        number: "01",
        title: "Grundprojekt",
        description:
            "Next.js, Tailwind CSS, Vercel, Branding und die technische Grundlage von Mythoria.",
        status: "completed",
    },
    {
        number: "02",
        title: "Charaktersystem",
        description:
            "Charakterübersicht, Editor, Rassen, Klassen, Attribute und Supabase-Speicherung.",
        status: "active",
    },
    {
        number: "03",
        title: "Multiplayer",
        description:
            "Lobbys, Gruppen, Einladungen, Rollen und gemeinsame Kampagnen.",
        status: "planned",
    },
    {
        number: "04",
        title: "Regel-Engine",
        description:
            "Würfelwürfe, Kämpfe, Lebenspunkte, Inventar und Statuswerte.",
        status: "planned",
    },
    {
        number: "05",
        title: "KI-Spielleiter",
        description:
            "Dynamische Geschichten, NPCs, Quests und langfristige Welterinnerungen.",
        status: "planned",
    },
];

export default function HomePage() {
    return (
        <main className="relative min-h-screen overflow-hidden bg-[#030605] text-white">
            <BackgroundEffects />

            <MainHeader />

            <HeroSection />

            <StatisticsSection />

            <FeatureSection />

            <GameFlowSection />

            <WorldPreviewSection />

            <RoadmapSection />

            <CallToActionSection />

            <MainFooter />
        </main>
    );
}

function BackgroundEffects() {
    return (
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
            <div className="absolute left-1/2 top-[-350px] h-[850px] w-[850px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[190px]" />

            <div className="absolute bottom-[-300px] right-[-220px] h-[650px] w-[650px] rounded-full bg-green-900/10 blur-[180px]" />

            <div className="absolute left-[-250px] top-[45%] h-[500px] w-[500px] rounded-full bg-emerald-950/20 blur-[170px]" />

            <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:80px_80px]" />

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#030605_82%)]" />
        </div>
    );
}

function MainHeader() {
    return (
        <header className="fixed left-0 top-0 z-50 w-full border-b border-white/10 bg-black/75 backdrop-blur-2xl">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
                <Link href="/" className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-400/10 text-xl">
                        🎲
                    </div>

                    <div>
                        <p className="text-lg font-black tracking-[0.22em] text-emerald-400">
                            MYTHORIA
                        </p>

                        <p className="text-[10px] uppercase tracking-[0.25em] text-gray-500">
                            Forge your legend
                        </p>
                    </div>
                </Link>

                <nav className="hidden items-center gap-7 text-sm text-gray-400 lg:flex">
                    <a href="#features" className="transition hover:text-white">
                        Features
                    </a>

                    <a href="#gameplay" className="transition hover:text-white">
                        Spielablauf
                    </a>

                    <a href="#world" className="transition hover:text-white">
                        Spielwelt
                    </a>

                    <a href="#roadmap" className="transition hover:text-white">
                        Roadmap
                    </a>
                </nav>

                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard"
                        className="hidden rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-gray-300 transition hover:border-emerald-400/40 hover:text-white sm:inline-flex"
                    >
                        Dashboard
                    </Link>

                    <Link
                        href="/dashboard/characters/new"
                        className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-black text-black transition hover:bg-emerald-300"
                    >
                        Charakter erstellen
                    </Link>
                </div>
            </div>
        </header>
    );
}

function HeroSection() {
    return (
        <section className="relative flex min-h-screen items-center px-5 pb-20 pt-32 sm:px-8">
            <div className="mx-auto grid w-full max-w-7xl items-center gap-16 lg:grid-cols-[1.1fr_0.9fr]">
                <div>
                    <div className="inline-flex items-center gap-3 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-300">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                        KI-gestütztes Multiplayer-Rollenspiel
                    </div>

                    <h1 className="mt-8 max-w-4xl text-5xl font-black leading-[0.96] sm:text-7xl xl:text-8xl">
                        Eure Welt.
                        <span className="mt-3 block bg-gradient-to-r from-emerald-200 via-emerald-400 to-green-700 bg-clip-text text-transparent">
                            Eure Entscheidungen.
                        </span>
                        <span className="mt-3 block">Eure Legende.</span>
                    </h1>

                    <p className="mt-8 max-w-2xl text-lg leading-8 text-gray-300 sm:text-xl">
                        Mythoria verbindet klassisches Pen-and-Paper mit einem
                        intelligenten Spielleiter, lebendigen Welten und einem fairen
                        Regelsystem.
                    </p>

                    <p className="mt-4 max-w-2xl leading-7 text-gray-500">
                        Erschafft Helden, gründet eine Gruppe und erlebt Geschichten, die
                        sich dauerhaft an eure Entscheidungen erinnern.
                    </p>

                    <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                        <Link
                            href="/dashboard/characters/new"
                            className="inline-flex items-center justify-center rounded-xl bg-emerald-400 px-8 py-4 font-black text-black transition hover:-translate-y-1 hover:bg-emerald-300"
                        >
                            <span className="mr-2 text-xl">⚔️</span>
                            Helden erschaffen
                        </Link>

                        <Link
                            href="/dashboard"
                            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-8 py-4 font-bold transition hover:border-emerald-400/40 hover:bg-white/[0.06]"
                        >
                            Dashboard öffnen
                        </Link>
                    </div>

                    <div className="mt-10 flex flex-wrap gap-5 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                            <span className="text-emerald-400">✓</span>
                            Kostenlos starten
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-emerald-400">✓</span>
                            Direkt im Browser
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-emerald-400">✓</span>
                            Für Einzelspieler und Gruppen
                        </div>
                    </div>
                </div>

                <HeroGameCard />
            </div>
        </section>
    );
}

function HeroGameCard() {
    return (
        <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute inset-0 rounded-[3rem] bg-emerald-400/10 blur-3xl" />

            <div className="relative overflow-hidden rounded-[2.5rem] border border-emerald-400/20 bg-black/70 p-5 shadow-[0_0_100px_rgba(52,211,153,0.08)] backdrop-blur-xl sm:p-7">
                <div className="flex items-center justify-between border-b border-white/10 pb-5">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-400">
                            Aktuelles Abenteuer
                        </p>

                        <h2 className="mt-2 text-xl font-black">
                            Die Schatten von Eldrath
                        </h2>
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-2xl">
                        🐉
                    </div>
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-400 font-black text-black">
                            AI
                        </div>

                        <div>
                            <p className="font-black">Mythoria Spielleiter</p>
                            <p className="text-xs text-emerald-400">Erzählt gerade</p>
                        </div>
                    </div>

                    <p className="mt-5 leading-7 text-gray-300">
                        Die schweren Steintore öffnen sich knirschend. Dahinter liegt eine
                        Halle, deren Wände von grünem Feuer beleuchtet werden.
                    </p>

                    <p className="mt-4 leading-7 text-gray-400">
                        Im Zentrum erwacht eine uralte Gestalt. Sie kennt eure Namen.
                    </p>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                    <GameStatistic value="4" label="Helden" />
                    <GameStatistic value="12" label="Sitzungen" />
                    <GameStatistic value="38h" label="Spielzeit" />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <button
                        type="button"
                        className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-sm text-gray-300 transition hover:border-emerald-400/40"
                    >
                        ⚔️ Ich ziehe mein Schwert.
                    </button>

                    <button
                        type="button"
                        className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-sm text-gray-300 transition hover:border-emerald-400/40"
                    >
                        🔮 Ich untersuche die Magie.
                    </button>
                </div>
            </div>
        </div>
    );
}

function GameStatistic({ value, label }: { value: string; label: string }) {
    return (
        <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4 text-center">
            <p className="text-xl font-black text-emerald-400">{value}</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-gray-600">
                {label}
            </p>
        </div>
    );
}

function StatisticsSection() {
    const statistics = [
        {
            value: "1–6",
            label: "Spieler pro Gruppe",
        },
        {
            value: "24/7",
            label: "KI-Spielleiter",
        },
        {
            value: "∞",
            label: "Mögliche Geschichten",
        },
        {
            value: "1",
            label: "Unvergessliche Legende",
        },
    ];

    return (
        <section className="relative px-5 pb-24 sm:px-8">
            <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {statistics.map((statistic) => (
                    <article
                        key={statistic.label}
                        className="rounded-2xl border border-white/10 bg-white/[0.025] p-6 text-center transition hover:border-emerald-400/30"
                    >
                        <p className="text-3xl font-black text-emerald-400">
                            {statistic.value}
                        </p>

                        <p className="mt-2 text-sm text-gray-500">{statistic.label}</p>
                    </article>
                ))}
            </div>
        </section>
    );
}

function FeatureSection() {
    return (
        <section
            id="features"
            className="relative border-y border-white/5 bg-white/[0.012] px-5 py-28 sm:px-8"
        >
            <div className="mx-auto max-w-7xl">
                <SectionHeading
                    eyebrow="Das Herz von Mythoria"
                    title="Pen-and-Paper, neu geschmiedet."
                    description="Die KI erzählt eure Geschichte. Das Regelsystem entscheidet das Spiel. So bleibt jedes Abenteuer frei, dynamisch und trotzdem fair."
                    centered
                />

                <div className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature) => (
                        <FeatureCard key={feature.title} {...feature} />
                    ))}
                </div>
            </div>
        </section>
    );
}

function FeatureCard({ icon, title, description }: Feature) {
    return (
        <article className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025] p-7 transition hover:-translate-y-2 hover:border-emerald-400/40">
            <div className="absolute right-[-20px] top-[-25px] text-[130px] opacity-[0.03] transition group-hover:scale-110">
                {icon}
            </div>

            <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-3xl">
                    {icon}
                </div>

                <h3 className="mt-6 text-xl font-black">{title}</h3>

                <p className="mt-3 leading-7 text-gray-400">{description}</p>
            </div>
        </article>
    );
}

function GameFlowSection() {
    return (
        <section id="gameplay" className="relative px-5 py-28 sm:px-8">
            <div className="mx-auto max-w-7xl">
                <SectionHeading
                    eyebrow="Deine Reise"
                    title="Vom ersten Helden zur unsterblichen Legende."
                    description="Mythoria führt euch Schritt für Schritt in eine Welt, die auf eure Gruppe zugeschnitten wird."
                />

                <div className="mt-14 grid gap-5 md:grid-cols-2">
                    {gameSteps.map((step) => (
                        <article
                            key={step.number}
                            className="rounded-3xl border border-white/10 bg-white/[0.025] p-7 transition hover:border-emerald-400/30"
                        >
                            <div className="flex items-start gap-5">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-400 font-black text-black">
                                    {step.number}
                                </div>

                                <div>
                                    <h3 className="text-xl font-black">{step.title}</h3>

                                    <p className="mt-3 leading-7 text-gray-400">
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}

function WorldPreviewSection() {
    return (
        <section
            id="world"
            className="relative border-y border-white/5 bg-white/[0.012] px-5 py-28 sm:px-8"
        >
            <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
                <div>
                    <SectionHeading
                        eyebrow="Eine lebendige Chronik"
                        title="Die Welt vergisst eure Entscheidungen nicht."
                        description="Jede Handlung kann Beziehungen, Fraktionen, Städte und ganze Königreiche verändern."
                    />

                    <div className="mt-8 grid gap-4">
                        <WorldEvent
                            icon="👑"
                            title="Königreiche reagieren"
                            description="Rettet einen Herrscher und seine Familie erinnert sich viele Sitzungen später an eure Taten."
                        />

                        <WorldEvent
                            icon="🔥"
                            title="Konflikte entwickeln sich"
                            description="Ignorierte Gefahren wachsen weiter und können ganze Regionen verändern."
                        />

                        <WorldEvent
                            icon="🤝"
                            title="Beziehungen bleiben bestehen"
                            description="Freundschaft, Misstrauen, Verrat und Versprechen beeinflussen zukünftige Begegnungen."
                        />
                    </div>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 rounded-[3rem] bg-emerald-400/10 blur-3xl" />

                    <div className="relative overflow-hidden rounded-[2.5rem] border border-emerald-400/20 bg-black/60 p-6 sm:p-8">
                        <div className="flex min-h-[500px] flex-col justify-between rounded-[2rem] border border-white/10 bg-gradient-to-br from-emerald-950/60 via-black to-black p-7">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-400">
                                        Weltstatus
                                    </p>

                                    <h3 className="mt-3 text-3xl font-black">
                                        Das Reich Eldrath
                                    </h3>
                                </div>

                                <div className="text-5xl">🏰</div>
                            </div>

                            <div className="my-10 flex flex-1 items-center justify-center text-[130px] opacity-80">
                                🗺️
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <WorldStatus label="Herrscher" value="Königin Seraya" />
                                <WorldStatus label="Gefahrenstufe" value="Hoch" />
                                <WorldStatus label="Beziehung" value="Verbündet" />
                                <WorldStatus label="Offene Quests" value="7" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function WorldEvent({
    icon,
    title,
    description,
}: {
    icon: string;
    title: string;
    description: string;
}) {
    return (
        <article className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-2xl">
                {icon}
            </div>

            <div>
                <h3 className="font-black">{title}</h3>
                <p className="mt-2 leading-6 text-gray-400">{description}</p>
            </div>
        </article>
    );
}

function WorldStatus({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <p className="text-xs uppercase tracking-wider text-gray-600">{label}</p>
            <p className="mt-2 font-black text-emerald-300">{value}</p>
        </div>
    );
}

function RoadmapSection() {
    return (
        <section id="roadmap" className="relative px-5 py-28 sm:px-8">
            <div className="mx-auto max-w-7xl">
                <SectionHeading
                    eyebrow="Die Entwicklungsreise"
                    title="Mythoria wächst mit jeder Phase."
                    description="Wir bauen zuerst das Fundament und erweitern die Plattform anschließend Schritt für Schritt."
                    centered
                />

                <div className="mx-auto mt-14 max-w-5xl space-y-4">
                    {roadmap.map((phase) => (
                        <RoadmapCard key={phase.number} {...phase} />
                    ))}
                </div>
            </div>
        </section>
    );
}

function RoadmapCard({
    number,
    title,
    description,
    status,
}: RoadmapPhase) {
    const completed = status === "completed";
    const active = status === "active";

    const cardClasses = active
        ? "border-emerald-400/40 bg-emerald-400/[0.08] shadow-[0_0_50px_rgba(52,211,153,0.06)]"
        : completed
            ? "border-emerald-400/20 bg-emerald-400/[0.04]"
            : "border-white/10 bg-white/[0.02] opacity-65";

    const statusText = completed
        ? "Abgeschlossen"
        : active
            ? "Aktiv"
            : "Geplant";

    return (
        <article className={`rounded-2xl border p-5 sm:p-6 ${cardClasses}`}>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border font-black ${completed || active
                            ? "border-emerald-400 bg-emerald-400 text-black"
                            : "border-white/10 bg-white/[0.04] text-gray-500"
                        }`}
                >
                    {completed ? "✓" : number}
                </div>

                <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-black">{title}</h3>

                        <span
                            className={`rounded-full border px-3 py-1 text-xs font-bold ${active
                                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                                    : completed
                                        ? "border-emerald-400/20 text-emerald-400"
                                        : "border-white/10 text-gray-500"
                                }`}
                        >
                            {statusText}
                        </span>
                    </div>

                    <p className="mt-2 leading-7 text-gray-400">{description}</p>
                </div>

                {active && (
                    <Link
                        href="/dashboard/characters"
                        className="shrink-0 rounded-xl border border-emerald-400/30 px-5 py-3 text-center text-sm font-black text-emerald-300 transition hover:bg-emerald-400 hover:text-black"
                    >
                        Phase öffnen
                    </Link>
                )}
            </div>
        </article>
    );
}

function CallToActionSection() {
    return (
        <section className="relative px-5 pb-28 sm:px-8">
            <div className="mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] border border-emerald-400/20 bg-gradient-to-br from-emerald-400/[0.1] via-white/[0.025] to-transparent p-8 text-center sm:p-14">
                <div className="text-6xl">⚔️</div>

                <p className="mt-7 text-sm font-black uppercase tracking-[0.25em] text-emerald-400">
                    Deine Chronik beginnt
                </p>

                <h2 className="mx-auto mt-5 max-w-4xl text-4xl font-black sm:text-6xl">
                    Jeder Held beginnt mit einer einzigen Entscheidung.
                </h2>

                <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-300">
                    Erstelle deinen ersten Charakter und lege das Fundament für die
                    Abenteuer, die Mythoria bald erzählen wird.
                </p>

                <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
                    <Link
                        href="/dashboard/characters/new"
                        className="rounded-xl bg-emerald-400 px-8 py-4 font-black text-black transition hover:-translate-y-1 hover:bg-emerald-300"
                    >
                        Charakter erstellen
                    </Link>

                    <Link
                        href="/dashboard"
                        className="rounded-xl border border-white/10 bg-black/20 px-8 py-4 font-bold transition hover:border-emerald-400/40"
                    >
                        Zum Dashboard
                    </Link>
                </div>
            </div>
        </section>
    );
}

function SectionHeading({
    eyebrow,
    title,
    description,
    centered = false,
}: {
    eyebrow: string;
    title: string;
    description: string;
    centered?: boolean;
}) {
    return (
        <div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-emerald-400">
                {eyebrow}
            </p>

            <h2 className="mt-4 text-4xl font-black sm:text-5xl lg:text-6xl">
                {title}
            </h2>

            <p className="mt-5 text-lg leading-8 text-gray-400">{description}</p>
        </div>
    );
}

function MainFooter() {
    return (
        <footer className="relative border-t border-white/10 px-5 py-12 sm:px-8">
            <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-3">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-400/10">
                            🎲
                        </div>

                        <div>
                            <p className="font-black tracking-[0.2em] text-emerald-400">
                                MYTHORIA
                            </p>

                            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-gray-600">
                                Forge your legend
                            </p>
                        </div>
                    </div>

                    <p className="mt-5 max-w-sm leading-7 text-gray-500">
                        Eine KI-gestützte Multiplayer-Rollenspielwelt, in der jede
                        Entscheidung Teil eurer Legende wird.
                    </p>
                </div>

                <div>
                    <p className="font-black">Entdecken</p>

                    <div className="mt-5 flex flex-col gap-3 text-sm text-gray-500">
                        <a href="#features" className="transition hover:text-emerald-400">
                            Features
                        </a>

                        <a href="#gameplay" className="transition hover:text-emerald-400">
                            Spielablauf
                        </a>

                        <a href="#roadmap" className="transition hover:text-emerald-400">
                            Roadmap
                        </a>
                    </div>
                </div>

                <div>
                    <p className="font-black">Dein Abenteuer</p>

                    <div className="mt-5 flex flex-col gap-3 text-sm text-gray-500">
                        <Link
                            href="/dashboard"
                            className="transition hover:text-emerald-400"
                        >
                            Dashboard
                        </Link>

                        <Link
                            href="/dashboard/characters"
                            className="transition hover:text-emerald-400"
                        >
                            Charaktere
                        </Link>

                        <Link
                            href="/dashboard/characters/new"
                            className="transition hover:text-emerald-400"
                        >
                            Charakter erstellen
                        </Link>
                    </div>
                </div>
            </div>

            <div className="mx-auto mt-12 flex max-w-7xl flex-col justify-between gap-4 border-t border-white/10 pt-8 text-sm text-gray-600 sm:flex-row">
                <p>© 2026 Mythoria. Alle Rechte vorbehalten.</p>
                <p>Die KI erzählt. Das Regelsystem entscheidet.</p>
            </div>
        </footer>
    );
}