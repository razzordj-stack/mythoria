"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { CharacterAvatar } from "@/app/components/character-avatar";
import { derivedCharacterStats, levelProgress } from "@/lib/progression";

type Character = {
    id: string;
    user_id: string;
    name: string;
    race: string;
    character_class: string;
    background: string | null;
    appearance: string | null;
    level: number;
    experience: number;
    created_at: string | null;
    updated_at: string | null;
    strength: number | null;
    dexterity: number | null;
    intelligence: number | null;
    constitution: number | null;
    wisdom: number | null;
    charisma: number | null;
    health: number | null;
    max_health: number | null;
    mana: number | null;
    max_mana: number | null;
    gold: number | null;
};

const raceLabels: Record<string, string> = {
    human: "Mensch",
    elf: "Elf",
    dwarf: "Zwerg",
    orc: "Ork",
    shadowborn: "Schattengeborener",
    dragonkin: "Drachenblütiger",
};

const raceIcons: Record<string, string> = {
    human: "🛡️",
    elf: "🌿",
    dwarf: "⛏️",
    orc: "⚔️",
    shadowborn: "🌑",
    dragonkin: "🐉",
};

const classLabels: Record<string, string> = {
    warrior: "Krieger",
    mage: "Magier",
    ranger: "Waldläufer",
    rogue: "Schurke",
    paladin: "Paladin",
    necromancer: "Nekromant",
};

const classIcons: Record<string, string> = {
    warrior: "⚔️",
    mage: "🔮",
    ranger: "🏹",
    rogue: "🗡️",
    paladin: "☀️",
    necromancer: "💀",
};

export default function CharacterDetailPage() {
    const { id } = useParams<{ id: string }>();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const supabase = useMemo(() => {
        if (!supabaseUrl || !supabaseKey) return null;
        return createBrowserClient(supabaseUrl, supabaseKey);
    }, [supabaseKey, supabaseUrl]);

    const [character, setCharacter] = useState<Character | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isNotFound, setIsNotFound] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const loadCharacter = useCallback(async () => {
        setIsLoading(true);
        setIsNotFound(false);
        setErrorMessage(null);

        if (!supabase) {
            setErrorMessage(
                "Die Supabase-Verbindung ist nicht konfiguriert. Prüfe die Umgebungsvariablen.",
            );
            setIsLoading(false);
            return;
        }

        try {
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) throw new Error(userError.message);

            if (!user) {
                setErrorMessage(
                    "Du bist nicht angemeldet. Melde dich an, um diesen Charakter zu sehen.",
                );
                setCharacter(null);
                return;
            }

            const { data, error } = await supabase
                .from("characters")
                .select(
                    [
                        "id",
                        "user_id",
                        "name",
                        "race",
                        "character_class",
                        "background",
                        "appearance",
                        "level",
                        "experience",
                        "created_at",
                        "updated_at",
                        "strength",
                        "dexterity",
                        "intelligence",
                        "constitution",
                        "wisdom",
                        "charisma",
                        "health",
                        "max_health",
                        "mana",
                        "max_mana",
                        "gold",
                    ].join(","),
                )
                .eq("id", id)
                .eq("user_id", user.id)
                .maybeSingle()
                .overrideTypes<Character | null, { merge: false }>();

            if (error) throw new Error(error.message);

            if (!data) {
                setCharacter(null);
                setIsNotFound(true);
                return;
            }

            setCharacter(data);
        } catch (error) {
            setCharacter(null);
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Der Charakter konnte nicht geladen werden.",
            );
        } finally {
            setIsLoading(false);
        }
    }, [id, supabase]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadCharacter();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [loadCharacter]);

    if (isLoading) return <LoadingState />;

    if (errorMessage) {
        return (
            <StateMessage
                icon="⚠️"
                eyebrow="Verbindung fehlgeschlagen"
                title="Charakter konnte nicht geladen werden"
                description={errorMessage}
                onRetry={() => void loadCharacter()}
            />
        );
    }

    if (isNotFound || !character) {
        return (
            <StateMessage
                icon="🔍"
                eyebrow="Nicht gefunden"
                title="Dieser Charakter existiert nicht"
                description="Der Charakter wurde gelöscht, gehört einem anderen Benutzer oder die Adresse ist nicht korrekt."
            />
        );
    }

    const normalizedRace = character.race.toLowerCase();
    const normalizedClass = character.character_class.toLowerCase();
    const raceLabel =
        raceLabels[normalizedRace] ?? formatValue(character.race);
    const classLabel =
        classLabels[normalizedClass] ??
        formatValue(character.character_class);
    const avatarIcon =
        classIcons[normalizedClass] ??
        raceIcons[normalizedRace] ??
        "✦";
    const experience = Math.max(character.experience ?? 0, 0);
    const progression = levelProgress(experience);
    const level = progression.level;

    const attributes = [
        ["Stärke", safeNumber(character.strength, 10), "💪"],
        ["Geschick", safeNumber(character.dexterity, 10), "🏹"],
        ["Intelligenz", safeNumber(character.intelligence, 10), "🔮"],
        ["Konstitution", safeNumber(character.constitution, 10), "🛡️"],
        ["Weisheit", safeNumber(character.wisdom, 10), "📖"],
        ["Charisma", safeNumber(character.charisma, 10), "✨"],
    ] as const;
    const health = safeNumber(character.health, 100);
    const maxHealth = Math.max(safeNumber(character.max_health, 100), 1);
    const mana = safeNumber(character.mana, 50);
    const maxMana = Math.max(safeNumber(character.max_mana, 50), 1);
    const gold = safeNumber(character.gold, 0);
    const derivedStats = derivedCharacterStats(level, {
        strength: safeNumber(character.strength, 10),
        dexterity: safeNumber(character.dexterity, 10),
        intelligence: safeNumber(character.intelligence, 10),
        constitution: safeNumber(character.constitution, 10),
        wisdom: safeNumber(character.wisdom, 10),
        charisma: safeNumber(character.charisma, 10),
    });

    return (
        <main className="relative min-h-screen overflow-hidden bg-[#020403] text-white">
            <BackgroundEffects />

            <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
                <header className="mb-8 flex flex-col gap-4 rounded-3xl border border-lime-400/20 bg-[var(--mythoria-surface)]/90 p-5 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.3em] text-lime-200">
                            Charakterprofil
                        </p>
                        <h1 className="mt-2 text-2xl font-black sm:text-3xl">
                            Die Chronik von {character.name}
                        </h1>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Link
                            href="/dashboard/characters"
                            className="rounded-xl border border-[var(--mythoria-border)] px-5 py-3 text-center text-sm font-bold text-[var(--mythoria-text-secondary)] transition hover:border-lime-400/40 hover:bg-white/5 hover:text-white"
                        >
                            Zurück zur Übersicht
                        </Link>
                        <Link
                            href={"/dashboard/characters/" + character.id + "/inventory"}
                            className="rounded-xl border border-lime-400/30 bg-lime-500/10 px-5 py-3 text-center text-sm font-black text-lime-100 transition hover:bg-lime-500/20"
                        >
                            Inventar öffnen
                        </Link>
                        <Link
                            href={"/dashboard/characters/" + character.id + "/edit"}
                            className="rounded-xl bg-gradient-to-r from-green-700 to-amber-700 px-5 py-3 text-center text-sm font-black transition hover:brightness-110"
                        >
                            Charakter bearbeiten
                        </Link>
                    </div>
                </header>

                <QuickActions characterId={character.id} />

                <section className="overflow-hidden rounded-3xl border border-[var(--mythoria-border)] bg-[#0b0e08]/90 shadow-2xl shadow-green-950/30">
                    <div className="relative flex min-h-72 items-center justify-center overflow-hidden border-b border-[var(--mythoria-border)] bg-gradient-to-br from-green-950 via-[#1a1f10] to-black px-6 py-10">
                        <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-lime-500/20 blur-[90px]" />
                        <div className="absolute -bottom-20 -right-16 h-72 w-72 rounded-full bg-amber-500/15 blur-[100px]" />

                        <div className="relative text-center">
                            <CharacterAvatar
                                name={character.name}
                                icon={avatarIcon}
                                size="xl"
                                className="mx-auto"
                            />
                            <p className="mt-5 text-xs font-bold uppercase tracking-[0.28em] text-lime-200">
                                {raceLabel} · {classLabel}
                            </p>
                            <h2 className="mt-3 text-4xl font-black sm:text-5xl">
                                {character.name}
                            </h2>
                        </div>
                    </div>

                    <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[0.9fr_1.1fr]">
                        <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <InfoCard label="Volk" value={raceLabel} />
                                <InfoCard label="Klasse" value={classLabel} />
                                <InfoCard label="Stufe" value={String(level)} />
                                <InfoCard
                                    label="Erfahrung"
                                    value={experience.toLocaleString("de-DE") + " EP"}
                                />                                <InfoCard
                                    label="Erstellt am"
                                    value={formatDate(character.created_at)}
                                />
                            </div>

                            <div className="rounded-2xl border border-lime-400/20 bg-lime-500/[0.06] p-5">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-lime-200">
                                            Stufenfortschritt
                                        </p>
                                        <p className="mt-1 text-sm text-[var(--mythoria-text-muted)]">
                                            Noch{" "}
                                            {Math.max(
                                                progression.remaining,
                                                0,
                                            ).toLocaleString("de-DE")}{" "}
                                            EP bis zur nächsten Stufe
                                        </p>
                                    </div>
                                    <span className="text-lg font-black text-white">
                                        {progression.percent} %
                                    </span>
                                </div>
                                <div className="mt-4 h-3 overflow-hidden rounded-full bg-black/35">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-lime-500 via-amber-500 to-amber-400 transition-all"
                                        style={{ width: String(progression.percent) + "%" }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <StoryCard
                                title="Hintergrundgeschichte"
                                text={
                                    character.background?.trim() ||
                                    "Die Vergangenheit dieses Charakters liegt noch im Verborgenen."
                                }
                            />
                            <StoryCard
                                title="Erscheinungsbild"
                                text={
                                    character.appearance?.trim() ||
                                    "Das Erscheinungsbild wurde noch nicht beschrieben."
                                }
                            />
                        </div>
                    </div>
                </section>

                <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
                    <div className="rounded-3xl border border-[var(--mythoria-border)] bg-[var(--mythoria-surface)]/90 p-5 backdrop-blur-xl sm:p-7">
                        <div className="mb-5">
                            <p className="text-xs font-bold uppercase tracking-[0.25em] text-lime-200">
                                Charakterwerte
                            </p>
                            <h2 className="mt-2 text-2xl font-black">
                                Attribute
                            </h2>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {attributes.map(([label, value, icon]) => (
                                <AttributeCard
                                    key={label}
                                    label={label}
                                    value={value}
                                    icon={icon}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4 rounded-3xl border border-[var(--mythoria-border)] bg-[var(--mythoria-surface)]/90 p-5 backdrop-blur-xl sm:p-7">
                        <div className="mb-5">
                            <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-200">
                                Ressourcen
                            </p>
                            <h2 className="mt-2 text-2xl font-black">
                                Status
                            </h2>
                        </div>
                        <ResourceBar
                            label="Lebenspunkte"
                            value={health}
                            maximum={maxHealth}
                            color="from-rose-500 to-red-400"
                        />
                        <ResourceBar
                            label="Mana"
                            value={mana}
                            maximum={maxMana}
                            color="from-blue-500 to-cyan-400"
                        />
                        <div className="flex items-center justify-between rounded-2xl border border-amber-400/20 bg-amber-500/[0.07] p-4">
                            <span className="font-bold text-amber-200">
                                🪙 Gold
                            </span>
                            <strong className="text-xl text-amber-100">
                                {gold.toLocaleString("de-DE")}
                            </strong>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4 lg:grid-cols-2">
                            <InfoCard label="Angriff" value={String(derivedStats.attack)} />
                            <InfoCard label="Verteidigung" value={String(derivedStats.defense)} />
                            <InfoCard label="Magiekraft" value={String(derivedStats.magicPower)} />
                            <InfoCard label="Initiative" value={String(derivedStats.initiative)} />
                            <InfoCard label="Kritisch" value={`${derivedStats.criticalChance} %`} />
                            <InfoCard label="Ausweichen" value={`${derivedStats.dodgeChance} %`} />
                            <InfoCard label="Traglast" value={String(derivedStats.carryCapacity)} />
                            <InfoCard label="Überzeugen" value={String(derivedStats.persuasion)} />
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}

function QuickActions({ characterId }: { characterId: string }) {
    const actions = [
        {
            label: "Charakter bearbeiten",
            icon: "✍️",
            href: "/dashboard/characters/" + characterId + "/edit",
        },
        {
            label: "Inventar",
            icon: "🎒",
            href: "/dashboard/characters/" + characterId + "/inventory",
        },
        {
            label: "Quests",
            icon: "📜",
            href: "/dashboard/characters/" + characterId + "/quests",
        },
        {
            label: "Fähigkeiten",
            icon: "✦",
            href: "/dashboard/characters/" + characterId + "/skills",
        },
        {
            label: "Kampf",
            icon: "⚔",
            href: "/dashboard/characters/" + characterId + "/combat",
        },
        {
            label: "Marktplatz",
            icon: "⚖",
            href: "/dashboard/characters/" + characterId + "/market",
        },
        {
            label: "Fraktionen",
            icon: "♛",
            href: "/dashboard/characters/" + characterId + "/reputation",
        },
        {
            label: "Begleiter",
            icon: "♙",
            href: "/dashboard/characters/" + characterId + "/companions",
        },
        {
            label: "Abenteuer starten",
            icon: "🗺️",
            href: "/dashboard/characters/" + characterId + "/adventure",
        },
    ];

    return (
        <nav
            aria-label="Charakter-Schnellzugriffe"
            className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
            {actions.map((action) => (
                <Link
                    key={action.label}
                    href={action.href}
                    className="group flex items-center gap-3 rounded-2xl border border-[var(--mythoria-border)] bg-[var(--mythoria-surface)]/90 p-4 font-bold text-[var(--mythoria-text)] transition hover:-translate-y-0.5 hover:border-lime-400/40 hover:bg-lime-500/10"
                >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/25 text-xl transition group-hover:scale-105">
                        {action.icon}
                    </span>
                    <span>{action.label}</span>
                </Link>
            ))}
        </nav>
    );
}
function InfoCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-[var(--mythoria-border)] bg-black/20 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--mythoria-text-disabled)]">
                {label}
            </p>
            <p className="mt-2 break-words font-black text-slate-100">
                {value}
            </p>
        </div>
    );
}

function StoryCard({ title, text }: { title: string; text: string }) {
    return (
        <article className="rounded-2xl border border-[var(--mythoria-border)] bg-black/20 p-5">
            <h3 className="text-sm font-black uppercase tracking-[0.18em] text-lime-200">
                {title}
            </h3>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--mythoria-text-muted)]">
                {text}
            </p>
        </article>
    );
}

function AttributeCard({
    label,
    value,
    icon,
}: {
    label: string;
    value: number;
    icon: string;
}) {
    return (
        <div className="rounded-2xl border border-[var(--mythoria-border)] bg-black/20 p-4 text-center">
            <span className="text-2xl">{icon}</span>
            <p className="mt-2 text-xs font-bold uppercase tracking-wider text-[var(--mythoria-text-disabled)]">
                {label}
            </p>
            <p className="mt-1 text-2xl font-black text-white">{value}</p>
        </div>
    );
}

function ResourceBar({
    label,
    value,
    maximum,
    color,
}: {
    label: string;
    value: number;
    maximum: number;
    color: string;
}) {
    const normalizedValue = Math.min(Math.max(value, 0), maximum);
    const percentage = Math.round((normalizedValue / maximum) * 100);

    return (
        <div className="rounded-2xl border border-[var(--mythoria-border)] bg-black/20 p-4">
            <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-bold text-[var(--mythoria-text)]">
                    {label}
                </span>
                <span className="text-sm font-black text-white">
                    {normalizedValue.toLocaleString("de-DE")} /{" "}
                    {maximum.toLocaleString("de-DE")}
                </span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
                <div
                    className={"h-full rounded-full bg-gradient-to-r " + color}
                    style={{ width: String(percentage) + "%" }}
                />
            </div>
        </div>
    );
}
function LoadingState() {
    return (
        <main className="min-h-screen bg-[#020403] px-4 py-10 text-white">
            <div className="mx-auto max-w-6xl animate-pulse">
                <div className="h-28 rounded-3xl bg-[var(--mythoria-surface-light)]/90" />
                <div className="mt-8 h-[36rem] rounded-3xl bg-[var(--mythoria-surface-light)]/80" />
            </div>
        </main>
    );
}

function StateMessage({
    icon,
    eyebrow,
    title,
    description,
    onRetry,
}: {
    icon: string;
    eyebrow: string;
    title: string;
    description: string;
    onRetry?: () => void;
}) {
    return (
        <main className="flex min-h-screen items-center justify-center bg-[#020403] px-4 text-white">
            <section className="w-full max-w-xl rounded-3xl border border-[var(--mythoria-border)] bg-[var(--mythoria-surface)]/90 p-8 text-center">
                <span className="text-5xl">{icon}</span>
                <p className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-lime-200">
                    {eyebrow}
                </p>
                <h1 className="mt-3 text-3xl font-black">{title}</h1>
                <p className="mt-4 leading-7 text-[var(--mythoria-text-muted)]">
                    {description}
                </p>
                <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                    {onRetry && (
                        <button
                            type="button"
                            onClick={onRetry}
                            className="rounded-xl bg-green-700 px-5 py-3 font-bold transition hover:bg-lime-500"
                        >
                            Erneut versuchen
                        </button>
                    )}
                    <Link
                        href="/dashboard/characters"
                        className="rounded-xl border border-[var(--mythoria-border)] px-5 py-3 font-bold text-[var(--mythoria-text-secondary)] transition hover:border-lime-400/40"
                    >
                        Zurück zur Übersicht
                    </Link>
                </div>
            </section>
        </main>
    );
}

function formatDate(value: string | null) {
    if (!value) return "Unbekannt";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? "Unbekannt"
        : new Intl.DateTimeFormat("de-DE", {
              dateStyle: "long",
          }).format(date);
}
function safeNumber(value: number | null, fallback: number) {
    return typeof value === "number" && Number.isFinite(value)
        ? Math.max(value, 0)
        : fallback;
}
function formatValue(value: string) {
    if (!value) return "Unbekannt";

    return value
        .replace(/[_-]/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function BackgroundEffects() {
    return (
        <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
        >
            <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-green-800/20 blur-[120px]" />
            <div className="absolute -right-40 top-1/3 h-[32rem] w-[32rem] rounded-full bg-amber-800/10 blur-[140px]" />
            <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-blue-700/10 blur-[120px]" />
        </div>
    );
}
