"use client";

import Image from "next/image";
import { useState } from "react";
import { createClient } from "@/lib/supabase";

export default function Home() {
    return (
        <div className="min-h-screen bg-[#050505] text-white">
            {/* Navigation */}
            <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
                <div className="flex items-center gap-3 group cursor-pointer">
                    <Image
                        src="/logo.png"
                        alt="Mythoria Logo"
                        width={48}
                        height={48}
                        className="rounded-lg transition-transform duration-300 group-hover:scale-105"
                    />
                    <span className="text-xl font-semibold tracking-wide text-zinc-100 group-hover:text-emerald-300 transition-colors duration-300">
                        Mythoria
                    </span>
                </div>
                <a
                    href="/login"
                    className="px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 text-sm font-medium"
                >
                    Anmelden
                </a>
            </nav>

            {/* Hero Section */}
            <section className="max-w-4xl mx-auto px-6 pt-16 pb-24 text-center">
                <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight">
                    Die KI erzählt die Geschichte.
                    <br />
                    <span className="text-emerald-400">Das Regelsystem entscheidet das Spiel.</span>
                </h1>

                <p className="mt-6 text-lg text-zinc-400 max-w-2xl mx-auto">
                    Mythoria ist die browserbasierte Multiplayer-Pen-and-Paper-Plattform,
                    bei der eine KI den Spielleiter übernimmt – fair, dynamisch und unvergesslich.
                </p>

                <div className="mt-10" id="waitlist">
                    <WaitlistForm />
                </div>
            </section>

            {/* Features */}
            <section className="max-w-6xl mx-auto px-6 py-20">
                <h2 className="text-3xl font-bold text-center mb-14">Was Mythoria besonders macht</h2>

                <div className="grid md:grid-cols-3 gap-8">
                    <FeatureCard
                        title="KI als Spielleiter"
                        description="Die KI erzählt, beschreibt Orte, spielt alle NPCs und reagiert auf jede Entscheidung – mit Langzeitgedächtnis."
                    />
                    <FeatureCard
                        title="Faire Regel-Engine"
                        description="Würfel, Schaden, Initiative, Inventar und Level werden vom Backend berechnet. Die KI schummelt nie."
                    />
                    <FeatureCard
                        title="Lebendige Welt"
                        description="Kriege entstehen, Städte wachsen, Königreiche fallen. Die Welt verändert sich dauerhaft durch eure Taten."
                    />
                </div>
            </section>

            {/* Wie es funktioniert */}
            <section className="max-w-6xl mx-auto px-6 py-20 border-t border-zinc-800/50">
                <h2 className="text-3xl font-bold text-center mb-4">Wie es funktioniert</h2>
                <p className="text-zinc-400 text-center max-w-2xl mx-auto mb-14">
                    In vier einfachen Schritten von der Idee zum lebendigen Abenteuer.
                </p>

                <div className="grid md:grid-cols-4 gap-6">
                    <StepCard number="01" title="Charakter erstellen" description="Wähle Rasse, Klasse, Aussehen und Hintergrund. Dein Held gehört nur dir." />
                    <StepCard number="02" title="Lobby beitreten" description="Erstelle eine Runde oder tritt Freunden bei. Spiele solo oder im Multiplayer." />
                    <StepCard number="03" title="KI führt dich" description="Die KI erzählt die Geschichte, spielt NPCs und reagiert auf jede deiner Entscheidungen." />
                    <StepCard number="04" title="Welt verändert sich" description="Deine Taten haben Konsequenzen – auch noch 50 Stunden später." />
                </div>
            </section>

            {/* Roadmap */}
            <section className="max-w-6xl mx-auto px-6 py-20 border-t border-zinc-800/50">
                <h2 className="text-3xl font-bold text-center mb-4">Roadmap</h2>
                <p className="text-zinc-400 text-center max-w-2xl mx-auto mb-14">
                    Der Weg zu Mythoria – klar, transparent und Schritt für Schritt.
                </p>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <RoadmapCard number="01" status="📋" title="Planung" description="Konzept und Design" active />
                    <RoadmapCard number="02" status="🚧" title="Grundgerüst" description="Login, Profile, Datenbank" />
                    <RoadmapCard number="03" status="🚧" title="Charaktersystem" description="Spielfiguren erstellen" />
                    <RoadmapCard number="04" status="🚧" title="Multiplayer" description="Gemeinsame Lobbys" />
                    <RoadmapCard number="05" status="⭐" title="KI-Spielleiter" description="Erste spielbare Abenteuer" />
                    <RoadmapCard number="06" status="⭐" title="Regelserver" description="Verlässliche Spielmechanik" />
                    <RoadmapCard number="07" status="⚔️" title="Kämpfe" description="Taktische Begegnungen" />
                    <RoadmapCard number="08" status="🌍" title="Weltgenerator" description="Dynamische Welten" />
                    <RoadmapCard number="09" status="🎨" title="KI-Bilder" description="Szenen und Charaktere" />
                    <RoadmapCard number="10" status="🚀" title="Veröffentlichung" description="App- und Web-Release" />
                </div>
            </section>

            {/* Community */}
            <section className="max-w-6xl mx-auto px-6 py-20 border-t border-zinc-800/50">
                <div className="relative bg-gradient-to-br from-emerald-950/30 to-zinc-900/40 border border-emerald-500/20 rounded-3xl p-10 md:p-14 text-center overflow-hidden group hover:border-emerald-500/40 transition-all duration-500">
                    <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold mb-4">Von der Community, für die Community</h2>
                        <p className="text-zinc-300 max-w-2xl mx-auto mb-8 text-lg">
                            Erstelle eigene Welten, Monster, NPCs, Quests, Gegenstände und Zauber.
                            Teile sie mit anderen Spielern und erlebe Abenteuer, die niemand zuvor gespielt hat.
                        </p>
                        <div className="flex flex-wrap justify-center gap-3 text-sm text-zinc-400">
                            {["Eigene Welten", "Monster & NPCs", "Quests", "Gegenstände", "Zauber"].map((tag) => (
                                <span
                                    key={tag}
                                    className="px-4 py-1.5 rounded-full bg-zinc-800/80 hover:bg-emerald-600/20 hover:text-emerald-300 transition-all duration-300 cursor-default"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Final Call to Action */}
            <section className="max-w-3xl mx-auto px-6 py-24 text-center">
                <h2 className="text-3xl font-bold mb-4">Bereit für dein nächstes Abenteuer?</h2>
                <p className="text-zinc-400 mb-8">Sei einer der Ersten, die Mythoria spielen.</p>
                <WaitlistForm />
            </section>

            {/* Footer */}
            <footer className="border-t border-zinc-800/50 py-8 text-center text-zinc-500 text-sm">
                © 2026 Mythoria. Alle Rechte vorbehalten.
            </footer>
        </div>
    );
}

/* ========== Wartelisten-Formular ========== */

function WaitlistForm() {
    const supabase = createClient();
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus("loading");
        setErrorMessage("");

        const { error } = await supabase.from("waitlist").insert([{ email: email.toLowerCase() }]);

        if (error) {
            console.error(error);
            if (error.code === "23505") {
                setErrorMessage("Diese E-Mail ist bereits auf der Liste.");
            } else {
                setErrorMessage("Etwas ist schiefgelaufen. Bitte versuche es erneut.");
            }
            setStatus("error");
            return;
        }

        setStatus("success");
        setEmail("");
    };

    if (status === "success") {
        return (
            <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                <span className="text-xl">✓</span>
                <span className="font-medium">Danke! Du stehst auf der Warteliste.</span>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <input
                    type="email"
                    required
                    placeholder="deine@email.de"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 px-5 py-3.5 rounded-full bg-zinc-900 border border-zinc-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all duration-300 text-white placeholder:text-zinc-500"
                />
                <button
                    type="submit"
                    disabled={status === "loading"}
                    className="px-8 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-300 font-medium whitespace-nowrap"
                >
                    {status === "loading" ? "Wird eingetragen..." : "Auf die Warteliste"}
                </button>
            </form>

            {status === "error" && (
                <p className="mt-3 text-sm text-red-400 text-center">{errorMessage}</p>
            )}
        </div>
    );
}

/* ========== Hilfskomponenten ========== */

function FeatureCard({ title, description }: { title: string; description: string }) {
    return (
        <div className="group bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 hover:border-emerald-500/40 hover:-translate-y-2 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300">
            <h3 className="text-xl font-semibold mb-3 group-hover:text-emerald-300 transition-colors duration-300">
                {title}
            </h3>
            <p className="text-zinc-400 leading-relaxed">{description}</p>
        </div>
    );
}

function StepCard({
    number,
    title,
    description,
}: {
    number: string;
    title: string;
    description: string;
}) {
    return (
        <div className="group p-2 rounded-xl hover:bg-zinc-900/30 transition-all duration-300">
            <div className="text-4xl font-bold text-emerald-500/25 mb-3 group-hover:text-emerald-400/60 transition-colors duration-300">
                {number}
            </div>
            <h3 className="text-lg font-semibold mb-2 group-hover:text-emerald-200 transition-colors duration-300">
                {title}
            </h3>
            <p className="text-zinc-400 text-sm leading-relaxed">{description}</p>
        </div>
    );
}

function RoadmapCard({
    number,
    status,
    title,
    description,
    active = false,
}: {
    number: string;
    status: string;
    title: string;
    description: string;
    active?: boolean;
}) {
    return (
        <div
            className={`rounded-2xl p-5 border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${active
                    ? "bg-emerald-950/30 border-emerald-500/50 hover:border-emerald-400/70 hover:shadow-emerald-500/15"
                    : "bg-zinc-900/30 border-zinc-800 hover:border-zinc-600"
                }`}
        >
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-emerald-500/80 tracking-wider">
                    MEILENSTEIN {number}
                </span>
                <span className="text-lg">{status}</span>
            </div>
            <h3 className="font-semibold text-lg mb-1">{title}</h3>
            <p className="text-sm text-zinc-400">{description}</p>
        </div>
    );
}