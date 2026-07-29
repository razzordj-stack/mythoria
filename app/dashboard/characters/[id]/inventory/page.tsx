"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import { createBrowserClient } from "@supabase/ssr";
import { CharacterAvatar } from "@/app/components/character-avatar";

type CharacterSummary = {
    id: string;
    user_id: string;
    name: string;
    race: string;
    character_class: string;
};

type InventoryItem = {
    id: string;
    character_id: string;
    user_id: string;
    name: string;
    description: string | null;
    item_type: string;
    rarity: string;
    quantity: number;
    is_equipped: boolean;
    attack_bonus: number;
    defense_bonus: number;
    created_at: string;
    updated_at: string;
};

const rarityStyles: Record<string, string> = {
    common: "border-slate-400/20 bg-slate-500/[0.06] text-slate-300",
    uncommon: "border-emerald-400/25 bg-emerald-500/[0.07] text-emerald-300",
    rare: "border-blue-400/25 bg-blue-500/[0.07] text-blue-300",
    epic: "border-violet-400/25 bg-violet-500/[0.08] text-violet-300",
    legendary: "border-amber-400/30 bg-amber-500/[0.09] text-amber-300",
};

const rarityLabels: Record<string, string> = {
    common: "Gewöhnlich",
    uncommon: "Ungewöhnlich",
    rare: "Selten",
    epic: "Episch",
    legendary: "Legendär",
};

const itemIcons: Record<string, string> = {
    weapon: "⚔️",
    armor: "🛡️",
    potion: "🧪",
    consumable: "🍖",
    quest: "📜",
    treasure: "💎",
    accessory: "💍",
};

export default function InventoryPage() {
    const { id } = useParams<{ id: string }>();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const supabase = useMemo(() => {
        if (!supabaseUrl || !supabaseKey) return null;
        return createBrowserClient(supabaseUrl, supabaseKey);
    }, [supabaseKey, supabaseUrl]);

    const [character, setCharacter] =
        useState<CharacterSummary | null>(null);
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isNotFound, setIsNotFound] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [updatingItemId, setUpdatingItemId] = useState<string | null>(
        null,
    );

    const loadInventory = useCallback(async () => {
        setIsLoading(true);
        setIsNotFound(false);
        setErrorMessage(null);

        if (!supabase) {
            setErrorMessage(
                "Die Supabase-Verbindung ist nicht konfiguriert.",
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
                    "Du bist nicht angemeldet. Melde dich an, um das Inventar zu sehen.",
                );
                return;
            }

            const { data: characterData, error: characterError } =
                await supabase
                    .from("characters")
                    .select("id,user_id,name,race,character_class")
                    .eq("id", id)
                    .eq("user_id", user.id)
                    .maybeSingle()
                    .overrideTypes<CharacterSummary | null, { merge: false }>();

            if (characterError) {
                throw new Error(characterError.message);
            }

            if (!characterData) {
                setIsNotFound(true);
                setCharacter(null);
                setItems([]);
                return;
            }

            const { data: inventoryData, error: inventoryError } =
                await supabase
                    .from("inventory_items")
                    .select(
                        "id,character_id,user_id,name,description,item_type,rarity,quantity,is_equipped,attack_bonus,defense_bonus,created_at,updated_at",
                    )
                    .eq("character_id", characterData.id)
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false })
                    .overrideTypes<InventoryItem[], { merge: false }>();

            if (inventoryError) {
                throw new Error(inventoryError.message);
            }

            setCharacter(characterData);
            setItems(inventoryData ?? []);
        } catch (error) {
            setCharacter(null);
            setItems([]);
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Das Inventar konnte nicht geladen werden.",
            );
        } finally {
            setIsLoading(false);
        }
    }, [id, supabase]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadInventory();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [loadInventory]);
    async function handleEquipment(item: InventoryItem) {
        if (!supabase || !character) {
            setActionError(
                "Die Supabase-Verbindung ist nicht verfügbar.",
            );
            return;
        }

        setUpdatingItemId(item.id);
        setActionError(null);

        try {
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) throw new Error(userError.message);
            if (!user) throw new Error("Du bist nicht mehr angemeldet.");

            const nextEquippedState = !item.is_equipped;
            const { data, error } = await supabase
                .from("inventory_items")
                .update({ is_equipped: nextEquippedState })
                .eq("id", item.id)
                .eq("character_id", character.id)
                .eq("user_id", user.id)
                .select("id,is_equipped")
                .maybeSingle()
                .overrideTypes<
                    { id: string; is_equipped: boolean } | null,
                    { merge: false }
                >();

            if (error) throw new Error(error.message);
            if (!data) {
                throw new Error(
                    "Der Gegenstand wurde nicht gefunden oder darf nicht geändert werden.",
                );
            }

            setItems((currentItems) =>
                currentItems.map((currentItem) =>
                    currentItem.id === data.id
                        ? {
                              ...currentItem,
                              is_equipped: data.is_equipped,
                          }
                        : currentItem,
                ),
            );
        } catch (error) {
            setActionError(
                error instanceof Error
                    ? error.message
                    : "Der Ausrüstungsstatus konnte nicht geändert werden.",
            );
        } finally {
            setUpdatingItemId(null);
        }
    }

    if (isLoading) {
        return (
            <main className="min-h-screen bg-[#070713] px-4 py-10">
                <div className="mx-auto max-w-6xl animate-pulse">
                    <div className="h-32 rounded-3xl bg-white/[0.06]" />
                    <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <div
                                key={index}
                                className="h-72 rounded-3xl bg-white/[0.05]"
                            />
                        ))}
                    </div>
                </div>
            </main>
        );
    }

    if (errorMessage) {
        return (
            <StateMessage
                icon="⚠️"
                title="Inventar konnte nicht geladen werden"
                description={errorMessage}
                backHref={"/dashboard/characters/" + id}
                onRetry={() => void loadInventory()}
            />
        );
    }

    if (isNotFound || !character) {
        return (
            <StateMessage
                icon="🔍"
                title="Charakter nicht gefunden"
                description="Dieser Charakter existiert nicht oder gehört einem anderen Benutzer."
                backHref="/dashboard/characters"
            />
        );
    }

    const avatarIcon = getCharacterIcon(
        character.race,
        character.character_class,
    );

    return (
        <main className="relative min-h-screen overflow-hidden bg-[#070713] text-white">
            <BackgroundEffects />

            <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <header className="mb-8 rounded-3xl border border-violet-400/20 bg-white/[0.04] p-5 backdrop-blur-xl sm:p-6">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            <CharacterAvatar
                                name={character.name}
                                icon={avatarIcon}
                                size="md"
                            />
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.28em] text-violet-300">
                                    Inventar
                                </p>
                                <h1 className="mt-2 text-2xl font-black sm:text-3xl">
                                    Ausrüstung von {character.name}
                                </h1>
                                <p className="mt-1 text-sm text-slate-400">
                                    {items.length}{" "}
                                    {items.length === 1
                                        ? "Gegenstand"
                                        : "Gegenstände"}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Link
                                href={"/dashboard/characters/" + character.id}
                                className="rounded-xl border border-white/10 px-5 py-3 text-center text-sm font-bold text-slate-300 transition hover:border-violet-400/40 hover:bg-white/5"
                            >
                                Zurück zum Charakter
                            </Link>
                            <Link
                                href={
                                    "/dashboard/characters/" +
                                    character.id +
                                    "/inventory/new"
                                }
                                className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 text-center text-sm font-black transition hover:brightness-110"
                            >
                                Gegenstand hinzufügen
                            </Link>
                        </div>
                    </div>
                </header>


                {actionError && (
                    <div
                        role="alert"
                        className="mb-6 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100"
                    >
                        {actionError}
                    </div>
                )}

                {items.length === 0 ? (
                    <EmptyInventory characterId={character.id} />
                ) : (
                    <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {items.map((item) => (
                            <InventoryCard
                                key={item.id}
                                item={item}
                                isUpdating={updatingItemId === item.id}
                                onToggleEquipment={() =>
                                    void handleEquipment(item)
                                }
                            />
                        ))}
                    </section>
                )}
            </div>
        </main>
    );
}

function InventoryCard({
    item,
    isUpdating,
    onToggleEquipment,
}: {
    item: InventoryItem;
    isUpdating: boolean;
    onToggleEquipment: () => void;
}) {
    const normalizedType = item.item_type.toLowerCase();
    const normalizedRarity = item.rarity.toLowerCase();
    const icon = itemIcons[normalizedType] ?? "🎒";
    const rarityClass =
        rarityStyles[normalizedRarity] ?? rarityStyles.common;
    const rarityLabel =
        rarityLabels[normalizedRarity] ?? formatValue(item.rarity);

    return (
        <article
            className={[
                "relative overflow-hidden rounded-3xl border p-5 shadow-xl shadow-black/20",
                rarityClass,
            ].join(" ")}
        >
            {item.is_equipped && (
                <span className="absolute right-4 top-4 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-200">
                    Ausgerüstet
                </span>
            )}

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-black/25 text-3xl">
                {icon}
            </div>

            <p className="mt-5 text-xs font-black uppercase tracking-[0.22em]">
                {rarityLabel}
            </p>
            <h2 className="mt-2 pr-20 text-xl font-black text-white">
                {item.name}
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-400">
                {formatValue(item.item_type)} · Menge{" "}
                {Math.max(item.quantity, 1)}
            </p>

            <p className="mt-4 min-h-16 text-sm leading-6 text-slate-400">
                {item.description?.trim() ||
                    "Für diesen Gegenstand ist keine Beschreibung hinterlegt."}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-5">
                <Bonus
                    label="Angriff"
                    value={Math.max(item.attack_bonus, 0)}
                    icon="⚔️"
                />
                <Bonus
                    label="Verteidigung"
                    value={Math.max(item.defense_bonus, 0)}
                    icon="🛡️"
                />
            </div>

            <button
                type="button"
                onClick={onToggleEquipment}
                disabled={isUpdating}
                className={[
                    "mt-5 w-full rounded-xl border px-5 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60",
                    item.is_equipped
                        ? "border-slate-400/30 bg-slate-500/10 text-slate-200 hover:bg-slate-500/20"
                        : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20",
                ].join(" ")}
            >
                {isUpdating
                    ? "Wird aktualisiert ..."
                    : item.is_equipped
                      ? "Ablegen"
                      : "Ausrüsten"}
            </button>
        </article>
    );
}

function Bonus({
    label,
    value,
    icon,
}: {
    label: string;
    value: number;
    icon: string;
}) {
    return (
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {icon} {label}
            </p>
            <p className="mt-1 font-black text-white">+{value}</p>
        </div>
    );
}

function EmptyInventory({ characterId }: { characterId: string }) {
    return (
        <section className="rounded-3xl border border-dashed border-violet-400/30 bg-white/[0.03] px-6 py-20 text-center">
            <span className="text-6xl">🎒</span>
            <h2 className="mt-6 text-3xl font-black">
                Das Inventar ist noch leer
            </h2>
            <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-400">
                Noch trägt dieser Charakter keine Waffen, Rüstung oder
                Schätze bei sich.
            </p>
            <Link
                href={
                    "/dashboard/characters/" +
                    characterId +
                    "/inventory/new"
                }
                className="mt-7 inline-flex rounded-xl bg-violet-600 px-6 py-3 font-black transition hover:bg-violet-500"
            >
                Gegenstand hinzufügen
            </Link>
        </section>
    );
}

function StateMessage({
    icon,
    title,
    description,
    backHref,
    onRetry,
}: {
    icon: string;
    title: string;
    description: string;
    backHref: string;
    onRetry?: () => void;
}) {
    return (
        <main className="flex min-h-screen items-center justify-center bg-[#070713] px-4 text-white">
            <section className="max-w-xl rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
                <span className="text-5xl">{icon}</span>
                <h1 className="mt-5 text-3xl font-black">{title}</h1>
                <p className="mt-4 leading-7 text-slate-400">
                    {description}
                </p>
                <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                    {onRetry && (
                        <button
                            type="button"
                            onClick={onRetry}
                            className="rounded-xl bg-violet-600 px-6 py-3 font-bold"
                        >
                            Erneut versuchen
                        </button>
                    )}
                    <Link
                        href={backHref}
                        className="rounded-xl border border-white/10 px-6 py-3 font-bold text-slate-300"
                    >
                        Zurück
                    </Link>
                </div>
            </section>
        </main>
    );
}

function getCharacterIcon(race: string, characterClass: string) {
    const icons: Record<string, string> = {
        warrior: "⚔️",
        mage: "🔮",
        ranger: "🏹",
        rogue: "🗡️",
        paladin: "☀️",
        necromancer: "💀",
        human: "🛡️",
        elf: "🌿",
        dwarf: "⛏️",
        orc: "⚔️",
        shadowborn: "🌑",
        dragonkin: "🐉",
    };

    return (
        icons[characterClass.toLowerCase()] ??
        icons[race.toLowerCase()] ??
        "✦"
    );
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
            <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-700/20 blur-[120px]" />
            <div className="absolute -right-40 top-1/3 h-[32rem] w-[32rem] rounded-full bg-fuchsia-700/10 blur-[140px]" />
            <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-blue-700/10 blur-[120px]" />
        </div>
    );
}