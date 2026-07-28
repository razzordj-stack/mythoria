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
            const { data: { user } } = await supabase.auth.getUser();
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
                <p className="text-zinc-400">Laden...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto border-b border-zinc-800">
                <Link href="/" className="flex items-center gap-3">
                    <Image src="/logo.png" alt="Mythoria" width={40} height={40} className="rounded-lg" />
                    <span className="text-xl font-semibold">Mythoria</span>
                </Link>

                <div className="flex items-center gap-4">
                    <span className="text-sm text-zinc-400 hidden sm:block">{user?.email}</span>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 rounded-full border border-zinc-700 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition text-sm"
                    >
                        Ausloggen
                    </button>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-6 py-16 text-center">
                <h1 className="text-3xl font-bold mb-4">Willkommen bei Mythoria</h1>
                <p className="text-zinc-400 mb-8">
                    Dein Konto ist bereit. Hier entsteht bald dein Abenteuer.
                </p>

                <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-8">
                    <p className="text-zinc-300">
                        Phase 1 ist fast abgeschlossen. Als Nächstes kommt der Charaktereditor und das Lobby-System.
                    </p>
                </div>
            </main>
        </div>
    );
}