"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

const races = [
    {
        name: "Mensch",
        icon: "🧑",
        description: "Vielseitig, anpassungsfähig und ehrgeizig.",
    },
    {
        name: "Elf",
        icon: "🧝",
        description: "Anmutig, naturverbunden und magiebegabt.",
    },
    {
        name: "Zwerg",
        icon: "🪓",
        description: "Widerstandsfähig, traditionsbewusst und entschlossen.",
    },
    {
        name: "Ork",
        icon: "🟢",
        description: "Kraftvoll, furchtlos und kampferprobt.",
    },
    {
        name: "Tiefling",
        icon: "😈",
        description: "Mysteriös, charismatisch und dämonisch geprägt.",
    },
    {
        name: "Drachenblut",
        icon: "🐉",
        description: "Stolz, mächtig und mit uraltem Blut gesegnet.",
    },
];

const characterClasses = [
    {
        name: "Krieger",
        icon: "⚔️",
        description: "Meister von Waffen, Rüstung und direktem Kampf.",
    },
    {
        name: "Magier",
        icon: "🔮",
        description: "Beherrscht arkane Kräfte und mächtige Zauber.",
    },
    {
        name: "Waldläufer",
        icon: "🏹",
        description: "Spurenleser, Jäger und Beschützer der Wildnis.",
    },
    {
        name: "Schurke",
        icon: "🗡️",
        description: "Geschickt, leise und gefährlich aus dem Schatten.",
    },
    {
        name: "Paladin",
        icon: "🛡️",
        description: "Heiliger Kämpfer mit Schutz- und Heilkräften.",
    },
    {
        name: "Nekromant",
        icon: "💀",
        description: "Erforscht verbotene Magie und die Macht des Todes.",
    },
];

type FormErrors = {
    name?: string;
    race?: string;
    characterClass?: string;
};

export default function NewCharacterPage() {
    const [name, setName] = useState("");
    const [race, setRace] = useState("");
    const [characterClass, setCharacterClass] = useState("");
    const [background, setBackground] = useState("");
    const [appearance, setAppearance] = useState("");
    const [errors, setErrors] = useState<FormErrors>({});
    const [showSuccess, setShowSuccess] = useState(false);

    const completedFields = useMemo(() => {
        return [name, race, characterClass, background, appearance].filter(
            (value) => value.trim().length > 0,
        ).length;
    }, [name, race, characterClass, background, appearance]);

    const progress = completedFields * 20;

    function validateForm() {
        const nextErrors: FormErrors = {};

        if (name.trim().length < 2) {
            nextErrors.name = "Der Name muss mindestens 2 Zeichen enthalten.";
        }

        if (!race) {
            nextErrors.race = "Bitte wähle eine Rasse aus.";
        }

        if (!characterClass) {
            nextErrors.characterClass = "Bitte wähle eine Klasse aus.";
        }

        setErrors(nextErrors);

        return Object.keys(nextErrors).length === 0;
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setShowSuccess(false);

        if (!validateForm()) {
            window.scrollTo({
                top: 0,
                behavior: "smooth",
            });

            return;
        }

        setShowSuccess(true);

        console.log({
            name: name.trim(),
            race,
            class: characterClass,
            background: background.trim(),
            appearance: appearance.trim(),
            level: 1,
        });
    }

    return (
        <main className="relative min-h-screen overflow-hidden bg-[#030605] text-white">
            <BackgroundEffects />

            <EditorHeader />

            <div className="relative mx-auto max-w-7xl px-5 pb-24 pt-32 sm:px-8">
                <section className="border-b border-white/10 pb-8">
                    <Link
                        href="/dashboard/characters"
                        className="text-sm font-bold text-emerald-400 transition hover:text-emerald-300"
                    >
                        ← Zurück zur Charakterübersicht
                    </Link>

                    <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-sm font-black uppercase tracking-[0.25em] text-emerald-400">
                                Charaktereditor
                            </p>

                            <h1 className="mt-4 text-4xl font-black sm:text-6xl">
                                Erschaffe deinen Helden
                            </h1>

                            <p className="mt-4 max-w-2xl leading-7 text-gray-400">
                                Gib deinem Charakter einen Namen, wähle seine Herkunft und
                                entscheide, welchen Weg er in Mythoria beschreiten wird.
                            </p>
                        </div>

                        <div className="w-full max-w-sm">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Grunddaten</span>
                                <span className="font-black text-emerald-400">
                                    {progress} %
                                </span>
                            </div>

                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                                <div
                                    className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {showSuccess && (
                    <div className="mt-8 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-5 text-emerald-200">
                        <p className="font-black">Der Held ist bereit.</p>

                        <p className="mt-1 text-sm text-emerald-200/70">
                            Das Formular funktioniert. Im nächsten Schritt speichern wir
                            diese Daten in Supabase.
                        </p>
                    </div>
                )}

                <form
                    onSubmit={handleSubmit}
                    className="mt-10 grid items-start gap-8 lg:grid-cols-[1fr_360px]"
                >
                    <div className="space-y-8">
                        <FormSection
                            number="01"
                            title="Identität"
                            description="Jede Legende beginnt mit einem Namen."
                        >
                            <label className="block">
                                <span className="text-sm font-black">Charaktername *</span>

                                <input
                                    type="text"
                                    value={name}
                                    onChange={(event) => {
                                        setName(event.target.value);
                                        setErrors((current) => ({
                                            ...current,
                                            name: undefined,
                                        }));
                                    }}
                                    maxLength={40}
                                    placeholder="Zum Beispiel: Kael Schattenklinge"
                                    className={`mt-3 w-full rounded-xl border bg-black/40 px-5 py-4 outline-none transition ${errors.name
                                            ? "border-red-400/70"
                                            : "border-white/10 focus:border-emerald-400"
                                        }`}
                                />

                                <div className="mt-2 flex justify-between gap-4 text-sm">
                                    <span className="text-red-400">{errors.name}</span>
                                    <span className="ml-auto text-gray-600">
                                        {name.length}/40
                                    </span>
                                </div>
                            </label>
                        </FormSection>

                        <FormSection
                            number="02"
                            title="Rasse"
                            description="Deine Herkunft prägt deinen Platz in der Welt."
                        >
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {races.map((option) => (
                                    <SelectionCard
                                        key={option.name}
                                        selected={race === option.name}
                                        icon={option.icon}
                                        title={option.name}
                                        description={option.description}
                                        onClick={() => {
                                            setRace(option.name);
                                            setErrors((current) => ({
                                                ...current,
                                                race: undefined,
                                            }));
                                        }}
                                    />
                                ))}
                            </div>

                            {errors.race && (
                                <p className="mt-4 text-sm text-red-400">{errors.race}</p>
                            )}
                        </FormSection>

                        <FormSection
                            number="03"
                            title="Klasse"
                            description="Deine Klasse bestimmt deinen Weg und deinen Kampfstil."
                        >
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {characterClasses.map((option) => (
                                    <SelectionCard
                                        key={option.name}
                                        selected={characterClass === option.name}
                                        icon={option.icon}
                                        title={option.name}
                                        description={option.description}
                                        onClick={() => {
                                            setCharacterClass(option.name);
                                            setErrors((current) => ({
                                                ...current,
                                                characterClass: undefined,
                                            }));
                                        }}
                                    />
                                ))}
                            </div>

                            {errors.characterClass && (
                                <p className="mt-4 text-sm text-red-400">
                                    {errors.characterClass}
                                </p>
                            )}
                        </FormSection>

                        <FormSection
                            number="04"
                            title="Hintergrundgeschichte"
                            description="Welche Ereignisse haben deinen Helden geprägt?"
                        >
                            <label className="block">
                                <span className="sr-only">Hintergrundgeschichte</span>

                                <textarea
                                    value={background}
                                    onChange={(event) => setBackground(event.target.value)}
                                    maxLength={800}
                                    rows={7}
                                    placeholder="Woher stammt dein Charakter? Was treibt ihn an? Welche Geheimnisse trägt er mit sich?"
                                    className="w-full resize-y rounded-xl border border-white/10 bg-black/40 px-5 py-4 leading-7 outline-none transition focus:border-emerald-400"
                                />

                                <p className="mt-2 text-right text-sm text-gray-600">
                                    {background.length}/800
                                </p>
                            </label>
                        </FormSection>

                        <FormSection
                            number="05"
                            title="Aussehen"
                            description="Beschreibe die äußeren Merkmale deines Charakters."
                        >
                            <label className="block">
                                <span className="sr-only">Aussehen</span>

                                <textarea
                                    value={appearance}
                                    onChange={(event) => setAppearance(event.target.value)}
                                    maxLength={500}
                                    rows={5}
                                    placeholder="Haarfarbe, Augen, Kleidung, Narben, Tattoos oder besondere Merkmale …"
                                    className="w-full resize-y rounded-xl border border-white/10 bg-black/40 px-5 py-4 leading-7 outline-none transition focus:border-emerald-400"
                                />

                                <p className="mt-2 text-right text-sm text-gray-600">
                                    {appearance.length}/500
                                </p>
                            </label>
                        </FormSection>

                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                            <Link
                                href="/dashboard/characters"
                                className="rounded-xl border border-white/10 px-7 py-4 text-center font-bold text-gray-300 transition hover:border-white/30"
                            >
                                Abbrechen
                            </Link>

                            <button
                                type="submit"
                                className="rounded-xl bg-emerald-400 px-8 py-4 font-black text-black transition hover:-translate-y-1 hover:bg-emerald-300"
                            >
                                Charakter vorbereiten
                            </button>
                        </div>
                    </div>

                    <CharacterPreview
                        name={name}
                        race={race}
                        characterClass={characterClass}
                        background={background}
                    />
                </form>
            </div>
        </main>
    );
}

function EditorHeader() {
    return (
        <header className="fixed left-0 top-0 z-50 w-full border-b border-white/10 bg-black/75 backdrop-blur-2xl">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
                <Link href="/" className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-400/10">
                        🎲
                    </div>

                    <div>
                        <p className="font-black tracking-[0.22em] text-emerald-400">
                            MYTHORIA
                        </p>

                        <p className="text-[10px] uppercase tracking-[0.25em] text-gray-500">
                            Character forge
                        </p>
                    </div>
                </Link>

                <Link
                    href="/dashboard"
                    className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-gray-300 transition hover:border-emerald-400/40"
                >
                    Dashboard
                </Link>
            </div>
        </header>
    );
}

function FormSection({
    number,
    title,
    description,
    children,
}: {
    number: string;
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
            <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-400 font-black text-black">
                    {number}
                </div>

                <div>
                    <h2 className="text-2xl font-black">{title}</h2>
                    <p className="mt-1 text-gray-500">{description}</p>
                </div>
            </div>

            <div className="mt-7">{children}</div>
        </section>
    );
}

function SelectionCard({
    selected,
    icon,
    title,
    description,
    onClick,
}: {
    selected: boolean;
    icon: string;
    title: string;
    description: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={selected}
            className={`rounded-2xl border p-5 text-left transition ${selected
                    ? "border-emerald-400 bg-emerald-400/10"
                    : "border-white/10 bg-black/20 hover:border-emerald-400/40"
                }`}
        >
            <span className="text-3xl">{icon}</span>

            <span className="mt-4 block font-black">{title}</span>

            <span className="mt-2 block text-sm leading-6 text-gray-500">
                {description}
            </span>

            <span
                className={`mt-4 block text-xs font-bold uppercase tracking-wider ${selected ? "text-emerald-400" : "text-gray-700"
                    }`}
            >
                {selected ? "Ausgewählt" : "Auswählen"}
            </span>
        </button>
    );
}

function CharacterPreview({
    name,
    race,
    characterClass,
    background,
}: {
    name: string;
    race: string;
    characterClass: string;
    background: string;
}) {
    return (
        <aside className="top-28 lg:sticky">
            <div className="overflow-hidden rounded-3xl border border-emerald-400/20 bg-black/60">
                <div className="flex h-64 items-center justify-center bg-gradient-to-br from-emerald-950 via-black to-black text-8xl">
                    {characterClass === "Magier"
                        ? "🔮"
                        : characterClass === "Waldläufer"
                            ? "🏹"
                            : characterClass === "Schurke"
                                ? "🗡️"
                                : characterClass === "Paladin"
                                    ? "🛡️"
                                    : characterClass === "Nekromant"
                                        ? "💀"
                                        : "⚔️"}
                </div>

                <div className="p-6">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400">
                        Charaktervorschau
                    </p>

                    <h2 className="mt-3 break-words text-2xl font-black">
                        {name.trim() || "Unbenannter Held"}
                    </h2>

                    <p className="mt-2 text-gray-400">
                        {race || "Keine Rasse"} · {characterClass || "Keine Klasse"}
                    </p>

                    <div className="mt-5 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-4">
                        <span className="text-sm text-gray-500">Startlevel</span>
                        <span className="font-black text-emerald-400">Level 1</span>
                    </div>

                    <p className="mt-5 line-clamp-6 leading-7 text-gray-500">
                        {background.trim() ||
                            "Die Geschichte dieses Helden wurde noch nicht geschrieben."}
                    </p>
                </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                <p className="font-black">Pflichtangaben</p>

                <div className="mt-4 space-y-3 text-sm">
                    <Requirement completed={name.trim().length >= 2} label="Name" />
                    <Requirement completed={Boolean(race)} label="Rasse" />
                    <Requirement
                        completed={Boolean(characterClass)}
                        label="Klasse"
                    />
                </div>
            </div>
        </aside>
    );
}

function Requirement({
    completed,
    label,
}: {
    completed: boolean;
    label: string;
}) {
    return (
        <div className="flex items-center justify-between">
            <span className={completed ? "text-gray-300" : "text-gray-600"}>
                {label}
            </span>

            <span
                className={
                    completed
                        ? "font-black text-emerald-400"
                        : "font-black text-gray-700"
                }
            >
                {completed ? "✓" : "○"}
            </span>
        </div>
    );
}

function BackgroundEffects() {
    return (
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
            <div className="absolute left-1/2 top-[-300px] h-[750px] w-[750px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[170px]" />

            <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:80px_80px]" />

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#030605_82%)]" />
        </div>
    );
}