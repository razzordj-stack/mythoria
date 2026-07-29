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
};

type FormErrors = {
    name?: string;
    race?: string;
    characterClass?: string;
    general?: string;
};

const raceOptions = [
    ["human", "Mensch"],
    ["elf", "Elf"],
    ["dwarf", "Zwerg"],
    ["orc", "Ork"],
    ["shadowborn", "Schattengeborener"],
    ["dragonkin", "Drachenblütiger"],
] as const;

const classOptions = [
    ["warrior", "Krieger"],
    ["mage", "Magier"],
    ["ranger", "Waldläufer"],
    ["rogue", "Schurke"],
    ["paladin", "Paladin"],
    ["necromancer", "Nekromant"],
] as const;

export default function EditCharacterPage() {
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

    const [name, setName] = useState("");
    const [race, setRace] = useState("");
    const [characterClass, setCharacterClass] = useState("");
    const [background, setBackground] = useState("");
    const [appearance, setAppearance] = useState("");
    const [level, setLevel] = useState(1);
    const [experience, setExperience] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isNotFound, setIsNotFound] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});

    const loadCharacter = useCallback(async () => {
        setIsLoading(true);
        setIsNotFound(false);
        setErrors({});

        if (!supabase) {
            setErrors({
                general:
                    "Die Supabase-Verbindung ist nicht konfiguriert. Prüfe die Umgebungsvariablen.",
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
                        "Du bist nicht angemeldet. Melde dich an, um diesen Charakter zu bearbeiten.",
                });
                return;
            }

            const { data, error } = await supabase
                .from("characters")
                .select(
                    "id,user_id,name,race,character_class,background,appearance,level,experience",
                )
                .eq("id", id)
                .eq("user_id", user.id)
                .maybeSingle()
                .overrideTypes<Character | null, { merge: false }>();

            if (error) throw new Error(error.message);

            if (!data) {
                setIsNotFound(true);
                return;
            }

            setName(data.name);
            setRace(data.race);
            setCharacterClass(data.character_class);
            setBackground(data.background ?? "");
            setAppearance(data.appearance ?? "");
            setLevel(Math.max(data.level ?? 1, 1));
            setExperience(Math.max(data.experience ?? 0, 0));
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

        if (name.trim().length < 3) {
            nextErrors.name =
                "Der Name muss mindestens 3 Zeichen enthalten.";
        } else if (name.trim().length > 40) {
            nextErrors.name =
                "Der Name darf höchstens 40 Zeichen enthalten.";
        }

        if (!race) {
            nextErrors.race = "Wähle ein Volk aus.";
        }

        if (!characterClass) {
            nextErrors.characterClass = "Wähle eine Klasse aus.";
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!validateForm() || !supabase) return;

        setIsSaving(true);

        try {
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) throw new Error(userError.message);
            if (!user) throw new Error("Du bist nicht mehr angemeldet.");

            const { data, error } = await supabase
                .from("characters")
                .update({
                    name: name.trim(),
                    race,
                    character_class: characterClass,
                    background: background.trim() || null,
                    appearance: appearance.trim() || null,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", id)
                .eq("user_id", user.id)
                .select("id")
                .maybeSingle()
                .overrideTypes<{ id: string } | null, { merge: false }>();

            if (error) throw new Error(error.message);

            if (!data) {
                throw new Error(
                    "Der Charakter wurde nicht gefunden oder darf nicht bearbeitet werden.",
                );
            }

            router.replace("/dashboard/characters/" + id);
            router.refresh();
        } catch (error) {
            setErrors({
                general:
                    error instanceof Error
                        ? error.message
                        : "Die Änderungen konnten nicht gespeichert werden.",
            });
        } finally {
            setIsSaving(false);
        }
    }

    if (isLoading) {
        return (
            <main className="min-h-screen bg-[#020403] px-4 py-10">
                <div className="mx-auto max-w-5xl animate-pulse">
                    <div className="h-28 rounded-3xl bg-[var(--mythoria-surface-light)]/90" />
                    <div className="mt-8 h-[42rem] rounded-3xl bg-[var(--mythoria-surface-light)]/80" />
                </div>
            </main>
        );
    }

    if (isNotFound) {
        return (
            <StateMessage
                title="Charakter nicht gefunden"
                description="Dieser Charakter existiert nicht oder gehört einem anderen Benutzer."
            />
        );
    }

    return (
        <main className="relative min-h-screen overflow-hidden bg-[#020403] text-white">
            <BackgroundEffects />

            <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
                <header className="mb-8 flex flex-col gap-4 rounded-3xl border border-lime-400/20 bg-[var(--mythoria-surface)]/90 p-5 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.3em] text-lime-200">
                            Charaktereditor
                        </p>
                        <h1 className="mt-2 text-2xl font-black sm:text-3xl">
                            {name || "Charakter"} bearbeiten
                        </h1>
                    </div>
                    <Link
                        href={"/dashboard/characters/" + id}
                        className="rounded-xl border border-[var(--mythoria-border)] px-5 py-3 text-center text-sm font-bold text-[var(--mythoria-text-secondary)] transition hover:border-lime-400/40 hover:bg-white/5"
                    >
                        Abbrechen
                    </Link>
                </header>

                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                    {errors.general && (
                        <div
                            role="alert"
                            className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm leading-6 text-red-100"
                        >
                            {errors.general}
                        </div>
                    )}

                    <section className="rounded-3xl border border-[var(--mythoria-border)] bg-[var(--mythoria-surface)]/90 p-5 backdrop-blur-xl sm:p-7">
                        <SectionTitle
                            number="01"
                            title="Identität"
                            description="Ändere Namen, Volk und Klasse deines Charakters."
                        />

                        <div className="grid gap-5 md:grid-cols-2">
                            <Field
                                label="Charaktername"
                                error={errors.name}
                                className="md:col-span-2"
                            >
                                <input
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                    maxLength={40}
                                    className={inputClasses(Boolean(errors.name))}
                                />
                            </Field>

                            <Field label="Volk" error={errors.race}>
                                <select
                                    value={race}
                                    onChange={(event) => setRace(event.target.value)}
                                    className={inputClasses(Boolean(errors.race))}
                                >
                                    <option value="">Volk auswählen</option>
                                    {raceOptions.map(([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field
                                label="Klasse"
                                error={errors.characterClass}
                            >
                                <select
                                    value={characterClass}
                                    onChange={(event) =>
                                        setCharacterClass(event.target.value)
                                    }
                                    className={inputClasses(
                                        Boolean(errors.characterClass),
                                    )}
                                >
                                    <option value="">Klasse auswählen</option>
                                    {classOptions.map(([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                        </div>
                    </section>

                    <section className="rounded-3xl border border-[var(--mythoria-border)] bg-[var(--mythoria-surface)]/90 p-5 backdrop-blur-xl sm:p-7">
                        <SectionTitle
                            number="02"
                            title="Chronik"
                            description="Beschreibe Vergangenheit und Erscheinungsbild."
                        />

                        <div className="space-y-5">
                            <Field label="Hintergrundgeschichte">
                                <textarea
                                    value={background}
                                    onChange={(event) =>
                                        setBackground(event.target.value)
                                    }
                                    rows={7}
                                    maxLength={1500}
                                    className={inputClasses(false)}
                                />
                            </Field>
                            <Field label="Erscheinungsbild">
                                <textarea
                                    value={appearance}
                                    onChange={(event) =>
                                        setAppearance(event.target.value)
                                    }
                                    rows={5}
                                    maxLength={1000}
                                    className={inputClasses(false)}
                                />
                            </Field>
                        </div>
                    </section>

                    <section className="rounded-3xl border border-amber-400/15 bg-amber-500/[0.04] p-5 sm:p-7">
                        <SectionTitle
                            number="03"
                            title="Fortschritt"
                            description="Diese Werte werden vom Spielsystem verwaltet und können hier nicht geändert werden."
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <ReadOnlyStat label="Stufe" value={level} />
                            <ReadOnlyStat
                                label="Erfahrung"
                                value={experience}
                                suffix=" EP"
                            />
                        </div>
                    </section>

                    <div className="flex flex-col-reverse gap-3 rounded-3xl border border-[var(--mythoria-border)] bg-black/20 p-5 sm:flex-row sm:justify-end">
                        <Link
                            href={"/dashboard/characters/" + id}
                            className="rounded-xl border border-[var(--mythoria-border)] px-6 py-3 text-center font-bold text-[var(--mythoria-text-secondary)] transition hover:bg-white/5"
                        >
                            Abbrechen
                        </Link>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="rounded-xl bg-gradient-to-r from-green-700 to-amber-700 px-7 py-3 font-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSaving
                                ? "Änderungen werden gespeichert ..."
                                : "Änderungen speichern"}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}

function SectionTitle({
    number,
    title,
    description,
}: {
    number: string;
    title: string;
    description: string;
}) {
    return (
        <div className="mb-6 flex gap-4">
            <span className="flex h-11 min-w-11 items-center justify-center rounded-xl border border-lime-400/20 bg-lime-500/10 text-sm font-black text-lime-200">
                {number}
            </span>
            <div>
                <h2 className="text-xl font-black">{title}</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--mythoria-text-muted)]">
                    {description}
                </p>
            </div>
        </div>
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
            <span className="mb-2 block text-sm font-bold text-[var(--mythoria-text)]">
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

function ReadOnlyStat({
    label,
    value,
    suffix = "",
}: {
    label: string;
    value: number;
    suffix?: string;
}) {
    return (
        <div className="rounded-2xl border border-[var(--mythoria-border)] bg-black/20 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--mythoria-text-disabled)]">
                {label}
            </p>
            <p className="mt-2 text-2xl font-black text-amber-200">
                {value.toLocaleString("de-DE")}
                {suffix}
            </p>
        </div>
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
        <main className="flex min-h-screen items-center justify-center bg-[#020403] px-4 text-white">
            <section className="max-w-xl rounded-3xl border border-[var(--mythoria-border)] bg-[var(--mythoria-surface)]/90 p-8 text-center">
                <span className="text-5xl">🔍</span>
                <h1 className="mt-5 text-3xl font-black">{title}</h1>
                <p className="mt-4 leading-7 text-[var(--mythoria-text-muted)]">
                    {description}
                </p>
                <Link
                    href="/dashboard/characters"
                    className="mt-7 inline-flex rounded-xl bg-green-700 px-6 py-3 font-bold"
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
            : "border-[var(--mythoria-border)] focus:border-lime-400/70",
    ].join(" ");
}

function BackgroundEffects() {
    return (
        <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
        >
            <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-green-800/20 blur-[120px]" />
            <div className="absolute -right-40 top-1/3 h-[32rem] w-[32rem] rounded-full bg-amber-800/10 blur-[140px]" />
        </div>
    );
}