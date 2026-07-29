"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MythoriaAlert } from "@/components/ui/MythoriaAlert";
import { MythoriaPageHeader } from "@/components/ui/MythoriaPageHeader";
import { MythoriaSpinner } from "@/components/ui/MythoriaSpinner";
type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  sort_order: number;
};
type Unlock = {
  achievement_id: string;
  character_id: string;
  unlocked_at: string;
  characters: { name: string } | null;
};
export default function AchievementsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlocks, setUnlocks] = useState<Unlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(async () => {
      const [{ data: a, error: ae }, { data: u, error: ue }] =
        await Promise.all([
          supabase
            .from("achievements")
            .select("id,title,description,icon,sort_order")
            .order("sort_order")
            .overrideTypes<Achievement[], { merge: false }>(),
          supabase
            .from("character_achievements")
            .select("achievement_id,character_id,unlocked_at,characters(name)")
            .order("unlocked_at", { ascending: false })
            .overrideTypes<Unlock[], { merge: false }>(),
        ]);
      if (ae || ue)
        setError(
          ae?.message ?? ue?.message ?? "Erfolge konnten nicht geladen werden.",
        );
      setAchievements(a ?? []);
      setUnlocks(u ?? []);
      setLoading(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [supabase]);
  if (loading)
    return (
      <main className="mythoria-page flex min-h-screen items-center justify-center">
        <MythoriaSpinner size="large" />
      </main>
    );
  return (
    <main className="mythoria-page mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <MythoriaPageHeader
        eyebrow="ERFOLGE"
        title="Spuren deiner Legenden"
        description="Erfolge werden automatisch aus echten Reisen und Entdeckungen deiner Charaktere vergeben."
      />
      {error && (
        <MythoriaAlert variant="error" className="mt-6">
          {error}
        </MythoriaAlert>
      )}
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {achievements.map((achievement) => {
          const earned = unlocks.filter(
            (unlock) => unlock.achievement_id === achievement.id,
          );
          return (
            <article
              key={achievement.id}
              className={`mythoria-card p-6 ${earned.length === 0 ? "opacity-55 grayscale" : "border-[var(--mythoria-border-gold)]"}`}
            >
              <span className="text-4xl text-[var(--mythoria-neon-soft)]">
                {achievement.icon}
              </span>
              <h2 className="mt-4 text-xl">{achievement.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--mythoria-text-muted)]">
                {achievement.description}
              </p>
              <div className="mt-5 space-y-1 text-xs">
                {earned.length === 0 ? (
                  <span className="text-[var(--mythoria-text-disabled)]">
                    Noch nicht freigeschaltet
                  </span>
                ) : (
                  earned.map((unlock) => (
                    <p
                      key={`${unlock.character_id}-${unlock.achievement_id}`}
                      className="text-[var(--mythoria-success)]"
                    >
                      ✓ {unlock.characters?.name ?? "Charakter"} ·{" "}
                      {new Date(unlock.unlocked_at).toLocaleDateString("de-DE")}
                    </p>
                  ))
                )}
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
