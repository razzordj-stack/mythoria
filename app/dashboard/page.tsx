"use client";

import Link from "next/link";
import { CharacterAvatar } from "@/app/components/character-avatar";
import { useRouter } from "next/navigation";
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import { createBrowserClient } from "@supabase/ssr";

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
};

type MessageState =
    | {
        type: "error" | "success";
        text: string;
    }
    | null;

const raceLabels: Record<string, string> = {
    human: "Mensch",
    mensch: "Mensch",
    elf: "Elf",
    dwarf: "Zwerg",
    zwerg: "Zwerg",
    orc: "Ork",
    ork: "Ork",
    shadowborn: "Schattengeborener",
    dragonkin: "Drachenblütiger",
};

const raceIcons: Record<string, string> = {
    human: "🛡️",
    mensch: "🛡️",
    elf: "🌿",
    dwarf: "⛏️",
    zwerg: "⛏️",
    orc: "⚔️",
    ork: "⚔️",
    shadowborn: "🌑",
    dragonkin: "🐉",
};

const classLabels: Record<string, string> = {
    warrior: "Krieger",
    krieger: "Krieger",
    mage: "Magier",
    magier: "Magier",
    ranger: "Waldläufer",
    waldlaeufer: "Waldläufer",
    rogue: "Schurke",
    schurke: "Schurke",
    paladin: "Paladin",
    necromancer: "Nekromant",
    nekromant: "Nekromant",
};

const classIcons: Record<string, string> = {
    warrior: "⚔️",
    krieger: "⚔️",
    mage: "🔮",
    magier: "🔮",
    ranger: "🏹",
    waldlaeufer: "🏹",
    rogue: "🗡️",
    schurke: "🗡️",
    paladin: "☀️",
    necromancer: "💀",
    nekromant: "💀",
};

export default function CharactersPage() {
    const router = useRouter();

    const supabaseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const supabase = useMemo(() => {
        if (!supabaseUrl || !supabaseKey) {
            return null;
        }

        return createBrowserClient(
            supabaseUrl,
            supabaseKey,
        );
    }, [supabaseKey, supabaseUrl]);

    const [characters, setCharacters] = useState<
        Character[]
    >([]);

    const [isLoading, setIsLoading] =
        useState(true);

    const [deletingId, setDeletingId] = useState<
        string | null
    >(null);

    const [message, setMessage] =
        useState<MessageState>(null);

    const loadCharacters = useCallback(async () => {
        setIsLoading(true);
        setMessage(null);

        if (!supabase) {
            setCharacters([]);

            setMessage({
                type: "error",
                text:
                    "Die Supabase-Umgebungsvariablen fehlen. Prüfe NEXT_PUBLIC_SUPABASE_URL und den Supabase-Schlüssel.",
            });

            setIsLoading(false);
            return;
        }

        try {
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) {
                throw new Error(userError.message);
            }

            if (!user) {
                setCharacters([]);

                setMessage({
                    type: "error",
                    text:
                        "Du bist nicht angemeldet. Melde dich erneut an, um deine Charaktere zu sehen.",
                });

                return;
            }

            const { data, error } = await supabase
                .from("characters")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .overrideTypes<Character[], { merge: false }>();

            if (error) {
                throw error;
            }

            const characterData = parseCharacters(
                data as unknown,
            );

            setCharacters(characterData);
        } catch (error) {
            setCharacters([]);

            setMessage({
                type: "error",
                text:
                    error instanceof Error
                        ? error.message
                        : "Die Charaktere konnten nicht geladen werden.",
            });
        } finally {
            setIsLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadCharacters();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [loadCharacters]);

    async function handleDelete(
        character: Character,
    ) {
        const confirmed = window.confirm(
            `Möchtest du "${character.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
        );

        if (!confirmed) {
            return;
        }

        if (!supabase) {
            setMessage({
                type: "error",
                text:
                    "Die Verbindung zu Supabase konnte nicht hergestellt werden.",
            });

            return;
        }

        setDeletingId(character.id);
        setMessage(null);

        try {
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) {
                throw new Error(userError.message);
            }

            if (!user) {
                throw new Error(
                    "Du bist nicht mehr angemeldet.",
                );
            }

            const { error } = await supabase
                .from("characters")
                .delete()
                .eq("id", character.id)
                .eq("user_id", user.id);

            if (error) {
                throw new Error(error.message);
            }

            setCharacters((currentCharacters) =>
                currentCharacters.filter(
                    (currentCharacter) =>
                        currentCharacter.id !== character.id,
                ),
            );

            setMessage({
                type: "success",
                text: `${character.name} wurde gelöscht.`,
            });
        } catch (error) {
            setMessage({
                type: "error",
                text:
                    error instanceof Error
                        ? error.message
                        : "Der Charakter konnte nicht gelöscht werden.",
            });
        } finally {
            setDeletingId(null);
        }
    }

    const totalLevels = characters.reduce(
        (sum, character) =>
            sum + Math.max(character.level, 1),
        0,
    );

    const totalExperience = characters.reduce(
        (sum, character) =>
            sum + Math.max(character.experience, 0),
        0,
    );

    return (
        <main className="relative min-h-screen overflow-hidden bg-[#020403] text-white">
            <BackgroundEffects />

            <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <PageHeader
                    isLoading={isLoading}
                    onRefresh={() => void loadCharacters()}
                />

                {message && (
                    <div
                        role={
                            message.type === "error"
                                ? "alert"
                                : "status"
                        }
                        className={[
                            "mb-6 rounded-2xl border p-4 text-sm leading-6 backdrop-blur-xl",
                            message.type === "error"
                                ? "border-red-400/30 bg-red-500/10 text-red-100"
                                : "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
                        ].join(" ")}
                    >
                        {message.text}
                    </div>
                )}

                <Statistics
                    characterCount={characters.length}
                    totalLevels={totalLevels}
                    totalExperience={totalExperience}
                />

                {isLoading ? (
                    <LoadingState />
                ) : characters.length === 0 ? (
                    <EmptyState />
                ) : (
                    <>
                    <CommandCenter character={characters[0]} />
                    <section className="mt-8">
                        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.3em] text-lime-200">
                                    Deine Gefährten
                                </p>

                                <h2 className="mt-2 text-2xl font-black text-white">
                                    Charakterübersicht
                                </h2>
                            </div>

                            <p className="text-sm text-[var(--mythoria-text-muted)]">
                                {characters.length}{" "}
                                {characters.length === 1
                                    ? "Charakter"
                                    : "Charaktere"}
                            </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                            {characters.map((character) => (
                                <CharacterCard
                                    key={character.id}
                                    character={character}
                                    isDeleting={
                                        deletingId === character.id
                                    }
                                    onOpen={() =>
                                        router.push(
                                            `/dashboard/characters/${character.id}`,
                                        )
                                    }
                                    onDelete={() =>
                                        void handleDelete(character)
                                    }
                                />
                            ))}

                            <CreateCharacterCard />
                        </div>
                    </section>
                    </>
                )}
            </div>
        </main>
    );
}

type PageHeaderProps = {
    isLoading: boolean;
    onRefresh: () => void;
};

function CommandCenter({ character }: { character: Character }) {
    const normalizedClass = character.character_class.toLowerCase();
    const normalizedRace = character.race.toLowerCase();
    const icon = classIcons[normalizedClass] ?? raceIcons[normalizedRace] ?? "✦";
    const characterHref = `/dashboard/characters/${character.id}`;

    return (
        <section aria-labelledby="continue-title" className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,.7fr)]">
            <article className="mythoria-panel relative overflow-hidden p-5 sm:p-6">
                <div aria-hidden="true" className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_right,rgba(147,182,64,.16),transparent_66%)]" />
                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
                    <CharacterAvatar name={character.name} icon={icon} className="shrink-0" />
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold tracking-[.2em] text-[var(--mythoria-green-bright)]">ABENTEUER FORTSETZEN</p>
                        <h2 id="continue-title" className="mt-1 truncate text-2xl">{character.name}</h2>
                        <p className="mt-1 text-sm text-[var(--mythoria-text-muted)]">
                            Stufe {Math.max(character.level, 1)} · {formatValue(character.race)} · {formatValue(character.character_class)}
                        </p>
                        <p className="mt-3 line-clamp-2 max-w-2xl text-sm leading-6 text-[var(--mythoria-text-secondary)]">
                            {character.background?.trim() || "Die nächste Seite dieser Chronik wartet darauf, geschrieben zu werden."}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <Link href={`${characterHref}/adventure`} className="mythoria-button-primary">Chronik fortsetzen</Link>
                            <Link href={characterHref} className="mythoria-button-secondary">Charakter öffnen</Link>
                        </div>
                    </div>
                </div>
            </article>
            <nav aria-label="Schnellzugriffe" className="mythoria-card p-4">
                <p className="px-1 text-[10px] font-bold tracking-[.2em] text-[var(--mythoria-gold-light)]">SCHNELLZUGRIFFE</p>
                <div className="mt-3 grid grid-cols-2 gap-2 xl:grid-cols-1">
                    <QuickLink href={`${characterHref}/quests`} icon="◇" label="Aktive Quests" />
                    <QuickLink href={`${characterHref}/inventory`} icon="▣" label="Inventar" />
                    <QuickLink href="/dashboard/world" icon="⌖" label="Weltkarte" />
                    <QuickLink href="/dashboard/notifications" icon="✦" label="Meldungen" />
                </div>
            </nav>
        </section>
    );
}

function QuickLink({ href, icon, label }: { href: string; icon: string; label: string }) {
    return (
        <Link href={href} className="flex min-h-11 items-center gap-3 rounded-xl border border-[var(--mythoria-border)] bg-black/15 px-3 text-sm font-semibold text-[var(--mythoria-text-secondary)] transition hover:border-[var(--mythoria-border-gold)] hover:bg-[var(--mythoria-panel-hover)] hover:text-[var(--mythoria-gold-light)]">
            <span aria-hidden="true" className="w-5 text-center text-[var(--mythoria-green-bright)]">{icon}</span>
            {label}
        </Link>
    );
}

function PageHeader({
    isLoading,
    onRefresh,
}: PageHeaderProps) {
    return (
        <header className="mythoria-page-header mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
                <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--mythoria-border-gold)] bg-[var(--mythoria-green-dark)]/30 text-[var(--mythoria-neon-soft)]">✦</span>

                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--mythoria-green-bright)]">
                        Kommandozentrale
                    </p>

                    <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                        Deine Chroniken
                    </h1>

                    <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--mythoria-text-muted)]">
                        Setze ein Abenteuer fort oder verwalte deine Helden und Fortschritte.
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={onRefresh}
                    disabled={isLoading}
                    className="mythoria-button-secondary"
                >
                    {isLoading
                        ? "Wird geladen ..."
                        : "↻ Aktualisieren"}
                </button>

                <Link
                    href="/dashboard/characters/new"
                    className="mythoria-button-primary"
                >
                    + Neuer Charakter
                </Link>
            </div>
        </header>
    );
}

type StatisticsProps = {
    characterCount: number;
    totalLevels: number;
    totalExperience: number;
};

function Statistics({
    characterCount,
    totalLevels,
    totalExperience,
}: StatisticsProps) {
    return (
        <section aria-label="Chronikstatus" className="mb-5 grid gap-3 sm:grid-cols-3">
            <StatisticCard
                icon="🧙"
                label="Charaktere"
                value={characterCount.toLocaleString(
                    "de-DE",
                )}
            />

            <StatisticCard
                icon="⭐"
                label="Gesamtstufen"
                value={totalLevels.toLocaleString("de-DE")}
            />

            <StatisticCard
                icon="✨"
                label="Erfahrung"
                value={`${totalExperience.toLocaleString(
                    "de-DE",
                )} EP`}
            />
        </section>
    );
}

type StatisticCardProps = {
    icon: string;
    label: string;
    value: string;
};

function StatisticCard({
    icon,
    label,
    value,
}: StatisticCardProps) {
    return (
        <div className="mythoria-card p-4">
            <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-lime-400/20 bg-lime-500/10 text-lg">
                    {icon}
                </span>

                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--mythoria-text-disabled)]">
                        {label}
                    </p>

                    <p className="mt-0.5 text-xl font-black text-white">
                        {value}
                    </p>
                </div>
            </div>
        </div>
    );
}

type CharacterCardProps = {
    character: Character;
    isDeleting: boolean;
    onOpen: () => void;
    onDelete: () => void;
};

function CharacterCard({
    character,
    isDeleting,
    onOpen,
    onDelete,
}: CharacterCardProps) {
    const normalizedRace =
        character.race.toLowerCase();

    const normalizedClass =
        character.character_class.toLowerCase();

    const raceLabel =
        raceLabels[normalizedRace] ??
        formatValue(character.race);

    const classLabel =
        classLabels[normalizedClass] ??
        formatValue(character.character_class);

    const icon =
        classIcons[normalizedClass] ??
        raceIcons[normalizedRace] ??
        "✦";

    const level = Math.max(character.level, 1);

    const experience = Math.max(
        character.experience,
        0,
    );

    const nextLevelExperience = Math.max(
        level * 100,
        100,
    );

    const progress = Math.min(
        Math.round(
            (experience / nextLevelExperience) * 100,
        ),
        100,
    );

    return (
        <article className="group overflow-hidden rounded-2xl border border-[var(--mythoria-border)] bg-[#0b0e08]/90 shadow-xl shadow-black/20 transition duration-300 hover:-translate-y-1 hover:border-lime-400/40 hover:shadow-green-950/40">
            <div className="relative flex min-h-40 items-center justify-center overflow-hidden border-b border-[var(--mythoria-border)] bg-gradient-to-br from-green-950 via-[#1a1f10] to-black">
                <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-lime-500/20 blur-3xl" />

                <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl" />

                <div className="relative text-center">
                    <CharacterAvatar
                        name={character.name}
                        icon={icon}
                        className="mx-auto transition group-hover:scale-105"
                    />

                    <span className="mt-2 inline-block rounded-full border border-[var(--mythoria-border)] bg-black/40 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-lime-100">
                        Stufe {level}
                    </span>
                </div>
            </div>

            <div className="p-5">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-lime-400">
                    {raceLabel}
                </p>

                <h2 className="mt-1 break-words text-xl font-black text-white">
                    {character.name}
                </h2>

                <p className="mt-1 text-sm font-semibold text-[var(--mythoria-text-muted)]">
                    {classLabel}
                </p>

                <p className="mt-3 line-clamp-2 min-h-12 text-sm leading-6 text-[var(--mythoria-text-muted)]">
                    {character.background?.trim() ||
                        "Die Geschichte dieses Charakters wurde noch nicht niedergeschrieben."}
                </p>

                <div className="mt-4 rounded-xl border border-[var(--mythoria-border)] bg-black/20 p-3">
                    <div className="mb-2 flex items-center justify-between gap-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--mythoria-text-disabled)]">
                            Erfahrung
                        </span>

                        <span className="text-xs font-bold text-lime-200">
                            {experience.toLocaleString("de-DE")} /{" "}
                            {nextLevelExperience.toLocaleString(
                                "de-DE",
                            )}{" "}
                            EP
                        </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-lime-500 via-amber-500 to-amber-400 transition-all"
                            style={{
                                width: `${progress}%`,
                            }}
                        />
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
                    <button
                        type="button"
                        onClick={onOpen}
                        className="rounded-xl bg-gradient-to-r from-green-700 to-amber-700 px-5 py-3 text-sm font-black text-white transition hover:brightness-110"
                    >
                        Charakter öffnen
                    </button>

                    <button
                        type="button"
                        onClick={onDelete}
                        disabled={isDeleting}
                        aria-label={`${character.name} löschen`}
                        title="Charakter löschen"
                        className="flex min-w-12 items-center justify-center rounded-xl border border-red-400/20 bg-red-500/5 px-4 py-3 text-sm text-red-300 transition hover:border-red-400/50 hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isDeleting ? "…" : "🗑️"}
                    </button>
                </div>
            </div>
        </article>
    );
}

function CreateCharacterCard() {
    return (
        <Link
            href="/dashboard/characters/new"
            className="group flex min-h-[25rem] flex-col items-center justify-center rounded-2xl border border-dashed border-lime-400/30 bg-lime-500/[0.03] p-7 text-center transition hover:-translate-y-1 hover:border-lime-400/70 hover:bg-lime-500/[0.08]"
        >
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-lime-400/30 bg-lime-500/10 text-4xl text-lime-200 transition group-hover:scale-110">
                +
            </div>

            <h2 className="mt-6 text-xl font-black text-white">
                Neue Legende beginnen
            </h2>

            <p className="mt-3 max-w-xs text-sm leading-6 text-[var(--mythoria-text-muted)]">
                Erschaffe einen weiteren Charakter und
                öffne ein neues Kapitel in Mythoria.
            </p>
        </Link>
    );
}

function LoadingState() {
    return (
        <section>
            <div className="mb-5 h-7 w-56 animate-pulse rounded-lg bg-white/10" />

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 3 }).map(
                    (_, index) => (
                        <div
                            key={index}
                            className="overflow-hidden rounded-3xl border border-[var(--mythoria-border)] bg-[var(--mythoria-surface)]/90"
                        >
                            <div className="h-56 animate-pulse bg-white/5" />

                            <div className="space-y-4 p-6">
                                <div className="h-3 w-24 animate-pulse rounded bg-white/10" />

                                <div className="h-8 w-3/4 animate-pulse rounded bg-white/10" />

                                <div className="h-4 w-1/2 animate-pulse rounded bg-white/10" />

                                <div className="space-y-2 pt-3">
                                    <div className="h-3 animate-pulse rounded bg-white/10" />
                                    <div className="h-3 animate-pulse rounded bg-white/10" />
                                    <div className="h-3 w-2/3 animate-pulse rounded bg-white/10" />
                                </div>
                            </div>
                        </div>
                    ),
                )}
            </div>
        </section>
    );
}

function EmptyState() {
    return (
        <section className="rounded-3xl border border-dashed border-lime-400/30 bg-[var(--mythoria-surface)]/70 px-6 py-20 text-center backdrop-blur-xl">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-lime-400/30 bg-lime-500/10 text-5xl">
                🧙
            </div>

            <p className="mt-7 text-xs font-bold uppercase tracking-[0.3em] text-lime-200">
                Noch keine Legende
            </p>

            <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
                Dein Abenteuer wartet
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[var(--mythoria-text-muted)]">
                Du hast noch keinen Charakter erstellt.
                Erschaffe deinen ersten Helden und betrete
                die Reiche von Mythoria.
            </p>

            <Link
                href="/dashboard/characters/new"
                className="mt-8 inline-flex rounded-xl bg-gradient-to-r from-green-700 via-amber-700 to-green-800 px-7 py-3 text-sm font-black text-white shadow-lg shadow-green-950/50 transition hover:scale-[1.02] hover:brightness-110"
            >
                Ersten Charakter erschaffen
            </Link>
        </section>
    );
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

            <div
                className="absolute inset-0 opacity-[0.025]"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
                    backgroundSize: "48px 48px",
                }}
            />
        </div>
    );
}

function parseCharacters(
    value: unknown,
): Character[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .filter(isRecord)
        .map((item) => ({
            id: readString(item.id),
            user_id: readString(item.user_id),
            name: readString(item.name, "Unbenannter Held"),
            race: readString(item.race, "unknown"),
            character_class: readString(
                item.character_class,
                "unknown",
            ),
            background: readNullableString(
                item.background,
            ),
            appearance: readNullableString(
                item.appearance,
            ),
            level: readNumber(item.level, 1),
            experience: readNumber(
                item.experience,
                0,
            ),
            created_at: readNullableString(
                item.created_at,
            ),
            updated_at: readNullableString(
                item.updated_at,
            ),
        }))
        .filter(
            (character) =>
                character.id.length > 0 &&
                character.user_id.length > 0,
        );
}

function isRecord(
    value: unknown,
): value is Record<string, unknown> {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
    );
}

function readString(
    value: unknown,
    fallback = "",
): string {
    return typeof value === "string"
        ? value
        : fallback;
}

function readNullableString(
    value: unknown,
): string | null {
    return typeof value === "string"
        ? value
        : null;
}

function readNumber(
    value: unknown,
    fallback: number,
): number {
    if (
        typeof value === "number" &&
        Number.isFinite(value)
    ) {
        return value;
    }

    if (
        typeof value === "string" &&
        value.trim() !== ""
    ) {
        const parsedValue = Number(value);

        if (Number.isFinite(parsedValue)) {
            return parsedValue;
        }
    }

    return fallback;
}

function formatValue(value: string) {
    if (!value) {
        return "Unbekannt";
    }

    return value
        .replace(/[_-]/g, " ")
        .replace(/\b\w/g, (letter) =>
            letter.toUpperCase(),
        );
}
