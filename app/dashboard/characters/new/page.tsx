"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    type FormEvent,
    type ReactNode,
    useMemo,
    useState,
} from "react";
import { createBrowserClient } from "@supabase/ssr";

type FormErrors = {
    name?: string;
    race?: string;
    characterClass?: string;
    general?: string;
};

type RaceOption = {
    id: string;
    name: string;
    icon: string;
    description: string;
    bonus: string;
};

type ClassOption = {
    id: string;
    name: string;
    icon: string;
    description: string;
    specialty: string;
};

const raceOptions: RaceOption[] = [
    {
        id: "human",
        name: "Mensch",
        icon: "🛡️",
        description:
            "Anpassungsfähig, entschlossen und in allen Reichen Mythorias anzutreffen.",
        bonus: "Ausgewogene Attribute",
    },
    {
        id: "elf",
        name: "Elf",
        icon: "🌿",
        description:
            "Alte Waldvölker mit scharfen Sinnen und einer natürlichen Verbindung zur Magie.",
        bonus: "Magie und Geschick",
    },
    {
        id: "dwarf",
        name: "Zwerg",
        icon: "⛏️",
        description:
            "Widerstandsfähige Bergbewohner, Meister der Schmiedekunst und des Nahkampfs.",
        bonus: "Stärke und Rüstung",
    },
    {
        id: "orc",
        name: "Ork",
        icon: "⚔️",
        description:
            "Furchtlose Krieger mit großer Körperkraft und einem unerschütterlichen Willen.",
        bonus: "Kraft und Ausdauer",
    },
    {
        id: "shadowborn",
        name: "Schattengeborener",
        icon: "🌑",
        description:
            "Mysteriöse Wesen zwischen Licht und Dunkelheit, umgeben von verbotener Magie.",
        bonus: "Schatten und Täuschung",
    },
    {
        id: "dragonkin",
        name: "Drachenblütiger",
        icon: "🐉",
        description:
            "Seltene Nachfahren uralter Drachen, in deren Adern elementare Macht pulsiert.",
        bonus: "Elementarkraft",
    },
];

const classOptions: ClassOption[] = [
    {
        id: "warrior",
        name: "Krieger",
        icon: "⚔️",
        description:
            "Ein standhafter Nahkämpfer mit schwerer Rüstung und mächtigen Waffen.",
        specialty: "Nahkampf",
    },
    {
        id: "mage",
        name: "Magier",
        icon: "🔮",
        description:
            "Beherrscht arkane Energien und entfesselt vernichtende Zauber.",
        specialty: "Arkane Magie",
    },
    {
        id: "ranger",
        name: "Waldläufer",
        icon: "🏹",
        description:
            "Ein präziser Fernkämpfer, Spurenleser und Überlebenskünstler.",
        specialty: "Fernkampf",
    },
    {
        id: "rogue",
        name: "Schurke",
        icon: "🗡️",
        description:
            "Schnell, lautlos und tödlich. Meister von Schatten, Fallen und Hinterhalten.",
        specialty: "Täuschung",
    },
    {
        id: "paladin",
        name: "Paladin",
        icon: "☀️",
        description:
            "Ein heiliger Kämpfer, der Schutzmagie mit schwerer Bewaffnung verbindet.",
        specialty: "Schutz und Heilung",
    },
    {
        id: "necromancer",
        name: "Nekromant",
        icon: "💀",
        description:
            "Ein verbotener Magier, der die Grenze zwischen Leben und Tod berührt.",
        specialty: "Totenmagie",
    },
];

export default function NewCharacterPage() {
    const router = useRouter();

    /*
     * Unterstützt sowohl den aktuellen Publishable Key
     * als auch den älteren ANON-Key-Namen.
     */
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    /*
     * Wenn Variablen fehlen, wird null zurückgegeben.
     * Dadurch scheitert der Next.js-Build nicht sofort.
     */
    const supabase = useMemo(() => {
        if (!supabaseUrl || !supabaseKey) {
            return null;
        }

        return createBrowserClient(supabaseUrl, supabaseKey);
    }, [supabaseKey, supabaseUrl]);

    const [name, setName] = useState("");
    const [race, setRace] = useState("");
    const [characterClass, setCharacterClass] = useState("");
    const [background, setBackground] = useState("");
    const [appearance, setAppearance] = useState("");

    const [errors, setErrors] = useState<FormErrors>({});
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const selectedRace =
        raceOptions.find((option) => option.id === race) ?? null;

    const selectedClass =
        classOptions.find((option) => option.id === characterClass) ?? null;

    const completedFields = [
        name.trim().length >= 3,
        Boolean(race),
        Boolean(characterClass),
        background.trim().length >= 20,
        appearance.trim().length >= 10,
    ].filter(Boolean).length;

    const progress = Math.round((completedFields / 5) * 100);

    function validateForm(): boolean {
        const nextErrors: FormErrors = {};

        if (name.trim().length < 3) {
            nextErrors.name =
                "Der Charaktername muss mindestens 3 Zeichen enthalten.";
        }

        if (name.trim().length > 40) {
            nextErrors.name =
                "Der Charaktername darf höchstens 40 Zeichen enthalten.";
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

        setSuccessMessage("");
        setErrors({});

        if (!validateForm()) {
            return;
        }

        if (!supabase) {
            setErrors({
                general:
                    "Die Supabase-Umgebungsvariablen fehlen. Hinterlege NEXT_PUBLIC_SUPABASE_URL und einen Supabase-Schlüssel.",
            });
            return;
        }

        setIsSaving(true);

        try {
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) {
                throw new Error(userError.message);
            }

            if (!user) {
                setErrors({
                    general:
                        "Du bist nicht angemeldet. Melde dich an, bevor du einen Charakter erstellst.",
                });
                return;
            }

            const { data, error } = await supabase
                .from("characters")
                .insert({
                    user_id: user.id,
                    name: name.trim(),
                    race,
                    character_class: characterClass,
                    background: background.trim() || null,
                    appearance: appearance.trim() || null,
                    level: 1,
                    experience: 0,
                })
                .select("id")
                .single();

            if (error) {
                throw new Error(error.message);
            }

            if (!data?.id) {
                throw new Error(
                    "Der Charakter wurde gespeichert, aber es wurde keine ID zurückgegeben.",
                );
            }

            setSuccessMessage(
                `${name.trim()} wurde erfolgreich in Mythoria erschaffen.`,
            );

            router.push(`/dashboard/characters/${data.id}`);
            router.refresh();
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Beim Speichern ist ein unbekannter Fehler aufgetreten.";

            setErrors({
                general: message,
            });
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <main className="relative min-h-screen overflow-hidden bg-[#070713] text-white">
            <BackgroundEffects />

            <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <header className="mb-8 flex flex-col gap-4 rounded-3xl border border-violet-400/20 bg-white/[0.04] p-5 shadow-2xl shadow-violet-950/20 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard/characters"
                            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xl transition hover:border-violet-400/40 hover:bg-violet-500/10"
                            aria-label="Zurück zur Charakterübersicht"
                        >
                            ←
                        </Link>

                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-violet-300">
                                Mythoria
                            </p>

                            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                                Neuen Charakter erschaffen
                            </h1>
                        </div>
                    </div>

                    <Link
                        href="/dashboard"
                        className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-center text-sm font-semibold text-slate-200 transition hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-white"
                    >
                        Zum Dashboard
                    </Link>
                </header>

                <div className="mb-8 rounded-2xl border border-white/10 bg-black/20 p-5 backdrop-blur-xl">
                    <div className="mb-3 flex items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-semibold text-white">
                                Erschaffungsfortschritt
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                                Name, Volk und Klasse sind Pflichtfelder.
                            </p>
                        </div>

                        <span className="text-lg font-black text-violet-300">
                            {progress} %
                        </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-400 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
                    <form
                        onSubmit={handleSubmit}
                        className="space-y-7"
                        noValidate
                    >
                        {errors.general && (
                            <div
                                role="alert"
                                className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm leading-6 text-red-100"
                            >
                                <strong className="block font-bold text-red-200">
                                    Charakter konnte nicht gespeichert werden
                                </strong>

                                <span>{errors.general}</span>
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

                        <FormSection
                            number="01"
                            title="Identität"
                            description="Gib deiner Legende einen Namen."
                        >
                            <label className="block">
                                <span className="mb-2 block text-sm font-semibold text-slate-200">
                                    Charaktername
                                </span>

                                <input
                                    type="text"
                                    value={name}
                                    onChange={(event) => {
                                        setName(event.target.value);

                                        if (errors.name) {
                                            setErrors((current) => ({
                                                ...current,
                                                name: undefined,
                                            }));
                                        }
                                    }}
                                    placeholder="Zum Beispiel: Kael Schattenklinge"
                                    maxLength={40}
                                    className={[
                                        "w-full rounded-2xl border bg-black/30 px-4 py-4 text-white outline-none transition placeholder:text-slate-600",
                                        errors.name
                                            ? "border-red-400/60 focus:border-red-300"
                                            : "border-white/10 focus:border-violet-400/70",
                                    ].join(" ")}
                                />

                                <div className="mt-2 flex items-center justify-between gap-4">
                                    <span className="text-sm text-red-300">
                                        {errors.name ?? ""}
                                    </span>

                                    <span className="text-xs text-slate-500">
                                        {name.length}/40
                                    </span>
                                </div>
                            </label>
                        </FormSection>

                        <FormSection
                            number="02"
                            title="Volk"
                            description="Deine Herkunft prägt deine Geschichte und deine natürlichen Stärken."
                        >
                            <div className="grid gap-4 md:grid-cols-2">
                                {raceOptions.map((option) => (
                                    <SelectionCard
                                        key={option.id}
                                        selected={race === option.id}
                                        title={option.name}
                                        icon={option.icon}
                                        description={option.description}
                                        detail={option.bonus}
                                        onClick={() => {
                                            setRace(option.id);

                                            if (errors.race) {
                                                setErrors((current) => ({
                                                    ...current,
                                                    race: undefined,
                                                }));
                                            }
                                        }}
                                    />
                                ))}
                            </div>

                            {errors.race && (
                                <p className="mt-4 text-sm text-red-300">
                                    {errors.race}
                                </p>
                            )}
                        </FormSection>

                        <FormSection
                            number="03"
                            title="Klasse"
                            description="Wähle, wie dein Charakter kämpft und welche Fähigkeiten er entwickelt."
                        >
                            <div className="grid gap-4 md:grid-cols-2">
                                {classOptions.map((option) => (
                                    <SelectionCard
                                        key={option.id}
                                        selected={characterClass === option.id}
                                        title={option.name}
                                        icon={option.icon}
                                        description={option.description}
                                        detail={option.specialty}
                                        onClick={() => {
                                            setCharacterClass(option.id);

                                            if (errors.characterClass) {
                                                setErrors((current) => ({
                                                    ...current,
                                                    characterClass: undefined,
                                                }));
                                            }
                                        }}
                                    />
                                ))}
                            </div>

                            {errors.characterClass && (
                                <p className="mt-4 text-sm text-red-300">
                                    {errors.characterClass}
                                </p>
                            )}
                        </FormSection>

                        <FormSection
                            number="04"
                            title="Vergangenheit"
                            description="Welche Ereignisse haben deinen Charakter nach Mythoria geführt?"
                        >
                            <label className="block">
                                <span className="sr-only">
                                    Hintergrundgeschichte
                                </span>

                                <textarea
                                    value={background}
                                    onChange={(event) =>
                                        setBackground(event.target.value)
                                    }
                                    placeholder="Erzähle von Herkunft, Verlusten, Zielen, Verbündeten oder einem dunklen Geheimnis ..."
                                    rows={7}
                                    maxLength={1500}
                                    className="w-full resize-y rounded-2xl border border-white/10 bg-black/30 px-4 py-4 leading-7 text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/70"
                                />

                                <div className="mt-2 flex items-center justify-between gap-4 text-xs text-slate-500">
                                    <span>
                                        Empfehlung: mindestens 20 Zeichen
                                    </span>

                                    <span>{background.length}/1500</span>
                                </div>
                            </label>
                        </FormSection>

                        <FormSection
                            number="05"
                            title="Erscheinungsbild"
                            description="Beschreibe das Gesicht, die Kleidung und auffällige Merkmale."
                        >
                            <label className="block">
                                <span className="sr-only">
                                    Erscheinungsbild
                                </span>

                                <textarea
                                    value={appearance}
                                    onChange={(event) =>
                                        setAppearance(event.target.value)
                                    }
                                    placeholder="Zum Beispiel: silbernes Haar, eine Narbe über dem linken Auge und eine schwarze Rüstung ..."
                                    rows={5}
                                    maxLength={1000}
                                    className="w-full resize-y rounded-2xl border border-white/10 bg-black/30 px-4 py-4 leading-7 text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/70"
                                />

                                <div className="mt-2 flex items-center justify-between gap-4 text-xs text-slate-500">
                                    <span>
                                        Diese Beschreibung erscheint im Charakterprofil.
                                    </span>

                                    <span>{appearance.length}/1000</span>
                                </div>
                            </label>
                        </FormSection>

                        <div className="flex flex-col-reverse gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
                            <Link
                                href="/dashboard/characters"
                                className="rounded-xl border border-white/10 px-6 py-3 text-center text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white"
                            >
                                Abbrechen
                            </Link>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-purple-600 px-7 py-3 text-sm font-black text-white shadow-lg shadow-violet-950/50 transition hover:scale-[1.01] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isSaving
                                    ? "Charakter wird erschaffen ..."
                                    : "Charakter erschaffen"}
                            </button>
                        </div>
                    </form>

                    <aside className="xl:sticky xl:top-6 xl:self-start">
                        <CharacterPreview
                            name={name}
                            race={selectedRace}
                            characterClass={selectedClass}
                            background={background}
                            appearance={appearance}
                        />
                    </aside>
                </div>
            </div>
        </main>
    );
}

type FormSectionProps = {
    number: string;
    title: string;
    description: string;
    children: ReactNode;
};

function FormSection({
    number,
    title,
    description,
    children,
}: FormSectionProps) {
    return (
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/20 backdrop-blur-xl sm:p-7">
            <div className="mb-6 flex items-start gap-4">
                <span className="flex h-11 min-w-11 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/10 text-sm font-black text-violet-300">
                    {number}
                </span>

                <div>
                    <h2 className="text-xl font-black text-white">
                        {title}
                    </h2>

                    <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">
                        {description}
                    </p>
                </div>
            </div>

            {children}
        </section>
    );
}

type SelectionCardProps = {
    selected: boolean;
    title: string;
    icon: string;
    description: string;
    detail: string;
    onClick: () => void;
};

function SelectionCard({
    selected,
    title,
    icon,
    description,
    detail,
    onClick,
}: SelectionCardProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={selected}
            className={[
                "group relative overflow-hidden rounded-2xl border p-5 text-left transition",
                selected
                    ? "border-violet-400/70 bg-violet-500/15 shadow-lg shadow-violet-950/30"
                    : "border-white/10 bg-black/20 hover:border-violet-400/40 hover:bg-violet-500/5",
            ].join(" ")}
        >
            <div className="flex items-start gap-4">
                <span className="flex h-12 min-w-12 items-center justify-center rounded-xl border border-white/10 bg-black/30 text-2xl">
                    {icon}
                </span>

                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white">
                            {title}
                        </h3>

                        {selected && (
                            <span className="rounded-full bg-violet-400 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-violet-950">
                                Gewählt
                            </span>
                        )}
                    </div>

                    <p className="mt-2 text-sm leading-6 text-slate-400">
                        {description}
                    </p>

                    <p className="mt-3 text-xs font-bold uppercase tracking-wider text-violet-300">
                        {detail}
                    </p>
                </div>
            </div>
        </button>
    );
}

type CharacterPreviewProps = {
    name: string;
    race: RaceOption | null;
    characterClass: ClassOption | null;
    background: string;
    appearance: string;
};

function CharacterPreview({
    name,
    race,
    characterClass,
    background,
    appearance,
}: CharacterPreviewProps) {
    const displayName = name.trim() || "Unbenannter Held";
    const displayIcon = characterClass?.icon ?? race?.icon ?? "✦";

    return (
        <div className="overflow-hidden rounded-3xl border border-violet-400/20 bg-[#0c0b1c]/90 shadow-2xl shadow-violet-950/40 backdrop-blur-xl">
            <div className="relative flex min-h-64 items-center justify-center overflow-hidden border-b border-white/10 bg-gradient-to-br from-violet-950 via-[#17102f] to-black">
                <div className="absolute left-8 top-8 h-24 w-24 rounded-full bg-violet-500/20 blur-3xl" />
                <div className="absolute bottom-4 right-5 h-28 w-28 rounded-full bg-fuchsia-500/10 blur-3xl" />

                <div className="relative text-center">
                    <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border border-violet-300/30 bg-black/30 text-6xl shadow-xl shadow-violet-950/50">
                        {displayIcon}
                    </div>

                    <span className="mt-5 inline-block rounded-full border border-white/10 bg-black/30 px-4 py-1 text-xs font-bold uppercase tracking-[0.25em] text-violet-200">
                        Stufe 1
                    </span>
                </div>
            </div>

            <div className="p-6">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-violet-400">
                    Charaktervorschau
                </p>

                <h2 className="mt-3 break-words text-2xl font-black text-white">
                    {displayName}
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                    {race?.name ?? "Volk unbekannt"}
                    <span className="mx-2 text-violet-500">•</span>
                    {characterClass?.name ?? "Klasse unbekannt"}
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3">
                    <PreviewStat
                        label="Volk"
                        value={race?.name ?? "Offen"}
                    />

                    <PreviewStat
                        label="Klasse"
                        value={characterClass?.name ?? "Offen"}
                    />

                    <PreviewStat
                        label="Level"
                        value="1"
                    />

                    <PreviewStat
                        label="Erfahrung"
                        value="0 EP"
                    />
                </div>

                <div className="mt-6 space-y-5 border-t border-white/10 pt-5">
                    <PreviewText
                        title="Vergangenheit"
                        value={
                            background.trim() ||
                            "Noch liegt die Vergangenheit dieses Charakters verborgen."
                        }
                    />

                    <PreviewText
                        title="Erscheinung"
                        value={
                            appearance.trim() ||
                            "Das Erscheinungsbild wurde noch nicht beschrieben."
                        }
                    />
                </div>

                <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-400/5 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
                        Beginn der Legende
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-400">
                        Nach dem Erstellen beginnt dein Charakter auf Stufe 1 mit
                        0 Erfahrungspunkten.
                    </p>
                </div>
            </div>
        </div>
    );
}

type PreviewStatProps = {
    label: string;
    value: string;
};

function PreviewStat({
    label,
    value,
}: PreviewStatProps) {
    return (
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {label}
            </p>

            <p className="mt-1 truncate text-sm font-bold text-slate-200">
                {value}
            </p>
        </div>
    );
}

type PreviewTextProps = {
    title: string;
    value: string;
};

function PreviewText({
    title,
    value,
}: PreviewTextProps) {
    return (
        <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-violet-300">
                {title}
            </h3>

            <p className="mt-2 line-clamp-5 whitespace-pre-wrap text-sm leading-6 text-slate-400">
                {value}
            </p>
        </div>
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