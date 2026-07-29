"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MythoriaAlert } from "@/components/ui/MythoriaAlert";
import { MythoriaBadge } from "@/components/ui/MythoriaBadge";
import { MythoriaEmptyState } from "@/components/ui/MythoriaEmptyState";
import { MythoriaPageHeader } from "@/components/ui/MythoriaPageHeader";
import { MythoriaSpinner } from "@/components/ui/MythoriaSpinner";

type Character = { id:string; name:string; level:number; health:number; max_health:number; mana:number; max_mana:number };
type Enemy = { id:string; name:string; description:string; enemy_type:string; level:number; max_health:number; attack:number; defense:number; experience_reward:number; gold_reward:number; icon:string };
type CombatSession = { id:string; enemy_id:string; status:"active"|"victory"|"defeat"|"fled"; turn:number; player_health:number; player_mana:number; enemy_health:number; skill_cooldowns:Record<string,number>; player_effects:{name?:string;turns?:number}; updated_at:string };
type CombatEvent = { id:number; turn:number; actor:"player"|"enemy"|"system"; action:string; amount:number; message:string };
type Skill = { id:string; name:string; mana_cost:number; cooldown:number };
type Potion = { id:string; name:string; quantity:number; health_bonus:number; mana_bonus:number };

export default function CombatPage(){
  const {id}=useParams<{id:string}>();
  const supabase=useMemo(()=>createClient(),[]);
  const[character,setCharacter]=useState<Character|null>(null);
  const[enemies,setEnemies]=useState<Enemy[]>([]);
  const[session,setSession]=useState<CombatSession|null>(null);
  const[enemy,setEnemy]=useState<Enemy|null>(null);
  const[events,setEvents]=useState<CombatEvent[]>([]);
  const[skills,setSkills]=useState<Skill[]>([]);
  const[potions,setPotions]=useState<Potion[]>([]);
  const[loading,setLoading]=useState(true);
  const[busy,setBusy]=useState(false);
  const[error,setError]=useState("");

  const load=useCallback(async()=>{
    setLoading(true);setError("");
    const{data:{user}}=await supabase.auth.getUser();
    if(!user){setError("Du bist nicht angemeldet.");setLoading(false);return;}
    const{data:characterData,error:characterError}=await supabase.from("characters").select("id,name,level,health,max_health,mana,max_mana").eq("id",id).eq("user_id",user.id).maybeSingle().overrideTypes<Character|null,{merge:false}>();
    if(characterError||!characterData){setError(characterError?.message??"Charakter nicht gefunden.");setLoading(false);return;}
    setCharacter(characterData);
    const[{data:enemyData,error:enemyError},{data:sessionData,error:sessionError},{data:skillLinks,error:skillError},{data:potionData,error:potionError}]=await Promise.all([
      supabase.from("enemies").select("id,name,description,enemy_type,level,max_health,attack,defense,experience_reward,gold_reward,icon").lte("level",characterData.level+2).order("level").overrideTypes<Enemy[],{merge:false}>(),
      supabase.from("combat_sessions").select("id,enemy_id,status,turn,player_health,player_mana,enemy_health,skill_cooldowns,player_effects,updated_at").eq("character_id",id).eq("user_id",user.id).order("updated_at",{ascending:false}).limit(1).maybeSingle().overrideTypes<CombatSession|null,{merge:false}>(),
      supabase.from("character_skills").select("skill_id").eq("character_id",id).eq("user_id",user.id).overrideTypes<Array<{skill_id:string}>,{merge:false}>(),
      supabase.from("inventory_items").select("id,name,quantity,health_bonus,mana_bonus").eq("character_id",id).eq("user_id",user.id).eq("item_type","potion").gt("quantity",0).order("name").overrideTypes<Potion[],{merge:false}>(),
    ]);
    if(enemyError||sessionError||skillError||potionError){setError(enemyError?.message??sessionError?.message??skillError?.message??potionError?.message??"Kampfdaten konnten nicht geladen werden.");setLoading(false);return;}
    setEnemies(enemyData??[]);setSession(sessionData);
    setPotions(potionData??[]);
    const skillIds=(skillLinks??[]).map((row)=>row.skill_id);
    if(skillIds.length>0){const{data:activeSkills,error:activeSkillError}=await supabase.from("skills").select("id,name,mana_cost,cooldown").in("id",skillIds).eq("skill_type","active").order("sort_order").overrideTypes<Skill[],{merge:false}>();if(activeSkillError)setError(activeSkillError.message);else setSkills(activeSkills??[]);}else setSkills([]);
    if(sessionData){
      const currentEnemy=(enemyData??[]).find((candidate)=>candidate.id===sessionData.enemy_id)??null;
      setEnemy(currentEnemy);
      const{data:eventData,error:eventError}=await supabase.from("combat_events").select("id,turn,actor,action,amount,message").eq("session_id",sessionData.id).order("id").overrideTypes<CombatEvent[],{merge:false}>();
      if(eventError)setError(eventError.message);else setEvents(eventData??[]);
    }else{setEnemy(null);setEvents([]);}
    setLoading(false);
  },[id,supabase]);

  useEffect(()=>{const timer=window.setTimeout(()=>void load(),0);return()=>window.clearTimeout(timer)},[load]);

  async function start(enemyId:string){setBusy(true);setError("");const{error:rpcError}=await supabase.rpc("start_combat",{p_character_id:id,p_enemy_id:enemyId});if(rpcError)setError(combatError(rpcError.message));else await load();setBusy(false);}
  async function act(action:"attack"|"defend"|"flee"|"skill"|"item",targetId?:string){if(!session)return;setBusy(true);setError("");const{error:rpcError}=await supabase.rpc("perform_combat_action",{p_session_id:session.id,p_action:action,p_skill_id:action==="skill"?targetId??null:null,p_item_id:action==="item"?targetId??null:null});if(rpcError)setError(combatError(rpcError.message));else await load();setBusy(false);}
  async function rest(){setBusy(true);setError("");const{error:rpcError}=await supabase.rpc("rest_character",{p_character_id:id});if(rpcError)setError(combatError(rpcError.message));else{await load();setSession(null);setEnemy(null);setEvents([]);}setBusy(false);}

  if(loading)return <main className="mythoria-page flex min-h-screen items-center justify-center"><MythoriaSpinner size="large"/></main>;
  if(!character)return <main className="mythoria-page mx-auto max-w-4xl px-4 py-10"><MythoriaAlert variant="error">{error||"Charakter nicht gefunden."}</MythoriaAlert></main>;
  const active=session?.status==="active";

  return <main className="mythoria-page mx-auto max-w-[1440px] px-4 py-8 sm:px-6">
    <MythoriaPageHeader eyebrow="KAMPFARENA" title={`Prüfung für ${character.name}`} description="Rundenbasierte Kämpfe werden vollständig serverseitig berechnet und dauerhaft protokolliert." actions={<Link href={`/dashboard/characters/${id}`} className="mythoria-button-secondary">Zum Charakter</Link>}/>
    {error&&<MythoriaAlert variant="error" className="mt-6">{error}</MythoriaAlert>}
    {session&&enemy?<section className="mt-8">
      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr_1fr]">
        <CombatantCard title="HELD" name={character.name} icon="♙" level={character.level} health={session.player_health} maxHealth={character.max_health} mana={session.player_mana} maxMana={character.max_mana}/>
        <div className="mythoria-panel order-3 p-5 lg:order-none"><div className="flex items-center justify-between gap-3"><h2 className="mythoria-subheading text-xl">Kampfchronik</h2><MythoriaBadge variant={statusVariant(session.status)}>{statusLabel(session.status)}</MythoriaBadge></div><div className="mt-5 max-h-[430px] space-y-3 overflow-y-auto pr-1" aria-live="polite">{events.map((event)=><article key={event.id} className={`rounded-xl border p-3 text-sm ${event.actor==="enemy"?"border-red-900/50 bg-red-950/15":event.actor==="player"?"border-[var(--mythoria-border-gold)] bg-[var(--mythoria-green-dark)]/15":"border-[var(--mythoria-border)] bg-black/20"}`}><p className="text-xs text-[var(--mythoria-text-muted)]">Runde {event.turn}</p><p className="mt-1 text-[var(--mythoria-text-secondary)]">{event.message}</p></article>)}</div></div>
        <CombatantCard title="GEGNER" name={enemy.name} icon={enemy.icon} level={enemy.level} health={session.enemy_health} maxHealth={enemy.max_health}/>
      </div>
      {active?<div className="mythoria-panel mt-5 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="mythoria-subheading text-xl">Deine Aktion</h2>{session.player_effects.name&&<MythoriaBadge variant="danger">{session.player_effects.name} · {session.player_effects.turns??0} Runden</MythoriaBadge>}</div><div className="mt-4 grid gap-3 sm:grid-cols-3"><button disabled={busy} onClick={()=>void act("attack")} className="mythoria-button-primary">Angreifen</button><button disabled={busy} onClick={()=>void act("defend")} className="mythoria-button-secondary">Verteidigen</button><button disabled={busy} onClick={()=>void act("flee")} className="mythoria-button-secondary">Fliehen</button></div>{skills.length>0&&<div className="mt-5 border-t border-[var(--mythoria-border)] pt-5"><p className="text-sm font-bold text-[var(--mythoria-gold-light)]">Aktive Fähigkeiten</p><div className="mt-3 flex flex-wrap gap-3">{skills.map((skill)=>{const remaining=session.skill_cooldowns[skill.id]??0;return <button key={skill.id} disabled={busy||session.player_mana<skill.mana_cost||remaining>0} onClick={()=>void act("skill",skill.id)} className="mythoria-button-secondary">{skill.name} · {remaining>0?`${remaining} Runden`: `${skill.mana_cost} Mana`}</button>})}</div></div>}{potions.length>0&&<div className="mt-5 border-t border-[var(--mythoria-border)] pt-5"><p className="text-sm font-bold text-[var(--mythoria-gold-light)]">Verbrauchsgegenstände</p><div className="mt-3 flex flex-wrap gap-3">{potions.map((potion)=><button key={potion.id} disabled={busy} onClick={()=>void act("item",potion.id)} className="mythoria-button-secondary">{potion.name} × {potion.quantity}</button>)}</div></div>}</div>:<div className="mythoria-panel mt-5 p-6 text-center"><h2 className="mythoria-subheading text-2xl">{statusLabel(session.status)}</h2><p className="mt-3 text-sm text-[var(--mythoria-text-muted)]">Der Kampf ist beendet. Du kannst dich erholen und anschließend einen neuen Gegner wählen.</p><button disabled={busy} onClick={()=>void rest()} className="mythoria-button-primary mt-5">Rasten und vollständig erholen</button></div>}
    </section>:<EnemySelection enemies={enemies} character={character} busy={busy} onStart={start} onRest={rest}/>} 
  </main>;
}

function EnemySelection({enemies,character,busy,onStart,onRest}:{enemies:Enemy[];character:Character;busy:boolean;onStart:(id:string)=>void;onRest:()=>void}){return <section className="mt-8"><div className="mythoria-panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="mythoria-subheading text-xl">Kampfbereitschaft</h2><p className="mt-2 text-sm text-[var(--mythoria-text-muted)]">Leben {character.health}/{character.max_health} · Mana {character.mana}/{character.max_mana}</p></div>{(character.health<character.max_health||character.mana<character.max_mana)&&<button disabled={busy} onClick={onRest} className="mythoria-button-secondary">Rasten</button>}</div>{enemies.length===0?<MythoriaEmptyState className="mt-5" title="Keine Gegner verfügbar" description="Für deine aktuelle Stufe wurde noch keine passende Herausforderung gefunden."/>:<div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{enemies.map((enemy)=><article key={enemy.id} className="mythoria-card p-5"><span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-xl border border-red-900/50 bg-red-950/20 text-3xl">{enemy.icon}</span><div className="mt-4 flex items-center justify-between gap-2"><h2 className="mythoria-subheading text-xl">{enemy.name}</h2><MythoriaBadge variant={enemy.level>character.level?"danger":"gold"}>Stufe {enemy.level}</MythoriaBadge></div><p className="mt-3 min-h-20 text-sm leading-6 text-[var(--mythoria-text-muted)]">{enemy.description}</p><dl className="mt-4 grid grid-cols-2 gap-2 text-xs text-[var(--mythoria-text-secondary)]"><div>Leben: {enemy.max_health}</div><div>Angriff: {enemy.attack}</div><div>{enemy.experience_reward} EP</div><div>{enemy.gold_reward} Gold</div></dl><button disabled={busy||character.health<=0} onClick={()=>onStart(enemy.id)} className="mythoria-button-primary mt-5 w-full">Kampf beginnen</button></article>)}</div>}</section>}

function CombatantCard({title,name,icon,level,health,maxHealth,mana,maxMana}:{title:string;name:string;icon:string;level:number;health:number;maxHealth:number;mana?:number;maxMana?:number}){return <article className="mythoria-card h-fit p-5"><p className="text-xs font-bold tracking-[.18em] text-[var(--mythoria-gold-light)]">{title}</p><span aria-hidden="true" className="mt-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--mythoria-border-gold)] bg-black/20 text-4xl">{icon}</span><h2 className="mythoria-subheading mt-4 text-2xl">{name}</h2><p className="mt-1 text-sm text-[var(--mythoria-text-muted)]">Stufe {level}</p><Bar label="Leben" value={health} max={maxHealth} color="var(--mythoria-health)"/>{mana!==undefined&&maxMana!==undefined&&<Bar label="Mana" value={mana} max={maxMana} color="var(--mythoria-mana)"/>}</article>}
function Bar({label,value,max,color}:{label:string;value:number;max:number;color:string}){const safe=Math.max(1,max);return <div className="mt-5"><div className="flex justify-between text-xs"><span>{label}</span><span>{value}/{safe}</span></div><div className="mythoria-stat-bar mt-2"><div className="h-full rounded-full transition-[width]" style={{width:`${Math.min(100,Math.max(0,value/safe*100))}%`,background:color}}/></div></div>}
function statusLabel(status:CombatSession["status"]){return{active:"Kampf läuft",victory:"Sieg",defeat:"Niederlage",fled:"Entkommen"}[status]}
function statusVariant(status:CombatSession["status"]):"success"|"danger"|"warning"|"gold"{return status==="victory"?"success":status==="defeat"?"danger":status==="fled"?"warning":"gold"}
function combatError(message:string){if(message.includes("needs healing"))return"Dein Charakter muss sich vor dem Kampf erholen.";if(message.includes("level too high"))return"Dieser Gegner ist für deine aktuelle Stufe zu mächtig.";if(message.includes("not enough mana"))return"Für diese Fähigkeit ist nicht genug Mana vorhanden.";if(message.includes("active skill unavailable"))return"Diese aktive Fähigkeit ist nicht freigeschaltet.";if(message.includes("skill on cooldown"))return"Diese Fähigkeit ist noch nicht wieder bereit.";if(message.includes("combat item unavailable"))return"Dieser Trank ist nicht mehr verfügbar.";return message}
