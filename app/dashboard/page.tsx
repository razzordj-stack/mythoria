import Link from "next/link";

type DashboardCardProps = {
    title: string;
    description: string;
    icon: string;
    href: string;
    buttonText: string;
    status?: string;
    disabled?: boolean;
};

type RoadmapStepProps = {
    number: string;
    title: string;
    description: string;
    completed?: boolean;
    active?: boolean;
    soon?: boolean;
};

const dashboardCards: DashboardCardProps[] = [
    {
        title: "Charaktere",
        description:
            "Erstelle neue Helden, verwalte ihre Herkunft, Klasse, Ausrüstung und Geschichte.",
        icon: "🧙",
        href: "/dashboard/characters",
        buttonText: "Charaktere öffnen",
        status: "Phase 2 aktiv",
    },
    {
        title: "Kampagnen",
        description:
            "Erstelle später eigene Abenteuer oder schließe dich einer bestehenden Gruppe an.",
        icon: "🗺️",
        href: "/dashboard/campaigns",
        buttonText: "Bald verfügbar",
        status: "In Planung",
        disabled: true,
    },
    {
        title: "Multiplayer-Lobby",
        description:
            "Lade Freunde ein, verteile Rollen und startet gemeinsam eine Kampagne.",
        icon: "👥",
        href: "/dashboard/lobby",
        buttonText: "Bald verfügbar",
        status: "Phase 3",
        disabled: true,
    },
    {
        title: "Welten",
        description:
            "Entdecke später eigene Königreiche, Fraktionen, Regionen und Geschichten.",
        icon: "🌍",
        href: "/dashboard/worlds",
        buttonText: "Bald verfügbar",
        status: "Spätere Phase",
        disabled: true,
    },
];

const roadmapSteps: RoadmapStepProps[] = [
    {
        number: "01",
        title: "Grundprojekt",
        description:
            "Next.js, Tailwind CSS, Vercel und die grundlegende Mythoria-Struktur.",
        completed: true,
    },
    {
        number: "02",
        title: "Charaktersystem",
        description:
            "Charakterübersicht, Charaktereditor, Rassen, Klassen und Attribute.",
        active: true,
    },
    {
        number: "03",
        title: "Multiplayer",
        description:
            "Lobbys, Einladungen, Gruppenverwaltung und gemeinsames Spielen.",
        soon: true,
    },
    {
        number: "04",
        title: "Regel-Engine",
        description:
            "Würfelwürfe, Lebenspunkte, Initiative, Schaden und Statuswerte.",
        soon: true,
    },
    {
        number: "05",
        title: "KI-Spielleiter",
        description:
            "Dynamische Geschichten, NPCs, Quests und langfristige Erinnerungen.",
        soon: true,
    },
];

export default function DashboardPage() {
    const characterCount = 0;
    const activeCampaigns = 0;
    const completedAdventures = 0;

    return (
        <main className="relative min-h-screen overflow-hidden bg-[#030605] text-white">
            <BackgroundEffects />

            <DashboardHeader />

            <div className="relative mx-auto max-w-7xl px-5 pb-20 pt-32 sm:px-8">
                <WelcomeSection />

                <StatisticsSection
                    characterCount={characterCount}
                    activeCampaigns={activeCampaigns}
                    completedAdventures={completedAdventures}
                />

                <section className="mt-14">
                    <SectionHeading
                        eyebrow="Dein Abenteuerzentrum"
                        title="Was möchtest du heute erschaffen?"
                        description="Verwalte deine Helden und bereite dich auf die kommenden Welten von Mythoria vor."
                    />

                    <div className="mt-8 grid gap-6 md:grid-cols-2">
                        {dashboardCards.map((card) => (
                            <DashboardCard key={card.title} {...card} />
                        ))}
                    </div>
                </section>

                <CharacterPreview />

                <section className="mt-20">
                    <SectionHeading
                        eyebrow="Entwicklungsreise"
                        title="Die Mythoria-Roadmap"
                        description="Mythoria wächst Schritt für Schritt zu einer lebendigen KI-Rollenspielplattform."
                    />

                    <div className="mt-8 grid gap-4">
                        {roadmapSteps.map((step) => (
                            <RoadmapStep key={step.number} {...step} />
                        ))}
                    </div>
                </section>

                <QuickStartSection />
            </div>

            <DashboardFooter />
        </main>
    );
}

function BackgroundEffects() {
    return (
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
            <div className="absolute left-1/2 top-[-300px] h-[750px] w-[750px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[170px]" />

            <div className="absolute bottom-[-300px] right-[-180px] h-[600px] w-[600px] rounded-full bg-green-900/10 blur-[170px]" />

            <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:80px_80px]" />

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#030605_82%)]" />
        </div>
    );
}

function DashboardHeader() {
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

                <nav className="hidden items-center gap-7 text-sm text-gray-400 md:flex">
                    <Link
                        href="/dashboard"
                        className="font-bold text-emerald-400 transition hover:text-emerald-300"
                    >
                        Dashboard
                    </Link>

                    <Link
                        href="/dashboard/characters"
                        className="transition hover:text-white"
                    >
                        Charaktere
                    </Link>

                    <span className="cursor-not-allowed opacity-40">Kampagnen</span>
                </nav>

                <div className="flex items-center gap-3">
                    <Link
                        href="/"
                        className="hidden rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-gray-300 transition hover:border-emerald-400/40 hover:text-white sm:block"
                    >
                        Startseite
                    </Link>

                    <button
                        type="button"
                        aria-label="Benutzermenü"
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10 font-black text-emerald-300"
                    >
                        M
                    </button>
                </div>
            </div>
        </header>
    );
}

function WelcomeSection() {
    return (
        <section className="relative overflow-hidden rounded-[2rem] border border-emerald-400/20 bg-gradient-to-br from-emerald-400/[0.09] via-white/[0.025] to-transparent p-7 sm:p-10 lg:p-12">
            <div className="absolute right-[-50px] top-[-60px] text-[220px] opacity-[0.04]">
                🐉
            </div>

            <div className="relative max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-black/30 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-300">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                    Phase 2 gestartet
                </div>

                <h1 className="mt-6 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                    Willkommen zurück in{" "}
                    <span className="bg-gradient-to-r from-emerald-200 via-emerald-400 to-green-700 bg-clip-text text-transparent">
                        Mythoria
                    </span>
                </h1>

                <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-300">
                    Deine Reise beginnt mit einem Helden. Erstelle deinen ersten
                    Charakter und lege das Fundament für eine Legende, an die sich die
                    Welt erinnern wird.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Link
                        href="/dashboard/characters/new"
                        className="inline-flex items-center justify-center rounded-xl bg-emerald-400 px-7 py-4 font-black text-black transition hover:-translate-y-1 hover:bg-emerald-300"
                    >
                        <span className="mr-2 text-xl">+</span>
                        Ersten Charakter erstellen
                    </Link>

                    <Link
                        href="/dashboard/characters"
                        className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-7 py-4 font-bold text-white transition hover:border-emerald-400/40 hover:bg-white/[0.06]"
                    >
                        Charakterübersicht
                    </Link>
                </div>
            </div>
        </section>
    );
}

function StatisticsSection({
    characterCount,
    activeCampaigns,
    completedAdventures,
}: {
    characterCount: number;
    activeCampaigns: number;
    completedAdventures: number;
}) {
    const statistics = [
        {
            label: "Charaktere",
            value: characterCount,
            icon: "🧙",
            description: "Deine erschaffenen Helden",
        },
        {
            label: "Aktive Kampagnen",
            value: activeCampaigns,
            icon: "📜",
            description: "Laufende Abenteuer",
        },
        {
            label: "Abgeschlossene Abenteuer",
            value: completedAdventures,
            icon: "🏆",
            description: "Geschriebene Legenden",
        },
        {
            label: "Aktuelle Phase",
            value: "02",
            icon: "⚒️",
            description: "Charaktersystem",
        },
    ];

    return (
        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statistics.map((statistic) => (
                <article
                    key={statistic.label}
                    className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition hover:border-emerald-400/30"
                >
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-sm text-gray-500">{statistic.label}</p>

                            <p className="mt-2 text-3xl font-black text-white">
                                {statistic.value}
                            </p>
                        </div>

                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-400/10 text-2xl">
                            {statistic.icon}
                        </div>
                    </div>

                    <p className="mt-4 text-sm text-gray-500">
                        {statistic.description}
                    </p>
                </article>
            ))}
        </section>
    );
}

function SectionHeading({
    eyebrow,
    title,
    description,
}: {
    eyebrow: string;
    title: string;
    description: string;
}) {
    return (
        <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-emerald-400">
                {eyebrow}
            </p>

            <h2 className="mt-4 text-3xl font-black sm:text-4xl">{title}</h2>

            <p className="mt-4 leading-7 text-gray-400">{description}</p>
        </div>
    );
}

function DashboardCard({
    title,
    description,
    icon,
    href,
    buttonText,
    status,
    disabled = false,
}: DashboardCardProps) {
    return (
        <article
            className={`group relative overflow-hidden rounded-3xl border p-7 transition ${disabled
                    ? "border-white/10 bg-white/[0.015] opacity-65"
                    : "border-white/10 bg-white/[0.03] hover:-translate-y-1 hover:border-emerald-400/40"
                }`}
        >
            <div className="absolute right-[-15px] top-[-30px] text-[140px] opacity-[0.035] transition group-hover:scale-110">
                {icon}
            </div>

            <div className="relative">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-3xl">
                        {icon}
                    </div>

                    {status && (
                        <span
                            className={`rounded-full border px-3 py-1 text-xs font-bold ${disabled
                                    ? "border-white/10 text-gray-500"
                                    : "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                                }`}
                        >
                            {status}
                        </span>
                    )}
                </div>

                <h3 className="mt-6 text-2xl font-black">{title}</h3>

                <p className="mt-3 min-h-[84px] leading-7 text-gray-400">
                    {description}
                </p>

                {disabled ? (
                    <button
                        type="button"
                        disabled
                        className="mt-7 w-full cursor-not-allowed rounded-xl border border-white/10 bg-white/[0.02] px-5 py-3 font-bold text-gray-600"
                    >
                        {buttonText}
                    </button>
                ) : (
                    <Link
                        href={href}
                        className="mt-7 inline-flex w-full items-center justify-center rounded-xl bg-emerald-400 px-5 py-3 font-black text-black transition hover:bg-emerald-300"
                    >
                        {buttonText}
                    </Link>
                )}
            </div>
        </article>
    );
}

function CharacterPreview() {
    return (
        <section className="mt-20">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <SectionHeading
                    eyebrow="Deine Helden"
                    title="Charakterübersicht"
                    description="Sobald du einen Helden erstellst, erscheint er hier mit seiner Klasse, Rasse und Geschichte."
                />

                <Link
                    href="/dashboard/characters"
                    className="text-sm font-black text-emerald-400 transition hover:text-emerald-300"
                >
                    Alle Charaktere anzeigen →
                </Link>
            </div>

            <div className="mt-8 flex min-h-[320px] items-center justify-center rounded-[2rem] border border-dashed border-white/15 bg-white/[0.02] px-6 py-12 text-center">
                <div className="max-w-lg">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10 text-4xl">
                        ⚔️
                    </div>

                    <h3 className="mt-6 text-2xl font-black">
                        Noch kein Charakter vorhanden
                    </h3>

                    <p className="mt-4 leading-7 text-gray-400">
                        Die Chronik wartet auf ihren ersten Namen. Erstelle jetzt einen
                        Helden und entscheide, wer du in Mythoria sein möchtest.
                    </p>

                    <Link
                        href="/dashboard/characters/new"
                        className="mt-7 inline-flex rounded-xl bg-emerald-400 px-6 py-3 font-black text-black transition hover:-translate-y-1 hover:bg-emerald-300"
                    >
                        Charakter erschaffen
                    </Link>
                </div>
            </div>
        </section>
    );
}

function RoadmapStep({
    number,
    title,
    description,
    completed = false,
    active = false,
    soon = false,
}: RoadmapStepProps) {
    let cardClasses =
        "border-white/10 bg-white/[0.02]";

    let numberClasses =
        "border-white/10 bg-white/[0.04] text-gray-400";

    let statusText = "Geplant";

    if (completed) {
        cardClasses =
            "border-emerald-400/20 bg-emerald-400/[0.05]";
        numberClasses =
            "border-emerald-400/30 bg-emerald-400 text-black";
        statusText = "Abgeschlossen";
    }

    if (active) {
        cardClasses =
            "border-emerald-400/40 bg-emerald-400/[0.08] shadow-[0_0_50px_rgba(52,211,153,0.06)]";
        numberClasses =
            "border-emerald-300 bg-emerald-400 text-black";
        statusText = "Aktiv";
    }

    return (
        <article
            className={`rounded-2xl border p-5 transition sm:p-6 ${cardClasses} ${soon ? "opacity-65" : ""
                }`}
        >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border font-black ${numberClasses}`}
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
                        Weiterbauen
                    </Link>
                )}
            </div>
        </article>
    );
}

function QuickStartSection() {
    const steps = [
        {
            number: "1",
            title: "Charakter erstellen",
            description: "Vergib einen Namen und beginne deine Geschichte.",
        },
        {
            number: "2",
            title: "Rasse und Klasse",
            description: "Wähle Herkunft, Fähigkeiten und deinen Spielstil.",
        },
        {
            number: "3",
            title: "Attribute festlegen",
            description: "Bestimme Stärke, Geschick, Intelligenz und weitere Werte.",
        },
        {
            number: "4",
            title: "Abenteuer beginnen",
            description: "Bereite deinen Helden auf die erste Kampagne vor.",
        },
    ];

    return (
        <section className="mt-20 overflow-hidden rounded-[2rem] border border-emerald-400/20 bg-gradient-to-br from-emerald-400/[0.08] to-transparent p-7 sm:p-10">
            <div className="text-center">
                <p className="text-sm font-black uppercase tracking-[0.25em] text-emerald-400">
                    Schnellstart
                </p>

                <h2 className="mt-4 text-3xl font-black sm:text-4xl">
                    Vom leeren Blatt zur Legende
                </h2>

                <p className="mx-auto mt-4 max-w-2xl leading-7 text-gray-400">
                    Der Charaktereditor führt dich Schritt für Schritt durch die
                    Erschaffung deines Helden.
                </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {steps.map((step) => (
                    <article
                        key={step.number}
                        className="rounded-2xl border border-white/10 bg-black/20 p-5"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400 font-black text-black">
                            {step.number}
                        </div>

                        <h3 className="mt-5 font-black">{step.title}</h3>

                        <p className="mt-2 text-sm leading-6 text-gray-400">
                            {step.description}
                        </p>
                    </article>
                ))}
            </div>

            <div className="mt-10 text-center">
                <Link
                    href="/dashboard/characters/new"
                    className="inline-flex items-center justify-center rounded-xl bg-emerald-400 px-8 py-4 font-black text-black transition hover:-translate-y-1 hover:bg-emerald-300"
                >
                    Charaktereditor starten
                </Link>
            </div>
        </section>
    );
}

function DashboardFooter() {
    return (
        <footer className="relative border-t border-white/10 px-5 py-10 sm:px-8">
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 text-center sm:flex-row sm:text-left">
                <div>
                    <p className="font-black tracking-[0.2em] text-emerald-400">
                        MYTHORIA
                    </p>

                    <p className="mt-2 text-sm text-gray-600">
                        Jeder Held beginnt mit einer einzigen Entscheidung.
                    </p>
                </div>

                <p className="text-sm text-gray-600">
                    © 2026 Mythoria · Phase 2
                </p>
            </div>
        </footer>
    );
}