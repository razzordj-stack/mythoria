"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
    type FormEvent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import { createBrowserClient } from "@supabase/ssr";

type CharacterSummary = {
    id: string;
    user_id: string;
    name: string;
};

type FormErrors = {
    name?: string;
    itemType?: string;
    rarity?: string;
    quantity?: string;
    attackBonus?: string;
    defenseBonus?: string;
    general?: string;
};

const itemTypes = [
    ["weapon", "Waffe"],
    ["armor", "Rüstung"],
    ["accessory", "Accessoire"],
    ["potion", "Trank"],
    ["consumable", "Verbrauchsgegenstand"],
    ["quest", "Questgegenstand"],
    ["treasure", "Schatz"],
] as const;

const rarities = [
    ["common", "Gewöhnlich"],
    ["uncommon", "Ungewöhnlich"],
    ["rare", "Selten"],
    ["epic", "Episch"],
    ["legendary", "Legendär"],
] as const;

export default function NewInventoryItemPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
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
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [itemType, setItemType] = useState("");
    const [rarity, setRarity] = useState("common");
    const [quantity, setQuantity] = useState(1);
    const [attackBonus, setAttackBonus] = useState(0);
    const [defenseBonus, setDefenseBonus] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isNotFound, setIsNotFound] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [successMessage, setSuccessMessage] = useState<string | null>(
        null,
    );

    const loadCharacter = useCallback(async () => {
        setIsLoading(true);
        setIsNotFound(false);
        setErrors({});

        if (!supabase) {
            setErrors({
                general: "Die Supabase-Verbindung ist nicht konfiguriert.",
            });
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
                setErrors({
                    general:
                        "Du bist nicht angemeldet. Melde dich an, um Gegenstände hinzuzufügen.",
                });
                return;
            }

            const { data, error } = await supabase
                .from("characters")
                .select("id,user_id,name")
                .eq("id", id)
                .eq("user_id", user.id)
                .maybeSingle()
                .overrideTypes<CharacterSummary | null, { merge: false }>();

            if (error) throw new Error(error.message);

            if (!data) {
                setIsNotFound(true);
                return;
            }

            setCharacter(data);
        } catch (error) {
            setErrors({
                general:
                    error instanceof Error
                        ? error.message
                        : "Der Charakter konnte nicht geladen werden.",
            });
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

    function validateForm() {
        const nextErrors: FormErrors = {};

        if (name.trim().length < 2) {
            nextErrors.name =
                "Der Gegenstandsname muss mindestens 2 Zeichen enthalten.";
        } else if (name.trim().length > 80) {
            nextErrors.name =
                "Der Gegenstandsname darf höchstens 80 Zeichen enthalten.";
        }

        if (!itemTypes.some(([value]) => value === itemType)) {
            nextErrors.itemType = "Wähle einen gültigen Gegenstandstyp.";
        }

        if (!rarities.some(([value]) => value === rarity)) {
            nextErrors.rarity = "Wähle eine gültige Seltenheit.";
        }

        if (!Number.isInteger(quantity) || quantity < 1) {
            nextErrors.quantity = "Die Menge muss mindestens 1 betragen.";
        }

        if (!Number.isInteger(attackBonus) || attackBonus < 0) {
            nextErrors.attackBonus =
                "Der Angriffsbonus darf nicht negativ sein.";
        }

        if (!Number.isInteger(defenseBonus) || defenseBonus < 0) {
            nextErrors.defenseBonus =
                "Der Verteidigungsbonus darf nicht negativ sein.";
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSuccessMessage(null);

        if (!validateForm() || !supabase || !character) return;

        setIsSaving(true);

        try {
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) throw new Error(userError.message);
            if (!user) throw new Error("Du bist nicht mehr angemeldet.");

            const { data, error } = await supabase
                .from("inventory_items")
                .insert({
                    character_id: character.id,
                    user_id: user.id,
                    name: name.trim(),
                    description: description.trim() || null,
                    item_type: itemType,
                    rarity,
                    quantity,
                    is_equipped: false,
                    attack_bonus: attackBonus,
                    defense_bonus: defenseBonus,
                })
                .select("id")
                .single()
                .overrideTypes<{ id: string }, { merge: false }>();

            if (error) throw new Error(error.message);
            if (!data.id) {
                throw new Error(
                    "Der Gegenstand wurde gespeichert, aber nicht bestätigt.",
                );
            }

            setSuccessMessage(
                name.trim() + " wurde dem Inventar hinzugefügt.",
            );
            router.replace(
                "/dashboard/characters/" + character.id + "/inventory",
            );
            router.refresh();
        } catch (error) {
            setErrors({
                general:
                    error instanceof Error
                        ? error.message
                        : "Der Gegenstand konnte nicht gespeichert werden.",
            });
        } finally {
            setIsSaving(false);
        }
    }

    if (isLoading) {
        return (
            <main className="min-h-screen bg-[#070713] px-4 py-10">
                <div className="mx-auto h-[42rem] max-w-4xl animate-pulse rounded-3xl bg-white/[0.05]" />
            </main>
        );
    }

    if (isNotFound || !character) {
        return (
            <StateMessage
                title="Charakter nicht gefunden"
                description={
                    errors.general ??
                    "Dieser Charakter existiert nicht oder gehört einem anderen Benutzer."
                }
            />
        );
    }

    return (
        <main className="relative min-h-screen overflow-hidden bg-[#070713] text-white">
            <BackgroundEffects />

            <div className="relative z-10 mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
                <header className="mb-8 flex flex-col gap-4 rounded-3xl border border-violet-400/20 bg-white/[0.04] p-5 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.3em] text-violet-300">
                            Inventar erweitern
                        </p>
                        <h1 className="mt-2 text-2xl font-black sm:text-3xl">
                            Gegenstand für {character.name}
                        </h1>
                    </div>
                    <Link
                        href={
                            "/dashboard/characters/" +
                            character.id +
                            "/inventory"
                        }
                        className="rounded-xl border border-white/10 px-5 py-3 text-center text-sm font-bold text-slate-300 transition hover:border-violet-400/40 hover:bg-white/5"
                    >
                        Zurück zum Inventar
                    </Link>
                </header>

                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                    {errors.general && (
                        <div
                            role="alert"
                            className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100"
                        >
                            {errors.general}
                        </div>
                    )}
                    {successMessage && (
                        <div
                            role="status"
                            className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100"
                        >
                            {successMessage}
                        </div>
                    )}

                    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl sm:p-7">
                        <div className="grid gap-5 md:grid-cols-2">
                            <Field
                                label="Name"
                                error={errors.name}
                                className="md:col-span-2"
                            >
                                <input
                                    value={name}
                                    onChange={(event) =>
                                        setName(event.target.value)
                                    }
                                    maxLength={80}
                                    placeholder="Zum Beispiel: Klinge der Morgenröte"
                                    className={inputClasses(
                                        Boolean(errors.name),
                                    )}
                                />
                            </Field>

                            <Field
                                label="Gegenstandstyp"
                                error={errors.itemType}
                            >
                                <select
                                    value={itemType}
                                    onChange={(event) =>
                                        setItemType(event.target.value)
                                    }
                                    className={inputClasses(
                                        Boolean(errors.itemType),
                                    )}
                                >
                                    <option value="">Typ auswählen</option>
                                    {itemTypes.map(([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field
                                label="Seltenheit"
                                error={errors.rarity}
                            >
                                <select
                                    value={rarity}
                                    onChange={(event) =>
                                        setRarity(event.target.value)
                                    }
                                    className={inputClasses(
                                        Boolean(errors.rarity),
                                    )}
                                >
                                    {rarities.map(([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field
                                label="Beschreibung"
                                className="md:col-span-2"
                            >
                                <textarea
                                    value={description}
                                    onChange={(event) =>
                                        setDescription(event.target.value)
                                    }
                                    rows={5}
                                    maxLength={1000}
                                    placeholder="Herkunft, Material und besondere Merkmale ..."
                                    className={inputClasses(false)}
                                />
                            </Field>

                            <NumberField
                                label="Menge"
                                value={quantity}
                                minimum={1}
                                error={errors.quantity}
                                onChange={setQuantity}
                            />
                            <NumberField
                                label="Angriffsbonus"
                                value={attackBonus}
                                minimum={0}
                                error={errors.attackBonus}
                                onChange={setAttackBonus}
                            />
                            <NumberField
                                label="Verteidigungsbonus"
                                value={defenseBonus}
                                minimum={0}
                                error={errors.defenseBonus}
                                onChange={setDefenseBonus}
                            />
                        </div>
                    </section>

                    <div className="flex flex-col-reverse gap-3 rounded-3xl border border-white/10 bg-black/20 p-5 sm:flex-row sm:justify-end">
                        <Link
                            href={
                                "/dashboard/characters/" +
                                character.id +
                                "/inventory"
                            }
                            className="rounded-xl border border-white/10 px-6 py-3 text-center font-bold text-slate-300"
                        >
                            Abbrechen
                        </Link>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-7 py-3 font-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSaving
                                ? "Gegenstand wird gespeichert ..."
                                : "Gegenstand speichern"}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}

function Field({
    label,
    error,
    className = "",
    children,
}: {
    label: string;
    error?: string;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <label className={className}>
            <span className="mb-2 block text-sm font-bold text-slate-200">
                {label}
            </span>
            {children}
            {error && (
                <span className="mt-2 block text-sm text-red-300">
                    {error}
                </span>
            )}
        </label>
    );
}

function NumberField({
    label,
    value,
    minimum,
    error,
    onChange,
}: {
    label: string;
    value: number;
    minimum: number;
    error?: string;
    onChange: (value: number) => void;
}) {
    return (
        <Field label={label} error={error}>
            <input
                type="number"
                min={minimum}
                step={1}
                value={value}
                onChange={(event) =>
                    onChange(Number(event.target.value))
                }
                className={inputClasses(Boolean(error))}
            />
        </Field>
    );
}

function StateMessage({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <main className="flex min-h-screen items-center justify-center bg-[#070713] px-4 text-white">
            <section className="max-w-xl rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
                <span className="text-5xl">🔍</span>
                <h1 className="mt-5 text-3xl font-black">{title}</h1>
                <p className="mt-4 leading-7 text-slate-400">
                    {description}
                </p>
                <Link
                    href="/dashboard/characters"
                    className="mt-7 inline-flex rounded-xl bg-violet-600 px-6 py-3 font-bold"
                >
                    Zurück zur Übersicht
                </Link>
            </section>
        </main>
    );
}

function inputClasses(hasError: boolean) {
    return [
        "w-full rounded-2xl border bg-black/30 px-4 py-3.5 text-white outline-none transition",
        hasError
            ? "border-red-400/60 focus:border-red-300"
            : "border-white/10 focus:border-violet-400/70",
    ].join(" ");
}

function BackgroundEffects() {
    return (
        <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
        >
            <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-700/20 blur-[120px]" />
            <div className="absolute -right-40 top-1/3 h-[32rem] w-[32rem] rounded-full bg-fuchsia-700/10 blur-[140px]" />
        </div>
    );
}