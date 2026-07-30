import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type CharacterLocation = {
  name: string;
  region: string;
  biome: string;
  danger_level: number;
};

export default async function CharacterWorldLayout({
  children,
  params,
}: LayoutProps<"/dashboard/characters/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let location: CharacterLocation | null = null;

  if (user) {
    const { data: character } = await supabase
      .from("characters")
      .select("current_location_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (character?.current_location_id) {
      const { data } = await supabase
        .from("world_locations")
        .select("name,region,biome,danger_level")
        .eq("id", character.current_location_id)
        .maybeSingle()
        .overrideTypes<CharacterLocation | null, { merge: false }>();
      location = data;
    }
  }

  const danger = clampDanger(location?.danger_level ?? 0);
  return (
    <div className="mythoria-world-context" data-danger={danger}>
      <div className="mythoria-location-bar">
        <div className="min-w-0">
          <p className="mythoria-location-kicker">AKTUELLER SPIELORT</p>
          <p className="truncate text-sm font-bold text-[var(--mythoria-text)]">
            {location?.name ?? "Noch keinem Gebiet zugeordnet"}
          </p>
        </div>
        {location && (
          <div className="hidden min-w-0 text-right sm:block">
            <p className="truncate text-xs text-[var(--mythoria-text-muted)]">
              {location.region} · {location.biome}
            </p>
            <p className="mt-0.5 text-[10px] font-bold tracking-[.12em] text-[var(--danger-accent)]">
              GEFAHR {danger}/5 · {dangerLabel(danger)}
            </p>
          </div>
        )}
        <div className="mythoria-danger-meter" aria-label={`Gefahrenstufe ${danger} von 5`}>
          {Array.from({ length: 5 }, (_, index) => <span key={index} data-active={index < danger} />)}
        </div>
        <Link href="/dashboard/world" className="mythoria-location-link">Weltkarte</Link>
      </div>
      {children}
    </div>
  );
}

function clampDanger(value: number) {
  return Math.max(0, Math.min(5, Math.round(value)));
}

function dangerLabel(value: number) {
  if (value >= 5) return "Tödlich";
  if (value === 4) return "Extrem";
  if (value === 3) return "Hoch";
  if (value === 2) return "Erhöht";
  return "Gering";
}
