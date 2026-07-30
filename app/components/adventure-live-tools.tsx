"use client";

import Link from "next/link";
import { useState } from "react";

type Roll = { id:string;die:number;raw:number;modifier:number;total:number };
const dice=[4,6,8,10,12,20,100] as const;

export function AdventureLiveTools({boardSlug,onUseRoll}:{boardSlug?:string;onUseRoll:(text:string)=>void}){
  const [boardOpen,setBoardOpen]=useState(false);
  const [diceOpen,setDiceOpen]=useState(false);
  const [modifier,setModifier]=useState(0);
  const [rolls,setRolls]=useState<Roll[]>([]);
  const boardHref=boardSlug?`/dashboard/world/${boardSlug}/board`:"";

  function roll(die:number){
    const range=0x100000000-(0x100000000%die);let value=0;
    do{value=crypto.getRandomValues(new Uint32Array(1))[0]}while(value>=range);
    const raw=(value%die)+1;
    setRolls(current=>[{id:crypto.randomUUID(),die,raw,modifier,total:raw+modifier},...current].slice(0,5));
  }

  return <section className="mt-2 rounded-xl border border-[var(--mythoria-border)] bg-[var(--mythoria-surface)]/75" aria-label="Spielwerkzeuge">
    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
      <div className="flex min-w-0 items-center gap-2"><span className="text-[var(--mythoria-green-bright)]">◆</span><p className="text-xs font-bold tracking-wide text-[var(--mythoria-text-secondary)]">SPIELWERKZEUGE</p></div>
      <div className="flex flex-wrap gap-1.5">
        <button type="button" onClick={()=>setDiceOpen(value=>!value)} className="rounded-lg border border-[var(--mythoria-border-gold)] px-2.5 py-1 text-[11px] font-bold text-[var(--mythoria-gold-light)] hover:bg-[var(--mythoria-panel-hover)]">⚄ Würfel</button>
        <button type="button" disabled={!boardHref} onClick={()=>setBoardOpen(value=>!value)} className="rounded-lg border border-[var(--mythoria-border-gold)] px-2.5 py-1 text-[11px] font-bold text-[var(--mythoria-gold-light)] hover:bg-[var(--mythoria-panel-hover)] disabled:opacity-40">⌖ {boardOpen?"Karte schließen":"Live-Karte"}</button>
        {boardHref&&<Link href={boardHref} target="_blank" className="rounded-lg border border-[var(--mythoria-border)] px-2.5 py-1 text-[11px] font-bold text-[var(--mythoria-text-muted)] hover:text-[var(--mythoria-text)]">↗ Groß</Link>}
      </div>
    </div>
    {diceOpen&&<div className="border-t border-[var(--mythoria-border)] p-3">
      <div className="flex flex-wrap items-center gap-2">
        {dice.map(die=><button key={die} type="button" onClick={()=>roll(die)} className="flex h-9 min-w-9 items-center justify-center rounded-lg border border-[var(--mythoria-border)] bg-black/25 px-2 text-xs font-black text-[var(--mythoria-neon-soft)] transition hover:border-[var(--mythoria-green-bright)] hover:bg-[var(--mythoria-green-dark)]/30">W{die}</button>)}
        <label className="ml-auto flex items-center gap-2 text-xs text-[var(--mythoria-text-muted)]">Modifikator<input type="number" min={-20} max={20} value={modifier} onChange={event=>setModifier(Math.max(-20,Math.min(20,Number(event.target.value)||0)))} className="h-9 w-16 rounded-lg border border-[var(--mythoria-border)] bg-black/30 px-2 text-center text-[var(--mythoria-text)]"/></label>
      </div>
      {rolls.length>0&&<div className="mt-3 flex flex-wrap gap-2">{rolls.map((item,index)=><button key={item.id} type="button" onClick={()=>onUseRoll(`Würfelwurf W${item.die}: ${item.raw}${item.modifier?` ${item.modifier>0?"+":"−"} ${Math.abs(item.modifier)}`:""} = ${item.total}`)} className={`rounded-lg border px-3 py-2 text-left ${index===0?"border-[var(--mythoria-green-bright)] bg-[var(--mythoria-green-dark)]/20":"border-[var(--mythoria-border)] bg-black/20"}`}><span className="block text-[10px] text-[var(--mythoria-text-muted)]">W{item.die}</span><strong className="text-lg text-[var(--mythoria-text)]">{item.total}</strong>{item.modifier!==0&&<span className="ml-1 text-[10px] text-[var(--mythoria-text-muted)]">({item.raw}{item.modifier>0?"+":""}{item.modifier})</span>}</button>)}</div>}
      {rolls.length>0&&<p className="mt-2 text-[10px] text-[var(--mythoria-text-muted)]">Ergebnis anklicken, um es in die nächste Handlung zu übernehmen.</p>}
    </div>}
    {boardOpen&&boardHref&&<div className="border-t border-[var(--mythoria-border)] p-2"><iframe src={boardHref} title="Live-Spielbrett" className="h-[min(68vh,720px)] w-full rounded-lg border border-[var(--mythoria-border)] bg-black"/></div>}
  </section>;
}
