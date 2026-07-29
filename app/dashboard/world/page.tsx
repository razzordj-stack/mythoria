"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MythoriaAlert } from "@/components/ui/MythoriaAlert";
import { MythoriaEmptyState } from "@/components/ui/MythoriaEmptyState";
import { MythoriaPageHeader } from "@/components/ui/MythoriaPageHeader";
import { MythoriaSpinner } from "@/components/ui/MythoriaSpinner";
type Location = {
  id: string;
  slug: string;
  name: string;
  region: string;
  biome: string;
  summary: string;
  description: string;
  danger_level: number;
  recommended_level: number;
};
type Character = {
  id: string;
  name: string;
  level: number;
  current_location_id: string | null;
};
type Discovery = {
  character_id: string;
  location_id: string;
  discovered_at: string;
};
export default function WorldPage() {
  const supabase = useMemo(() => createClient(), []);
  const [locations, setLocations] = useState<Location[]>([]);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("all");
  const [selected, setSelected] = useState<Location | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [characterId, setCharacterId] = useState("");
  const [travelling, setTravelling] = useState(false);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const [
        { data, error: loadError },
        { data: characterRows },
        { data: discoveryRows },
      ] = await Promise.all([
        supabase
          .from("world_locations")
          .select(
            "id,slug,name,region,biome,summary,description,danger_level,recommended_level",
          )
          .eq("status", "published")
          .order("sort_order")
          .overrideTypes<Location[], { merge: false }>(),
        user
          ? supabase
              .from("characters")
              .select("id,name,level,current_location_id")
              .eq("user_id", user.id)
              .order("name")
              .overrideTypes<Character[], { merge: false }>()
          : Promise.resolve({ data: [] as Character[] }),
        user
          ? supabase
              .from("character_location_discoveries")
              .select("character_id,location_id,discovered_at")
              .eq("user_id", user.id)
              .overrideTypes<Discovery[], { merge: false }>()
          : Promise.resolve({ data: [] as Discovery[] }),
      ]);
      if (loadError) setError(loadError.message);
      else setLocations(data ?? []);
      setCharacters(characterRows ?? []);
      setDiscoveries(discoveryRows ?? []);
      if (characterRows?.[0]) setCharacterId(characterRows[0].id);
      setLoading(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [supabase]);
  const regions = useMemo(
    () => Array.from(new Set(locations.map((item) => item.region))),
    [locations],
  );
  const filtered = locations.filter(
    (item) =>
      (region === "all" || item.region === region) &&
      `${item.name} ${item.region} ${item.biome} ${item.summary}`
        .toLocaleLowerCase("de")
        .includes(query.trim().toLocaleLowerCase("de")),
  );
  async function travel(location: Location) {
    if (!characterId) return;
    setTravelling(true);
    setError("");
    setNotice("");
    const { error: travelError } = await supabase.rpc("travel_character", {
      p_character_id: characterId,
      p_location_id: location.id,
    });
    if (travelError) setError(travelError.message);
    else {
      setCharacters((rows) =>
        rows.map((character) =>
          character.id === characterId
            ? { ...character, current_location_id: location.id }
            : character,
        ),
      );
      setNotice(
        `${characters.find((character) => character.id === characterId)?.name ?? "Dein Charakter"} reist nun nach ${location.name}.`,
      );
      setDiscoveries((rows) =>
        rows.some(
          (item) =>
            item.character_id === characterId &&
            item.location_id === location.id,
        )
          ? rows
          : [
              ...rows,
              {
                character_id: characterId,
                location_id: location.id,
                discovered_at: new Date().toISOString(),
              },
            ],
      );
      setSelected(null);
    }
    setTravelling(false);
  }
  if (loading)
    return (
      <main className="mythoria-page flex min-h-screen items-center justify-center">
        <MythoriaSpinner size="large" />
      </main>
    );
  return (
    <main className="mythoria-page mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-10">
      <MythoriaPageHeader
        eyebrow="WELTLEXIKON"
        title="Die Reiche Mythorias"
        description="Erkunde bekannte Regionen, sichere Zufluchtsorte und gefährliche Gebiete der Welt."
      />
      <section className="mythoria-panel mt-7 grid gap-4 p-4 lg:grid-cols-[1fr_240px_260px]">
        <label className="text-sm font-bold text-[var(--mythoria-gold-light)]">
          Orte durchsuchen
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, Region oder Landschaft …"
            className="mythoria-input mt-2"
          />
        </label>
        <label className="text-sm font-bold text-[var(--mythoria-gold-light)]">
          Region
          <select
            value={region}
            onChange={(event) => setRegion(event.target.value)}
            className="mythoria-select mt-2"
          >
            <option value="all">Alle Regionen</option>
            {regions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-bold text-[var(--mythoria-gold-light)]">
          Reisender
          <select
            value={characterId}
            onChange={(event) => setCharacterId(event.target.value)}
            className="mythoria-select mt-2"
          >
            <option value="">Charakter wählen</option>
            {characters.map((character) => (
              <option key={character.id} value={character.id}>
                {character.name} · Stufe {character.level}
              </option>
            ))}
          </select>
        </label>
      </section>
      {error && (
        <MythoriaAlert variant="error" className="mt-5">
          {error}
        </MythoriaAlert>
      )}
      {notice && (
        <MythoriaAlert variant="success" className="mt-5">
          {notice}
        </MythoriaAlert>
      )}
      {filtered.length === 0 ? (
        <MythoriaEmptyState
          className="mt-6"
          icon="⌖"
          title="Kein Ort gefunden"
          description="Passe Suche oder Regionsfilter an."
        />
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((location) => (
            <button
              key={location.id}
              type="button"
              onClick={() => setSelected(location)}
              className="mythoria-card mythoria-card-interactive p-5 text-left"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold tracking-wide text-[var(--mythoria-green-bright)]">
                    {location.region}
                  </p>
                  <h2 className="mt-2 text-xl">{location.name}</h2>
                  {characterId &&
                    discoveries.some(
                      (item) =>
                        item.character_id === characterId &&
                        item.location_id === location.id,
                    ) && (
                      <span className="mt-2 inline-block text-xs font-bold text-[var(--mythoria-success)]">
                        ENTDECKT
                      </span>
                    )}
                </div>
                <Danger level={location.danger_level} />
              </div>
              <p className="mt-2 text-xs text-[var(--mythoria-text-muted)]">
                {location.biome} · empfohlen ab Stufe{" "}
                {location.recommended_level}
              </p>
              <p className="mt-4 text-sm leading-6 text-[var(--mythoria-text-secondary)]">
                {location.summary}
              </p>
            </button>
          ))}
        </div>
      )}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="location-title"
          onClick={() => setSelected(null)}
        >
          <article
            className="mythoria-panel max-w-2xl p-6 sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-xs font-bold tracking-[.16em] text-[var(--mythoria-green-bright)]">
                  {selected.region} · {selected.biome}
                </p>
                <h2 id="location-title" className="mythoria-heading mt-2">
                  {selected.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="mythoria-button-secondary"
                aria-label="Dialog schließen"
              >
                ×
              </button>
            </div>
            <p className="mt-5 leading-7 text-[var(--mythoria-text-secondary)]">
              {selected.description}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Danger level={selected.danger_level} />
              <span className="text-sm text-[var(--mythoria-text-muted)]">
                Empfohlene Stufe {selected.recommended_level}
              </span>
              <button
                type="button"
                disabled={
                  !characterId ||
                  travelling ||
                  characters.find((character) => character.id === characterId)
                    ?.current_location_id === selected.id
                }
                onClick={() => void travel(selected)}
                className="mythoria-button-primary"
              >
                {characters.find((character) => character.id === characterId)
                  ?.current_location_id === selected.id
                  ? "Aktueller Standort"
                  : travelling
                    ? "Reise wird vorbereitet …"
                    : "Hierher reisen"}
              </button>
            </div>
          </article>
        </div>
      )}
    </main>
  );
}
function Danger({ level }: { level: number }) {
  return (
    <span className="rounded-full border border-[var(--mythoria-health)]/35 px-3 py-1 text-xs font-bold text-[var(--mythoria-health)]">
      Gefahr {level}/5
    </span>
  );
}
