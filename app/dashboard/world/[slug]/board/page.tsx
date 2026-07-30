"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MythoriaAlert } from "@/components/ui/MythoriaAlert";
import { MythoriaEmptyState } from "@/components/ui/MythoriaEmptyState";
import { MythoriaPageHeader } from "@/components/ui/MythoriaPageHeader";
import { MythoriaSpinner } from "@/components/ui/MythoriaSpinner";

type TacticalMap = {
  id: string;
  name: string;
  image_path: string;
  grid_columns: number;
  grid_rows: number;
  location_id: string;
  map_type: string;
};
type Character = { id: string; name: string; level: number };
type MapToken = {
  id: string;
  map_id: string;
  character_id: string | null;
  user_id: string | null;
  label: string;
  x: number;
  y: number;
  color: string;
  entity_type: string;
  vision_range: number;
  movement_range: number;
  is_hidden: boolean;
  updated_at: string;
};
type FogCell = { x: number; y: number };
type MapObject = {
  id: string;
  object_type: string;
  label: string;
  x: number;
  y: number;
  is_hidden: boolean;
};
type DiceRoll = {
  id: string;
  roller_name: string;
  die: number;
  raw_value: number;
  modifier: number;
  total: number;
  created_at: string;
};
type ToolMode =
  "move" | "measure" | "reveal" | "enemy" | "npc" | "door" | "trap" | "chest";

export default function TacticalBoardPage() {
  const { slug } = useParams<{ slug: string }>();
  const supabase = useMemo(() => createClient(), []);
  const [map, setMap] = useState<TacticalMap | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [tokens, setTokens] = useState<MapToken[]>([]);
  const [fog, setFog] = useState<FogCell[]>([]);
  const [objects, setObjects] = useState<MapObject[]>([]);
  const [rolls, setRolls] = useState<DiceRoll[]>([]);
  const [isGameMaster, setIsGameMaster] = useState(false);
  const [mode, setMode] = useState<ToolMode>("move");
  const [measurement, setMeasurement] = useState("");
  const [modifier, setModifier] = useState(0);
  const [userId, setUserId] = useState("");
  const [characterId, setCharacterId] = useState("");
  const [selectedToken, setSelectedToken] = useState("");
  const [zoom, setZoom] = useState(100);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadBoard = useCallback(
    async (mapId: string) => {
      const [tokenResult, fogResult, objectResult, rollResult, gmResult] =
        await Promise.all([
          supabase
            .from("tactical_map_tokens")
            .select(
              "id,map_id,character_id,user_id,label,x,y,color,entity_type,vision_range,movement_range,is_hidden,updated_at",
            )
            .eq("map_id", mapId)
            .overrideTypes<MapToken[], { merge: false }>(),
          supabase
            .from("tactical_fog_cells")
            .select("x,y")
            .eq("map_id", mapId)
            .overrideTypes<FogCell[], { merge: false }>(),
          supabase
            .from("tactical_map_objects")
            .select("id,object_type,label,x,y,is_hidden")
            .eq("map_id", mapId)
            .overrideTypes<MapObject[], { merge: false }>(),
          supabase
            .from("tactical_dice_rolls")
            .select("id,roller_name,die,raw_value,modifier,total,created_at")
            .eq("map_id", mapId)
            .order("created_at", { ascending: false })
            .limit(12)
            .overrideTypes<DiceRoll[], { merge: false }>(),
          supabase.rpc("is_tactical_game_master", { p_map: mapId }),
        ]);
      if (tokenResult.error) setError(tokenResult.error.message);
      else setTokens(tokenResult.data ?? []);
      setFog(fogResult.data ?? []);
      setObjects(objectResult.data ?? []);
      setRolls(rollResult.data ?? []);
      setIsGameMaster(Boolean(gmResult.data));
    },
    [supabase],
  );

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Du bist nicht angemeldet.");
        setLoading(false);
        return;
      }
      setUserId(user.id);
      const { data: location, error: locationError } = await supabase
        .from("world_locations")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (locationError || !location) {
        setError(locationError?.message ?? "Ort nicht gefunden.");
        setLoading(false);
        return;
      }
      const [{ data: mapRow, error: mapError }, { data: characterRows }] =
        await Promise.all([
          supabase
            .from("tactical_maps")
            .select(
              "id,name,image_path,grid_columns,grid_rows,location_id,map_type",
            )
            .eq("location_id", location.id)
            .order("map_type")
            .limit(1)
            .maybeSingle()
            .overrideTypes<TacticalMap | null, { merge: false }>(),
          supabase
            .from("characters")
            .select("id,name,level")
            .eq("user_id", user.id)
            .eq("current_location_id", location.id)
            .order("name")
            .overrideTypes<Character[], { merge: false }>(),
        ]);
      if (mapError || !mapRow) {
        setError(
          mapError?.message ?? "Für diesen Ort existiert noch kein Spielbrett.",
        );
        setLoading(false);
        return;
      }
      setMap(mapRow);
      setCharacters(characterRows ?? []);
      if (characterRows?.[0]) setCharacterId(characterRows[0].id);
      await loadBoard(mapRow.id);
      setLoading(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadBoard, slug, supabase]);

  useEffect(() => {
    if (!map) return;
    const refresh = () => void loadBoard(map.id);
    const channel = supabase
      .channel(`tactical-map-${map.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tactical_map_tokens",
          filter: `map_id=eq.${map.id}`,
        },
        refresh,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tactical_fog_cells",
          filter: `map_id=eq.${map.id}`,
        },
        refresh,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tactical_map_objects",
          filter: `map_id=eq.${map.id}`,
        },
        refresh,
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tactical_dice_rolls",
          filter: `map_id=eq.${map.id}`,
        },
        refresh,
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadBoard, map, supabase]);

  async function enterBoard() {
    if (!map || !characterId) return;
    setBusy(true);
    setError("");
    const { data, error: joinError } = await supabase.rpc("join_tactical_map", {
      p_map_id: map.id,
      p_character_id: characterId,
    });
    if (joinError) setError(joinError.message);
    else {
      setSelectedToken(String(data));
      await loadBoard(map.id);
    }
    setBusy(false);
  }

  async function handleCell(x: number, y: number) {
    if (!map || busy) return;
    if (mode === "reveal" && isGameMaster) {
      await supabase.rpc("reveal_tactical_cell", {
        p_map_id: map.id,
        p_x: x,
        p_y: y,
      });
      await loadBoard(map.id);
      return;
    }
    if ((mode === "enemy" || mode === "npc") && isGameMaster) {
      await supabase.rpc("spawn_tactical_entity", {
        p_map_id: map.id,
        p_type: mode,
        p_label: mode === "enemy" ? "Unbekannter Gegner" : "Unbekannter NSC",
        p_x: x,
        p_y: y,
      });
      await loadBoard(map.id);
      return;
    }
    if (["door", "trap", "chest"].includes(mode) && isGameMaster) {
      await supabase.rpc("place_tactical_object", {
        p_map_id: map.id,
        p_type: mode,
        p_label: mode === "door" ? "Tür" : mode === "trap" ? "Falle" : "Truhe",
        p_x: x,
        p_y: y,
        p_hidden: mode === "trap",
      });
      await loadBoard(map.id);
      return;
    }
    if (!selectedToken) return;
    const token = tokens.find((item) => item.id === selectedToken);
    if (!token || (!isGameMaster && token.user_id !== userId)) return;
    const distance = Math.max(Math.abs(x - token.x), Math.abs(y - token.y));
    if (mode === "measure") {
      setMeasurement(`${distance} Felder · ca. ${distance * 1.5} m`);
      return;
    }
    setTokens((rows) =>
      rows.map((item) => (item.id === token.id ? { ...item, x, y } : item)),
    );
    const { error: moveError } = await supabase.rpc("move_tactical_token", {
      p_token_id: token.id,
      p_x: x,
      p_y: y,
    });
    if (moveError) {
      setError(moveError.message);
      await loadBoard(map.id);
    }
  }

  async function rollDie(die: number) {
    if (!map) return;
    const { error: rollError } = await supabase.rpc("roll_tactical_die", {
      p_map_id: map.id,
      p_die: die,
      p_modifier: modifier,
    });
    if (rollError) setError(rollError.message);
    else await loadBoard(map.id);
  }

  if (loading)
    return (
      <main className="mythoria-page flex min-h-screen items-center justify-center">
        <MythoriaSpinner size="large" />
      </main>
    );
  if (!map)
    return (
      <main className="mythoria-page mx-auto max-w-4xl px-4 py-10">
        <MythoriaEmptyState
          icon="⌖"
          title="Spielbrett nicht verfügbar"
          description={
            error || "Für dieses Gebiet wurde noch keine Karte erstellt."
          }
          action={
            <Link href="/dashboard/world" className="mythoria-button-secondary">
              Zur Weltkarte
            </Link>
          }
        />
      </main>
    );

  return (
    <main className="mythoria-page mx-auto max-w-[1600px] px-4 py-5 sm:px-6">
      <MythoriaPageHeader
        eyebrow="LIVE-SPIELBRETT"
        title={map.name}
        description="Bewege deine Figur auf dem Raster. Gruppenpositionen werden für alle Mitglieder live synchronisiert."
        actions={
          <Link href="/dashboard/world" className="mythoria-button-secondary">
            Weltkarte
          </Link>
        }
      />
      {error && (
        <MythoriaAlert variant="error" className="mt-4">
          {error}
        </MythoriaAlert>
      )}
      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <section className="mythoria-panel overflow-hidden p-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
            <div>
              <p className="text-xs text-[var(--mythoria-text-muted)]">
                Werkzeug wählen und ein Feld anklicken · {map.map_type}
              </p>
              {measurement && (
                <p className="text-xs font-bold text-[var(--mythoria-neon-soft)]">
                  Messung: {measurement}
                </p>
              )}
            </div>
            <label className="flex items-center gap-2 text-xs text-[var(--mythoria-gold-light)]">
              Zoom
              <input
                type="range"
                min="75"
                max="180"
                step="5"
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
              />
              <span className="w-10 text-right">{zoom}%</span>
            </label>
          </div>
          <div className="max-h-[72vh] overflow-auto rounded-xl border border-[var(--mythoria-border)] bg-black">
          <div
            className="relative aspect-square"
              style={{ width: `${zoom}%`, minWidth: "720px" }}
            >
              <button
              type="button"
              tabIndex={-1}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 block h-full w-full bg-cover bg-center"
                style={{
                  backgroundImage: `linear-gradient(rgba(229,223,189,.18) 1px,transparent 1px),linear-gradient(90deg,rgba(229,223,189,.18) 1px,transparent 1px),url(${map.image_path})`,
                  backgroundSize: `${100 / map.grid_columns}% ${100 / map.grid_rows}%,${100 / map.grid_columns}% ${100 / map.grid_rows}%,cover`,
                }}
              />
              <div
                className="absolute inset-0 z-[5] grid"
                style={{
                  gridTemplateColumns: `repeat(${map.grid_columns},1fr)`,
                  gridTemplateRows: `repeat(${map.grid_rows},1fr)`,
                }}
              >
                {Array.from(
                  { length: map.grid_columns * map.grid_rows },
                  (_, index) => {
                    const x = index % map.grid_columns,
                      y = Math.floor(index / map.grid_columns);
                  return (
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label={`Feld ${x + 1}/${y + 1}`}
                      onClick={() => void handleCell(x, y)}
                      key={index}
                      className={
                        cellVisible(x, y, fog, tokens, userId)
                          ? "bg-transparent"
                          : "bg-black/85 hover:bg-black/70"
                      }
                    />
                    );
                  },
                )}
              </div>
              {objects
                .filter((item) => isGameMaster || !item.is_hidden)
                .map((item) => (
                  <span
                    key={item.id}
                    title={item.label}
                    className="pointer-events-none absolute z-[8] flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-md border border-amber-300/70 bg-black/80 text-sm"
                    style={{
                      left: `${((item.x + 0.5) / map.grid_columns) * 100}%`,
                      top: `${((item.y + 0.5) / map.grid_rows) * 100}%`,
                    }}
                  >
                    {objectIcon(item.object_type)}
                  </span>
                ))}
              {tokens
                .filter((token) => isGameMaster || !token.is_hidden)
                .map((token) => (
                  <button
                    key={token.id}
                    type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                      if (isGameMaster || token.user_id === userId)
                        setSelectedToken(token.id);
                    }}
                    aria-label={`${token.label}${isGameMaster || token.user_id === userId ? " auswählen" : ""}`}
                    className={`absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 bg-black/85 font-fantasy text-xs font-black text-white shadow-[0_3px_12px_rgba(0,0,0,.8)] transition ${selectedToken === token.id ? "h-11 w-11 ring-2 ring-white" : "h-9 w-9"}`}
                    style={{
                      left: `${((token.x + 0.5) / map.grid_columns) * 100}%`,
                      top: `${((token.y + 0.5) / map.grid_rows) * 100}%`,
                      borderColor: token.color,
                    }}
                  >
                    <span className="max-w-[32px] truncate">
                      {token.entity_type === "enemy"
                        ? "☠"
                        : token.entity_type === "npc"
                          ? "N"
                          : initials(token.label)}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </section>
        <aside className="space-y-4">
          <section className="mythoria-card p-4">
            <p className="text-[10px] font-bold tracking-[.18em] text-[var(--mythoria-green-bright)]">
              WERKZEUGE
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(
                [
                  ["move", "Bewegen"],
                  ["measure", "Messen"],
                  ...(isGameMaster
                    ? ([
                        ["reveal", "Nebel öffnen"],
                        ["enemy", "Gegner"],
                        ["npc", "NSC"],
                        ["door", "Tür"],
                        ["trap", "Falle"],
                        ["chest", "Truhe"],
                      ] as [ToolMode, string][])
                    : []),
                ] as [ToolMode, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMode(key)}
                  className={`rounded-lg border px-2 py-2 text-xs font-bold ${mode === key ? "border-[var(--mythoria-green-bright)] bg-[var(--mythoria-green-dark)]/30 text-white" : "border-[var(--mythoria-border)] text-[var(--mythoria-text-muted)]"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            {isGameMaster && (
              <p className="mt-2 text-[10px] text-[var(--mythoria-gold-light)]">
                Spielleiter-Werkzeuge aktiv
              </p>
            )}
          </section>
          <section className="mythoria-card p-4">
            <p className="text-[10px] font-bold tracking-[.18em] text-[var(--mythoria-green-bright)]">
              DEINE FIGUR
            </p>
            {characters.length > 0 ? (
              <>
                <select
                  value={characterId}
                  onChange={(event) => setCharacterId(event.target.value)}
                  className="mythoria-select mt-3"
                >
                  {characters.map((character) => (
                    <option key={character.id} value={character.id}>
                      {character.name} · Stufe {character.level}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={busy || !characterId}
                  onClick={() => void enterBoard()}
                  className="mythoria-button-primary mt-3 w-full"
                >
                  {busy ? "Wird platziert …" : "Auf Karte platzieren"}
                </button>
              </>
            ) : (
              <p className="mt-3 text-sm leading-6 text-[var(--mythoria-text-muted)]">
                Keiner deiner Charaktere befindet sich an diesem Ort.
              </p>
            )}
          </section>
          <section className="mythoria-card p-4">
            <p className="text-[10px] font-bold tracking-[.18em] text-[var(--mythoria-gold-light)]">
              GRUPPE · LIVE
            </p>
            <ul className="mt-3 max-h-40 space-y-2 overflow-y-auto">
              {tokens.length ? (
                tokens
                  .filter((token) => isGameMaster || !token.is_hidden)
                  .map((token) => (
                    <li
                      key={token.id}
                      className="flex items-center gap-2 rounded-lg border border-[var(--mythoria-border)] p-2 text-sm"
                    >
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ background: token.color }}
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {token.label}
                      </span>
                      <span className="text-[10px] text-[var(--mythoria-text-muted)]">
                        {token.x + 1}/{token.y + 1}
                      </span>
                    </li>
                  ))
              ) : (
                <li className="text-sm text-[var(--mythoria-text-muted)]">
                  Noch keine Figuren auf der Karte.
                </li>
              )}
            </ul>
          </section>
          <section className="mythoria-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold tracking-[.18em] text-[var(--mythoria-gold-light)]">
                GRUPPENWÜRFE · LIVE
              </p>
              <input
                type="number"
                min={-20}
                max={20}
                value={modifier}
                onChange={(event) =>
                  setModifier(
                    Math.max(
                      -20,
                      Math.min(20, Number(event.target.value) || 0),
                    ),
                  )
                }
                className="h-8 w-12 rounded-md border border-[var(--mythoria-border)] bg-black/30 text-center text-xs"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {[4, 6, 8, 10, 12, 20, 100].map((die) => (
                <button
                  key={die}
                  type="button"
                  onClick={() => void rollDie(die)}
                  className="rounded-md border border-[var(--mythoria-border)] px-2 py-1 text-[10px] font-bold text-[var(--mythoria-neon-soft)]"
                >
                  W{die}
                </button>
              ))}
            </div>
            <ul className="mt-3 max-h-36 space-y-1 overflow-y-auto">
              {rolls.map((roll) => (
                <li key={roll.id} className="flex justify-between text-xs">
                  <span className="truncate text-[var(--mythoria-text-muted)]">
                    {roll.roller_name} · W{roll.die}
                  </span>
                  <strong>{roll.total}</strong>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </main>
  );
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}
function cellVisible(
  x: number,
  y: number,
  fog: FogCell[],
  tokens: MapToken[],
  userId: string,
) {
  if (fog.some((cell) => cell.x === x && cell.y === y)) return true;
  return tokens.some(
    (token) =>
      token.entity_type === "player" &&
      (token.user_id === userId || !token.is_hidden) &&
      Math.max(Math.abs(token.x - x), Math.abs(token.y - y)) <=
        token.vision_range,
  );
}
function objectIcon(type: string) {
  return type === "door"
    ? "▥"
    : type === "trap"
      ? "⚠"
      : type === "chest"
        ? "▣"
        : type === "exit"
          ? "↗"
          : "◆";
}
