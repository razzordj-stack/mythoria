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

export function CharacterFeaturePlaceholder({
    eyebrow,
    title,
    description,
    icon,
}: {
    eyebrow: string;
    title: string;
    description: string;
    icon: string;
}) {
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
    const [isLoading, setIsLoading] = useState(true);
    const [isNotFound, setIsNotFound] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(
        null,
    );

    const loadCharacter = useCallback(async () => {
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
                    "Du bist nicht angemeldet. Melde dich an, um diese Seite zu öffnen.",
                );
                return;
            }

            const { data, error } = await supabase
                .from("characters")
                .select("id,user_id,name,race,character_class")
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

    if (isLoading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#020403] px-4">
                <div className="h-96 w-full max-w-3xl animate-pulse rounded-3xl bg-[var(--mythoria-surface-light)]/80" />
            </main>
        );
    }

    if (errorMessage || isNotFound || !character) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#020403] px-4 text-white">
                <section className="max-w-xl rounded-3xl border border-[var(--mythoria-border)] bg-[var(--mythoria-surface)]/90 p-8 text-center">
                    <span className="text-5xl">🔍</span>
                    <h1 className="mt-5 text-3xl font-black">
                        {isNotFound
                            ? "Charakter nicht gefunden"
                            : "Seite konnte nicht geladen werden"}
                    </h1>
                    <p className="mt-4 leading-7 text-[var(--mythoria-text-muted)]">
                        {errorMessage ??
                            "Dieser Charakter existiert nicht oder gehört einem anderen Benutzer."}
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

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020403] px-4 py-10 text-white">
            <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-green-800/20 blur-[120px]" />
            <div className="pointer-events-none absolute -right-40 bottom-0 h-[30rem] w-[30rem] rounded-full bg-amber-800/10 blur-[140px]" />

            <section className="relative w-full max-w-3xl rounded-[2rem] border border-lime-400/20 bg-[var(--mythoria-surface)]/90 p-7 text-center shadow-2xl shadow-green-950/30 backdrop-blur-xl sm:p-12">
                <CharacterAvatar
                    name={character.name}
                    portraitKey={character.character_class || character.race}
                    size="xl"
                    className="mx-auto"
                />

                <p className="mt-7 text-xs font-black uppercase tracking-[0.3em] text-lime-200">
                    {eyebrow}
                </p>
                <h1 className="mt-4 text-3xl font-black sm:text-5xl">
                    {title}
                </h1>
                <p className="mt-3 text-lg font-bold text-amber-100">
                    Für {character.name}
                </p>
                <p className="mx-auto mt-5 max-w-xl leading-7 text-[var(--mythoria-text-muted)]">
                    {description}
                </p>

                <div className="mt-8 rounded-2xl border border-amber-400/20 bg-amber-500/[0.06] p-5">
                    <span className="text-4xl">{icon}</span>
                    <p className="mt-3 text-sm font-bold text-amber-200">
                        Dieses Kapitel von Mythoria wird bald geöffnet.
                    </p>
                </div>

                <Link
                    href={"/dashboard/characters/" + character.id}
                    className="mt-8 inline-flex rounded-xl bg-gradient-to-r from-green-700 to-amber-700 px-7 py-3 font-black transition hover:brightness-110"
                >
                    Zurück zum Charakter
                </Link>
            </section>
        </main>
    );
}
