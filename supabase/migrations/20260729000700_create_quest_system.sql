begin;

create table if not exists public.quests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  quest_type text not null default 'story',
  difficulty text not null default 'normal',
  level_requirement integer not null default 1,
  experience_reward integer not null default 0,
  gold_reward integer not null default 0,
  status text not null default 'available',
  objectives jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint quests_title_length check (char_length(title) between 2 and 120),
  constraint quests_level_positive check (level_requirement >= 1),
  constraint quests_rewards_nonnegative check (experience_reward >= 0 and gold_reward >= 0),
  constraint quests_status_allowed check (status in ('available','disabled')),
  constraint quests_difficulty_allowed check (difficulty in ('easy','normal','hard','heroic'))
);

create table if not exists public.character_quests (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters(id) on delete cascade,
  quest_id uuid not null references public.quests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active',
  progress jsonb not null default '{}'::jsonb,
  choice_data jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  unique(character_id, quest_id),
  constraint character_quests_status_allowed check (status in ('active','completed','failed','abandoned'))
);

create index if not exists character_quests_user_character_idx on public.character_quests(user_id, character_id);
create index if not exists character_quests_character_status_idx on public.character_quests(character_id, status);
drop trigger if exists character_quests_set_updated_at on public.character_quests;
create trigger character_quests_set_updated_at before update on public.character_quests
for each row execute function public.set_updated_at();

alter table public.quests enable row level security;
alter table public.character_quests enable row level security;

create policy "quests_read_available" on public.quests for select to authenticated using (status = 'available');
create policy "character_quests_select_own" on public.character_quests for select to authenticated using ((select auth.uid()) = user_id);
create policy "character_quests_insert_own" on public.character_quests for insert to authenticated with check (
  (select auth.uid()) = user_id and exists (
    select 1 from public.characters c where c.id = character_id and c.user_id = (select auth.uid())
  )
);
create policy "character_quests_update_own" on public.character_quests for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "character_quests_delete_own" on public.character_quests for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.quests, public.character_quests from anon;
grant select on public.quests to authenticated;
grant select, insert, update, delete on public.character_quests to authenticated;

insert into public.quests (id,title,description,quest_type,difficulty,level_requirement,experience_reward,gold_reward,objectives)
values
('10000000-0000-4000-8000-000000000001','Flüstern im Nebelwald','Reisende berichten von unheimlichen Lichtern zwischen den alten Bäumen. Finde ihren Ursprung.','story','easy',1,75,30,'[{"text":"Betritt den Nebelwald"},{"text":"Untersuche die geheimnisvollen Lichter"}]'::jsonb),
('10000000-0000-4000-8000-000000000002','Die gestohlene Schmiedeglut','Ein magischer Kern wurde aus der Schmiede entwendet. Folge den Spuren und bringe ihn zurück.','recovery','normal',1,125,55,'[{"text":"Befrage die Zeugen"},{"text":"Finde die Diebe"},{"text":"Bringe die Schmiedeglut zurück"}]'::jsonb),
('10000000-0000-4000-8000-000000000003','Schatten über Avaris','In den Ruinen von Avaris sammelt sich eine gefährliche Macht. Nur erfahrene Helden sollten sich nähern.','story','hard',3,300,140,'[{"text":"Erreiche die Ruinen von Avaris"},{"text":"Besiege den Schattenwächter"}]'::jsonb)
on conflict (id) do update set title=excluded.title,description=excluded.description,quest_type=excluded.quest_type,difficulty=excluded.difficulty,level_requirement=excluded.level_requirement,experience_reward=excluded.experience_reward,gold_reward=excluded.gold_reward,objectives=excluded.objectives;

create or replace function public.level_from_experience(p_experience integer)
returns integer language sql immutable strict set search_path = ''
as $$ select greatest(1, floor((sqrt(1 + greatest(p_experience,0)::numeric * 8 / 100) + 1) / 2)::integer) $$;

create or replace function public.change_character_quest(p_character_id uuid,p_quest_id uuid,p_action text)
returns void language plpgsql security invoker set search_path = public
as $$
declare v_user uuid := auth.uid(); v_level integer; v_xp integer; v_gold integer; v_new_xp integer;
begin
 if v_user is null then raise exception 'authentication required'; end if;
 select level into v_level from public.characters where id=p_character_id and user_id=v_user for update;
 if v_level is null then raise exception 'character not found'; end if;
 select experience_reward,gold_reward into v_xp,v_gold from public.quests where id=p_quest_id and status='available' and level_requirement<=v_level;
 if v_xp is null then raise exception 'quest unavailable or level too low'; end if;
 if p_action='accept' then
   insert into public.character_quests(character_id,quest_id,user_id,status,started_at,completed_at)
   values(p_character_id,p_quest_id,v_user,'active',now(),null)
   on conflict(character_id,quest_id) do update set status='active',started_at=now(),completed_at=null
   where character_quests.status='abandoned';
 elsif p_action='abandon' then
   update public.character_quests set status='abandoned' where character_id=p_character_id and quest_id=p_quest_id and user_id=v_user and status='active';
   if not found then raise exception 'active quest not found'; end if;
 elsif p_action='complete' then
   update public.character_quests set status='completed',completed_at=now(),progress='{"percent":100}'::jsonb
   where character_id=p_character_id and quest_id=p_quest_id and user_id=v_user and status='active';
   if not found then raise exception 'active quest not found'; end if;
   update public.characters set experience=experience+v_xp,gold=gold+v_gold where id=p_character_id and user_id=v_user returning experience into v_new_xp;
   update public.characters set level=public.level_from_experience(v_new_xp) where id=p_character_id and user_id=v_user;
 else raise exception 'invalid quest action'; end if;
end;
$$;
revoke all on function public.change_character_quest(uuid,uuid,text) from public,anon;
grant execute on function public.change_character_quest(uuid,uuid,text) to authenticated;
notify pgrst, 'reload schema';
commit;
