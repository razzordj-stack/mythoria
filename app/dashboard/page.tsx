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
        <main className="relative min-h-screen overflow-hidden bg-[#070713] text-white">
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
                    <section>
                        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.3em] text-violet-300">
                                    Deine Gefährten
                                </p>

                                <h2 className="mt-2 text-2xl font-black text-white">
                                    Charakterübersicht
                                </h2>
                            </div>

                            <p className="text-sm text-slate-400">
                                {characters.length}{" "}
                                {characters.length === 1
                                    ? "Charakter"
                                    : "Charaktere"}
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
                )}
            </div>
        </main>
    );
}

type PageHeaderProps = {
    isLoading: boolean;
    onRefresh: () => void;
};

function PageHeader({
    isLoading,
    onRefresh,
}: PageHeaderProps) {
    return (
        <header className="mb-8 flex flex-col gap-5 rounded-3xl border border-violet-400/20 bg-white/[0.04] p-5 shadow-2xl shadow-violet-950/20 backdrop-blur-xl sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
                <Link
                    href="/dashboard"
                    aria-label="Zurück zum Dashboard"
                    className="flex h-11 min-w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xl transition hover:border-violet-400/40 hover:bg-violet-500/10"
                >
                    ←
                </Link>

                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-violet-300">
                        Mythoria
                    </p>

                    <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                        Meine Charaktere
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                        Verwalte deine Helden, erkunde ihre
                        Geschichten und führe sie tiefer in die
                        Welt von Mythoria.
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
                <button
                    type="button"
                    onClick={onRefresh}
                    disabled={isLoading}
                    className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-violet-400/40 hover:bg-violet-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isLoading
                        ? "Wird geladen ..."
                        : "↻ Aktualisieren"}
                </button>

                <Link
                    href="/dashboard/characters/new"
                    className="rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-purple-600 px-6 py-3 text-center text-sm font-black text-white shadow-lg shadow-violet-950/50 transition hover:scale-[1.01] hover:brightness-110"
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
        <section className="mb-8 grid gap-4 sm:grid-cols-3">
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
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
            <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/10 text-2xl">
                    {icon}
                </span>

                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        {label}
                    </p>

                    <p className="mt-1 text-2xl font-black text-white">
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
        <article className="group overflow-hidden rounded-3xl border border-white/10 bg-[#0c0b1c]/90 shadow-xl shadow-black/20 transition duration-300 hover:-translate-y-1 hover:border-violet-400/40 hover:shadow-violet-950/40">
            <div className="relative flex min-h-56 items-center justify-center overflow-hidden border-b border-white/10 bg-gradient-to-br from-violet-950 via-[#17102f] to-black">
                <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />

                <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-fuchsia-500/10 blur-3xl" />

                <div className="relative text-center">
                    <CharacterAvatar
                        name={character.name}
                        icon={icon}
                        className="mx-auto transition group-hover:scale-105"
                    />

                    <span className="mt-4 inline-block rounded-full border border-white/10 bg-black/40 px-4 py-1 text-xs font-black uppercase tracking-[0.2em] text-violet-200">
                        Stufe {level}
                    </span>
                </div>
            </div>

            <div className="p-6">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-violet-400">
                    {raceLabel}
                </p>

                <h2 className="mt-2 break-words text-2xl font-black text-white">
                    {character.name}
                </h2>

                <p className="mt-1 text-sm font-semibold text-slate-400">
                    {classLabel}
                </p>

                <p className="mt-4 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-slate-400">
                    {character.background?.trim() ||
                        "Die Geschichte dieses Charakters wurde noch nicht niedergeschrieben."}
                </p>

                <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="mb-2 flex items-center justify-between gap-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Erfahrung
                        </span>

                        <span className="text-xs font-bold text-violet-300">
                            {experience.toLocaleString("de-DE")} /{" "}
                            {nextLevelExperience.toLocaleString(
                                "de-DE",
                            )}{" "}
                            EP
                        </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-400 transition-all"
                            style={{
                                width: `${progress}%`,
                            }}
                        />
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-[1fr_auto] gap-3">
                    <button
                        type="button"
                        onClick={onOpen}
                        className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 text-sm font-black text-white transition hover:brightness-110"
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
            className="group flex min-h-[32rem] flex-col items-center justify-center rounded-3xl border border-dashed border-violet-400/30 bg-violet-500/[0.03] p-8 text-center transition hover:-translate-y-1 hover:border-violet-400/70 hover:bg-violet-500/[0.08]"
        >
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-violet-400/30 bg-violet-500/10 text-4xl text-violet-300 transition group-hover:scale-110">
                +
            </div>

            <h2 className="mt-6 text-xl font-black text-white">
                Neue Legende beginnen
            </h2>

            <p className="mt-3 max-w-xs text-sm leading-6 text-slate-400">
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
                            className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]"
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
        <section className="rounded-3xl border border-dashed border-violet-400/30 bg-white/[0.03] px-6 py-20 text-center backdrop-blur-xl">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-violet-400/30 bg-violet-500/10 text-5xl">
                🧙
            </div>

            <p className="mt-7 text-xs font-bold uppercase tracking-[0.3em] text-violet-300">
                Noch keine Legende
            </p>

            <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
                Dein Abenteuer wartet
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-400">
                Du hast noch keinen Charakter erstellt.
                Erschaffe deinen ersten Helden und betrete
                die Reiche von Mythoria.
            </p>

            <Link
                href="/dashboard/characters/new"
                className="mt-8 inline-flex rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-purple-600 px-7 py-3 text-sm font-black text-white shadow-lg shadow-violet-950/50 transition hover:scale-[1.02] hover:brightness-110"
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
            <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-700/20 blur-[120px]" />

            <div className="absolute -right-40 top-1/3 h-[32rem] w-[32rem] rounded-full bg-fuchsia-700/10 blur-[140px]" />

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