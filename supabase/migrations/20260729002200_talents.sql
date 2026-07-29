begin;

create table if not exists public.talents (
  id text primary key,
  name text not null,
  description text not null,
  required_class text not null,
  specialization text not null,
  tier integer not null,
  point_cost integer not null default 1,
  prerequisite_id text references public.talents(id) on delete restrict,
  icon text not null default '✧',
  sort_order integer not null default 0,
  constraint talents_tier_valid check (tier between 1 and 5),
  constraint talents_cost_valid check (point_cost between 1 and 3)
);

create table if not exists public.character_talents (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  talent_id text not null references public.talents(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  unique(character_id,talent_id)
);

create index if not exists character_talents_character_idx on public.character_talents(character_id) include(talent_id);
alter table public.talents enable row level security;
alter table public.character_talents enable row level security;
create policy "talents_read" on public.talents for select to authenticated using(true);
create policy "character_talents_select_own" on public.character_talents for select to authenticated using((select auth.uid())=user_id);
revoke all on public.talents,public.character_talents from anon;
revoke insert,update,delete on public.talents,public.character_talents from authenticated;
grant select on public.talents,public.character_talents to authenticated;

insert into public.talents(id,name,description,required_class,specialization,tier,prerequisite_id,icon,sort_order) values
('warrior-bulwark-1','Fester Stand','Erhöht die Standfestigkeit gegen schwere Treffer.','warrior','Verteidiger',1,null,'◆',10),
('warrior-bulwark-2','Schildwall','Verstärkt die Verteidigung nach einem geblockten Angriff.','warrior','Verteidiger',2,'warrior-bulwark-1','▣',20),
('warrior-bulwark-3','Unbeugsam','Lässt den Krieger auch unter hohem Druck standhalten.','warrior','Verteidiger',3,'warrior-bulwark-2','♜',30),
('mage-arcane-1','Arkaner Fokus','Bündelt Magie für verlässlichere Zauber.','mage','Arkan',1,null,'✦',40),
('mage-arcane-2','Resonanz','Erfolgreiche Zauber hinterlassen nutzbare arkane Energie.','mage','Arkan',2,'mage-arcane-1','◇',50),
('mage-arcane-3','Meisterschaft','Vertieft die Kontrolle über mächtige Zauber.','mage','Arkan',3,'mage-arcane-2','✺',60),
('ranger-hunter-1','Ruhige Hand','Verbessert Präzision und Kontrolle auf Distanz.','ranger','Jäger',1,null,'➶',70),
('ranger-hunter-2','Beutezeichen','Markiert eine erkannte Schwachstelle des Ziels.','ranger','Jäger',2,'ranger-hunter-1','⌖',80),
('ranger-hunter-3','Meisterschütze','Belohnt geduldige Vorbereitung mit verheerender Präzision.','ranger','Jäger',3,'ranger-hunter-2','◎',90),
('rogue-shadow-1','Leiser Schritt','Reduziert die Aufmerksamkeit bei heimlichen Bewegungen.','rogue','Schatten',1,null,'◈',100),
('rogue-shadow-2','Aus dem Nichts','Verstärkt den ersten Angriff aus der Verborgenheit.','rogue','Schatten',2,'rogue-shadow-1','†',110),
('rogue-shadow-3','Nachtgestalt','Macht den Schurken in Dunkelheit schwerer greifbar.','rogue','Schatten',3,'rogue-shadow-2','◐',120),
('paladin-guardian-1','Geweihter Schutz','Stärkt den Schutz durch heilige Entschlossenheit.','paladin','Wächter',1,null,'☀',130),
('paladin-guardian-2','Schützende Aura','Weitet den heiligen Schutz auf Verbündete aus.','paladin','Wächter',2,'paladin-guardian-1','✧',140),
('paladin-guardian-3','Unerschütterlicher Eid','Verstärkt Schutz und Willenskraft in größter Gefahr.','paladin','Wächter',3,'paladin-guardian-2','♙',150),
('necromancer-bone-1','Knochenwissen','Vertieft das Wissen über untote Substanz.','necromancer','Knochenrufer',1,null,'☠',160),
('necromancer-bone-2','Grabesrüstung','Formt nekrotische Energie zu einer schützenden Hülle.','necromancer','Knochenrufer',2,'necromancer-bone-1','◉',170),
('necromancer-bone-3','Herr des Gebeins','Vollendet die Kontrolle über beschworene Knochen.','necromancer','Knochenrufer',3,'necromancer-bone-2','♝',180)
on conflict(id) do update set name=excluded.name,description=excluded.description,required_class=excluded.required_class,specialization=excluded.specialization,tier=excluded.tier,point_cost=excluded.point_cost,prerequisite_id=excluded.prerequisite_id,icon=excluded.icon,sort_order=excluded.sort_order;

create or replace function public.learn_character_talent(p_character_id uuid,p_talent_id text)
returns void language plpgsql security definer set search_path=public
as $$
declare
  v_user uuid := auth.uid(); v_level integer; v_class text; v_tier integer; v_cost integer;
  v_required_class text; v_prerequisite text; v_spent integer; v_available integer;
begin
  if v_user is null then raise exception 'authentication required'; end if;
  select level,lower(character_class) into v_level,v_class from public.characters where id=p_character_id and user_id=v_user for update;
  if v_level is null then raise exception 'character not found'; end if;
  select tier,point_cost,required_class,prerequisite_id into v_tier,v_cost,v_required_class,v_prerequisite from public.talents where id=p_talent_id;
  if v_tier is null or v_required_class<>v_class then raise exception 'talent unavailable for class'; end if;
  if v_level < (v_tier*2+1) then raise exception 'character level too low'; end if;
  if v_prerequisite is not null and not exists(select 1 from public.character_talents where character_id=p_character_id and talent_id=v_prerequisite) then raise exception 'talent prerequisite missing'; end if;
  select coalesce(sum(t.point_cost),0) into v_spent from public.character_talents ct join public.talents t on t.id=ct.talent_id where ct.character_id=p_character_id and ct.user_id=v_user;
  v_available := floor((v_level-1)/2.0)::integer-v_spent;
  if v_available<v_cost then raise exception 'not enough talent points'; end if;
  insert into public.character_talents(character_id,user_id,talent_id) values(p_character_id,v_user,p_talent_id) on conflict do nothing;
end;
$$;

create or replace function public.reset_character_talents(p_character_id uuid)
returns void language plpgsql security definer set search_path=public
as $$
declare v_user uuid:=auth.uid();
begin
  if v_user is null then raise exception 'authentication required'; end if;
  if not exists(select 1 from public.characters where id=p_character_id and user_id=v_user) then raise exception 'character not found'; end if;
  delete from public.character_talents where character_id=p_character_id and user_id=v_user;
end;
$$;

revoke all on function public.learn_character_talent(uuid,text),public.reset_character_talents(uuid) from public,anon;
grant execute on function public.learn_character_talent(uuid,text),public.reset_character_talents(uuid) to authenticated;
notify pgrst,'reload schema';
commit;
