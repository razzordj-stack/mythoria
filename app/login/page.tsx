"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const router = useRouter();
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        if (isLogin) {
            // Einloggen
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setMessage(error.message);
                setLoading(false);
                return;
            }

            router.push("/dashboard");
        } else {
            // Registrieren
            const { error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) {
                setMessage(error.message);
                setLoading(false);
                return;
            }

            setMessage("Konto erstellt! Du kannst dich jetzt einloggen.");
            setIsLogin(true);
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <Link href="/" className="flex items-center gap-3">
                        <Image src="/logo.png" alt="Mythoria" width={48} height={48} className="rounded-lg" />
                        <span className="text-2xl font-semibold">Mythoria</span>
                    </Link>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8">
                    <h1 className="text-2xl font-bold text-center mb-2">
                        {isLogin ? "Willkommen zurück" : "Konto erstellen"}
                    </h1>
                    <p className="text-zinc-400 text-center text-sm mb-8">
                        {isLogin
                            ? "Melde dich an, um fortzufahren"
                            : "Erstelle dein Mythoria-Konto"}
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1.5">E-Mail</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition"
                                placeholder="deine@email.de"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-zinc-400 mb-1.5">Passwort</label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition"
                                placeholder="Mindestens 6 Zeichen"
                            />
                        </div>

                        {message && (
                            <p className={`text-sm text-center ${message.includes("erstellt") ? "text-emerald-400" : "text-red-400"}`}>
                                {message}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 transition font-medium"
                        >
                            {loading ? "Bitte warten..." : isLogin ? "Einloggen" : "Registrieren"}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-zinc-400">
                        {isLogin ? (
                            <>
                                Noch kein Konto?{" "}
                                <button
                                    onClick={() => {
                                        setIsLogin(false);
                                        setMessage("");
                                    }}
                                    className="text-emerald-400 hover:underline"
                                >
                                    Registrieren
                                </button>
                            </>
                        ) : (
                            <>
                                Bereits ein Konto?{" "}
                                <button
                                    onClick={() => {
                                        setIsLogin(true);
                                        setMessage("");
                                    }}
                                    className="text-emerald-400 hover:underline"
                                >
                                    Einloggen
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}