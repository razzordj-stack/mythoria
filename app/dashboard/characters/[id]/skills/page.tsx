"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { talentPointsForLevel } from "@/lib/progression";
import { MythoriaAlert } from "@/components/ui/MythoriaAlert";
import { MythoriaBadge } from "@/components/ui/MythoriaBadge";
import { MythoriaEmptyState } from "@/components/ui/MythoriaEmptyState";
import { MythoriaPageHeader } from "@/components/ui/MythoriaPageHeader";
import { MythoriaSpinner } from "@/components/ui/MythoriaSpinner";

type Character = { id: string; name: string; character_class: string; level: number };
type Skill = { id: string; name: string; description: string; skill_type: "active" | "passive"; mana_cost: number; cooldown: number; required_level: number; icon: string; sort_order: number };
type Talent = { id: string; name: string; description: string; specialization: string; tier: number; point_cost: number; prerequisite_id: string | null; icon: string; sort_order: number };

export default function CharacterSkillsPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = useMemo(() => createClient(), []);
  const [character, setCharacter] = useState<Character | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [talents, setTalents] = useState<Talent[]>([]);
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [learnedTalentIds, setLearnedTalentIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Du bist nicht angemeldet."); setLoading(false); return; }
    const { data: characterData, error: characterError } = await supabase.from("characters")
      .select("id,name,character_class,level").eq("id", id).eq("user_id", user.id).maybeSingle()
      .overrideTypes<Character | null, { merge: false }>();
    if (characterError || !characterData) { setError(characterError?.message ?? "Charakter nicht gefunden."); setLoading(false); return; }
    setCharacter(characterData);
    const characterClass = characterData.character_class.toLowerCase();
    const [skillResult, unlockedResult, talentResult, learnedResult] = await Promise.all([
      supabase.from("skills").select("id,name,description,skill_type,mana_cost,cooldown,required_level,icon,sort_order").eq("required_class", characterClass).order("sort_order").overrideTypes<Skill[], { merge: false }>(),
      supabase.from("character_skills").select("skill_id").eq("character_id", id).eq("user_id", user.id).overrideTypes<Array<{ skill_id: string }>, { merge: false }>(),
      supabase.from("talents").select("id,name,description,specialization,tier,point_cost,prerequisite_id,icon,sort_order").eq("required_class", characterClass).order("sort_order").overrideTypes<Talent[], { merge: false }>(),
      supabase.from("character_talents").select("talent_id").eq("character_id", id).eq("user_id", user.id).overrideTypes<Array<{ talent_id: string }>, { merge: false }>(),
    ]);
    const firstError = skillResult.error ?? unlockedResult.error ?? talentResult.error ?? learnedResult.error;
    if (firstError) setError(firstError.message);
    else {
      setSkills(skillResult.data ?? []);
      setUnlockedIds(new Set((unlockedResult.data ?? []).map((entry) => entry.skill_id)));
      setTalents(talentResult.data ?? []);
      setLearnedTalentIds(new Set((learnedResult.data ?? []).map((entry) => entry.talent_id)));
    }
    setLoading(false);
  }, [id, supabase]);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  async function learn(talent: Talent) {
    setBusy(true); setError(""); setMessage("");
    const { error: rpcError } = await supabase.rpc("learn_character_talent", { p_character_id: id, p_talent_id: talent.id });
    if (rpcError) setError(talentError(rpcError.message));
    else { setMessage(`${talent.name} wurde freigeschaltet.`); await load(); }
    setBusy(false);
  }

  async function resetTalents() {
    if (!window.confirm("Möchtest du alle Talentpunkte dieses Charakters zurücksetzen?")) return;
    setBusy(true); setError(""); setMessage("");
    const { error: rpcError } = await supabase.rpc("reset_character_talents", { p_character_id: id });
    if (rpcError) setError(talentError(rpcError.message));
    else { setMessage("Die Talentpunkte wurden zurückgesetzt."); await load(); }
    setBusy(false);
  }

  if (loading) return <main className="mythoria-page flex min-h-screen items-center justify-center"><MythoriaSpinner size="large" /></main>;
  if (!character) return <main className="mythoria-page mx-auto max-w-4xl px-4 py-10"><MythoriaAlert variant="error">{error || "Charakter nicht gefunden."}</MythoriaAlert></main>;

  const totalPoints = talentPointsForLevel(character.level);
  const spentPoints = talents.filter((talent) => learnedTalentIds.has(talent.id)).reduce((sum, talent) => sum + talent.point_cost, 0);
  const availablePoints = Math.max(0, totalPoints - spentPoints);

  return <main className="mythoria-page mx-auto max-w-6xl px-4 py-8 sm:px-6">
    <MythoriaPageHeader eyebrow="FÄHIGKEITEN & TALENTE" title={`Das Können von ${character.name}`} description={`Klassenfähigkeiten entstehen durch Stufenaufstiege. Talentpunkte formen deine Spezialisierung. Aktuelle Stufe: ${character.level}.`} actions={<Link href={`/dashboard/characters/${id}`} className="mythoria-button-secondary">Zum Charakter</Link>} />
    {error && <MythoriaAlert variant="error" className="mt-6">{error}</MythoriaAlert>}
    {message && <MythoriaAlert variant="success" className="mt-6">{message}</MythoriaAlert>}

    <section className="mt-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold tracking-[.18em] text-[var(--mythoria-green-bright)]">KLASSENKÖNNEN</p><h2 className="mythoria-heading mt-1 text-2xl">Fähigkeiten</h2></div></div>
      {skills.length === 0 ? <MythoriaEmptyState className="mt-5" title="Noch keine Fähigkeiten" description="Für diese Klasse sind derzeit keine Fähigkeiten hinterlegt." /> : <div className="mt-5 grid gap-4 md:grid-cols-2">
        {skills.map((skill) => <SkillCard key={skill.id} skill={skill} unlocked={unlockedIds.has(skill.id)} />)}
      </div>}
    </section>

    <section className="mt-12 border-t border-[var(--mythoria-border)] pt-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold tracking-[.18em] text-[var(--mythoria-green-bright)]">SPEZIALISIERUNG</p><h2 className="mythoria-heading mt-1 text-2xl">Talentbaum</h2><p className="mt-2 text-sm text-[var(--mythoria-text-muted)]">Alle zwei Stufen nach Stufe 1 erhältst du einen Talentpunkt.</p></div><div className="flex flex-wrap items-center gap-3"><MythoriaBadge variant="gold">{availablePoints} von {totalPoints} Punkten frei</MythoriaBadge>{spentPoints > 0 && <button type="button" disabled={busy} onClick={() => void resetTalents()} className="mythoria-button-secondary">Talente zurücksetzen</button>}</div></div>
      {talents.length === 0 ? <MythoriaEmptyState className="mt-5" title="Noch kein Talentbaum" description="Für diese Klasse wurde noch keine Spezialisierung angelegt." /> : <div className="mt-6 grid gap-4 md:grid-cols-3">
        {talents.map((talent) => {
          const learned = learnedTalentIds.has(talent.id);
          const prerequisiteMet = !talent.prerequisite_id || learnedTalentIds.has(talent.prerequisite_id);
          const levelRequired = talent.tier * 2 + 1;
          const canLearn = !learned && prerequisiteMet && character.level >= levelRequired && availablePoints >= talent.point_cost;
          return <article key={talent.id} className={`mythoria-card relative p-6 ${learned ? "border-[var(--mythoria-success)] shadow-[0_0_24px_rgba(115,169,66,.12)]" : ""}`}>
            <div className="flex items-center justify-between gap-3"><span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--mythoria-border-gold)] bg-[var(--mythoria-green-dark)]/35 text-2xl">{talent.icon}</span><MythoriaBadge variant={learned ? "success" : "neutral"}>Rang {talent.tier}</MythoriaBadge></div>
            <p className="mt-4 text-xs font-bold tracking-[.14em] text-[var(--mythoria-gold-light)]">{talent.specialization.toUpperCase()}</p><h3 className="mythoria-subheading mt-1 text-xl">{talent.name}</h3><p className="mt-3 min-h-16 text-sm leading-6 text-[var(--mythoria-text-muted)]">{talent.description}</p>
            <div className="mt-5">{learned ? <span className="text-sm font-bold text-[var(--mythoria-success)]">✓ Erlernt</span> : <button type="button" disabled={busy || !canLearn} onClick={() => void learn(talent)} className="mythoria-button-primary w-full">{character.level < levelRequired ? `Ab Stufe ${levelRequired}` : !prerequisiteMet ? "Vorheriges Talent nötig" : availablePoints < talent.point_cost ? "Kein Talentpunkt frei" : "Talent erlernen"}</button>}</div>
          </article>;
        })}
      </div>}
    </section>
  </main>;
}

function SkillCard({ skill, unlocked }: { skill: Skill; unlocked: boolean }) {
  return <article className={`mythoria-card p-6 ${unlocked ? "border-[var(--mythoria-border-gold)]" : "opacity-65"}`}><div className="flex items-start gap-4"><span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[var(--mythoria-border-gold)] bg-[var(--mythoria-green-dark)]/35 text-2xl">{skill.icon}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="mythoria-subheading text-xl">{skill.name}</h3><MythoriaBadge variant={unlocked ? "success" : "neutral"}>{unlocked ? "Freigeschaltet" : `Ab Stufe ${skill.required_level}`}</MythoriaBadge></div><p className="mt-3 text-sm leading-6 text-[var(--mythoria-text-muted)]">{skill.description}</p><dl className="mt-4 flex flex-wrap gap-4 text-xs text-[var(--mythoria-text-secondary)]"><div><dt className="text-[var(--mythoria-text-muted)]">Art</dt><dd>{skill.skill_type === "active" ? "Aktiv" : "Passiv"}</dd></div>{skill.mana_cost > 0 && <div><dt className="text-[var(--mythoria-text-muted)]">Mana</dt><dd>{skill.mana_cost}</dd></div>}{skill.cooldown > 0 && <div><dt className="text-[var(--mythoria-text-muted)]">Abklingzeit</dt><dd>{skill.cooldown} Runden</dd></div>}</dl></div></div></article>;
}

function talentError(message: string) {
  if (message.includes("level too low")) return "Die benötigte Charakterstufe wurde noch nicht erreicht.";
  if (message.includes("prerequisite")) return "Das vorherige Talent muss zuerst erlernt werden.";
  if (message.includes("not enough")) return "Es ist kein Talentpunkt verfügbar.";
  if (message.includes("unavailable")) return "Dieses Talent gehört nicht zur Charakterklasse.";
  return message;
}
