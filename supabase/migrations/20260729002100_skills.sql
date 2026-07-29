begin;

create table if not exists public.skills (
  id text primary key,
  name text not null,
  description text not null,
  skill_type text not null default 'active',
  mana_cost integer not null default 0,
  cooldown integer not null default 0,
  required_level integer not null default 1,
  required_class text,
  icon text not null default '✦',
  sort_order integer not null default 0,
  constraint skills_type_allowed check (skill_type in ('active','passive')),
  constraint skills_values_valid check (mana_cost >= 0 and cooldown >= 0 and required_level >= 1)
);

create table if not exists public.character_skills (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_id text not null references public.skills(id) on delete cascade,
  rank integer not null default 1,
  unlocked_at timestamptz not null default now(),
  unique(character_id, skill_id),
  constraint character_skills_rank_valid check (rank between 1 and 5)
);

create index if not exists character_skills_character_idx on public.character_skills(character_id) include (skill_id);

alter table public.skills enable row level security;
alter table public.character_skills enable row level security;
create policy "skills_read" on public.skills for select to authenticated using (true);
create policy "character_skills_select_own" on public.character_skills for select to authenticated using ((select auth.uid()) = user_id);
revoke all on public.skills, public.character_skills from anon;
revoke insert, update, delete on public.skills, public.character_skills from authenticated;
grant select on public.skills, public.character_skills to authenticated;

insert into public.skills(id,name,description,skill_type,mana_cost,cooldown,required_level,required_class,icon,sort_order) values
('warrior-power-strike','Machtschlag','Ein schwerer Hieb, der gegnerische Deckung durchbricht.','active',0,2,1,'warrior','⚔',10),
('warrior-iron-guard','Eiserne Wacht','Erhöht dauerhaft die Standfestigkeit des Kriegers.','passive',0,0,3,'warrior','◆',20),
('mage-arcane-spark','Arkaner Funke','Entfesselt konzentrierte arkane Energie.','active',8,1,1,'mage','✦',30),
('mage-mana-weave','Manageflecht','Verbessert die Kontrolle über magische Reserven.','passive',0,0,3,'mage','◇',40),
('ranger-aimed-shot','Gezielter Schuss','Ein sorgfältig gezielter Fernkampfangriff.','active',0,2,1,'ranger','➶',50),
('ranger-trail-sense','Spurensinn','Enthüllt verborgene Spuren und Gefahren.','passive',0,0,3,'ranger','⌖',60),
('rogue-shadow-step','Schattenschritt','Wechselt blitzschnell in eine günstige Position.','active',4,2,1,'rogue','◈',70),
('rogue-opportunist','Opportunist','Nutzt Schwächen unaufmerksamer Gegner.','passive',0,0,3,'rogue','†',80),
('paladin-radiant-strike','Strahlender Schlag','Ein geweihter Angriff gegen die Dunkelheit.','active',6,2,1,'paladin','☀',90),
('paladin-aura-of-courage','Aura des Mutes','Stärkt die Entschlossenheit in bedrohlichen Momenten.','passive',0,0,3,'paladin','✧',100),
('necromancer-grave-touch','Berührung des Grabes','Entzieht einem Ziel einen Teil seiner Lebenskraft.','active',7,2,1,'necromancer','☠',110),
('necromancer-dark-pact','Dunkler Pakt','Gewährt Macht zu einem kontrollierten Preis.','passive',0,0,3,'necromancer','◉',120)
on conflict (id) do update set name=excluded.name,description=excluded.description,skill_type=excluded.skill_type,mana_cost=excluded.mana_cost,cooldown=excluded.cooldown,required_level=excluded.required_level,required_class=excluded.required_class,icon=excluded.icon,sort_order=excluded.sort_order;

create or replace function public.sync_character_skills()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.character_skills(character_id,user_id,skill_id)
  select new.id,new.user_id,s.id from public.skills s
  where (s.required_class is null or s.required_class=lower(new.character_class))
    and s.required_level<=new.level
  on conflict(character_id,skill_id) do nothing;
  return new;
end;
$$;

drop trigger if exists characters_sync_skills on public.characters;
create trigger characters_sync_skills after insert or update of level,character_class on public.characters
for each row execute function public.sync_character_skills();

insert into public.character_skills(character_id,user_id,skill_id)
select c.id,c.user_id,s.id from public.characters c join public.skills s
  on (s.required_class is null or s.required_class=lower(c.character_class)) and s.required_level<=c.level
on conflict(character_id,skill_id) do nothing;

notify pgrst, 'reload schema';
commit;
