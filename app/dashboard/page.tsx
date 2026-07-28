"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                router.push("/login");
                return;
            }

            setUser(user);
            setLoading(false);
        };

        getUser();
    }, [router, supabase.auth]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-zinc-400 text-sm">Laden...</p>
                </div>
            </div>
        );
    }

    const displayName =
        user?.user_metadata?.full_name ||
        user?.user_metadata?.name ||
        user?.email?.split("@")[0] ||
        "Abenteurer";

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            {/* Hintergrund-Glow */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-600/5 rounded-full blur-[100px]" />
            </div>

            {/* Navigation */}
            <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto border-b border-zinc-800/60">
                <Link href="/" className="flex items-center gap-3 group">
                    <Image
                        src="/logo.png"
                        alt="Mythoria"
                        width={40}
                        height={40}
                        className="rounded-lg transition-transform duration-300 group-hover:scale-105"
                    />
                    <span className="text-xl font-semibold tracking-wide group-hover:text-emerald-300 transition-colors">
                        Mythoria
                    </span>
                </Link>

                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex flex-col items-end">
                        <span className="text-sm font-medium text-zinc-200">{displayName}</span>
                        <span className="text-xs text-zinc-500">{user?.email}</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 rounded-full border border-zinc-700 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition text-sm"
                    >
                        Ausloggen
                    </button>
                </div>
            </nav>

            {/* Hauptinhalt */}
            <main className="relative z-10 max-w-6xl mx-auto px-6 py-12">
                {/* Begrüßung */}
                <div className="mb-12">
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">
                        Willkommen zurück, <span className="text-emerald-400">{displayName}</span>
                    </h1>
                    <p className="text-zinc-400 text-lg">
                        Dein Abenteuer beginnt bald. Hier entsteht deine Heldengeschichte.
                    </p>
                </div>

                {/* Status-Karten */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    <StatusCard
                        title="Charakter"
                        status="Noch nicht erstellt"
                        description="Erstelle deinen ersten Helden"
                        icon="⚔️"
                    />
                    <StatusCard
                        title="Kampagne"
                        status="Keine aktive Kampagne"
                        description="Tritt einer Lobby bei oder erstelle eine"
                        icon="🗺️"
                    />
                    <StatusCard
                        title="Fortschritt"
                        status="Phase 1 abgeschlossen"
                        description="Als Nächstes: Charaktereditor"
                        icon="📜"
                    />
                </div>

                {/* Nächste Schritte */}
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-8">
                    <h2 className="text-xl font-semibold mb-4">Nächste Schritte</h2>
                    <div className="space-y-4">
                        <NextStepItem
                            number="1"
                            title="Charakter erstellen"
                            description="Rasse, Klasse, Aussehen und Hintergrund wählen"
                            soon
                        />
                        <NextStepItem
                            number="2"
                            title="Lobby beitreten"
                            description="Alleine oder mit Freunden spielen"
                            soon
                        />
                        <NextStepItem
                            number="3"
                            title="Erstes Abenteuer starten"
                            description="Die KI übernimmt die Rolle des Spielleiters"
                            soon
                        />
                    </div>
                </div>

                {/* Hinweis */}
                <div className="mt-10 text-center">
                    <p className="text-zinc-500 text-sm">
                        Mythoria befindet sich noch in der Entwicklung. Phase 2 (Charaktereditor) kommt als Nächstes.
                    </p>
                </div>
            </main>
        </div>
    );
}

/* ========== Hilfskomponenten ========== */

function StatusCard({
    title,
    status,
    description,
    icon,
}: {
    title: string;
    status: string;
    description: string;
    icon: string;
}) {
    return (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 hover:border-emerald-500/30 transition-all duration-300">
            <div className="text-2xl mb-3">{icon}</div>
            <h3 className="font-semibold text-lg mb-1">{title}</h3>
            <p className="text-emerald-400/80 text-sm mb-2">{status}</p>
            <p className="text-zinc-500 text-sm">{description}</p>
        </div>
    );
}

function NextStepItem({
    number,
    title,
    description,
    soon = false,
}: {
    number: string