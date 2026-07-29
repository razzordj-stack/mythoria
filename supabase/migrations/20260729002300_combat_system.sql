begin;

create table if not exists public.enemies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  enemy_type text not null default 'creature',
  level integer not null default 1,
  max_health integer not null,
  attack integer not null,
  defense integer not null,
  experience_reward integer not null default 0,
  gold_reward integer not null default 0,
  icon text not null default '◆',
  status text not null default 'published',
  created_at timestamptz not null default now(),
  constraint enemies_values_valid check(level>=1 and max_health>0 and attack>=0 and defense>=0 and experience_reward>=0 and gold_reward>=0),
  constraint enemies_status_allowed check(status in('draft','published'))
);

create table if not exists public.combat_sessions (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  enemy_id uuid not null references public.enemies(id) on delete restrict,
  status text not null default 'active',
  turn integer not null default 1,
  player_health integer not null,
  player_mana integer not null,
  enemy_health integer not null,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint combat_status_allowed check(status in('active','victory','defeat','fled')),
  constraint combat_values_valid check(turn>=1 and player_health>=0 and player_mana>=0 and enemy_health>=0)
);

create unique index if not exists combat_one_active_character_idx on public.combat_sessions(character_id) where status='active';
create index if not exists combat_sessions_user_updated_idx on public.combat_sessions(user_id,updated_at desc);
create trigger combat_sessions_set_updated_at before update on public.combat_sessions for each row execute function public.set_updated_at();

create table if not exists public.combat_events (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.combat_sessions(id) on delete cascade,
  turn integer not null,
  actor text not null,
  action text not null,
  amount integer not null default 0,
  message text not null,
  created_at timestamptz not null default now(),
  constraint combat_event_actor_allowed check(actor in('player','enemy','system'))
);
create index if not exists combat_events_session_idx on public.combat_events(session_id,id);

alter table public.enemies enable row level security;
alter table public.combat_sessions enable row level security;
alter table public.combat_events enable row level security;
create policy "enemies_read_published" on public.enemies for select to authenticated using(status='published');
create policy "combat_sessions_select_own" on public.combat_sessions for select to authenticated using((select auth.uid())=user_id);
create policy "combat_events_select_own" on public.combat_events for select to authenticated using(exists(select 1 from public.combat_sessions s where s.id=session_id and s.user_id=(select auth.uid())));
revoke all on public.enemies,public.combat_sessions,public.combat_events from anon;
revoke insert,update,delete on public.enemies,public.combat_sessions,public.combat_events from authenticated;
grant select on public.enemies,public.combat_sessions,public.combat_events to authenticated;

insert into public.enemies(id,slug,name,description,enemy_type,level,max_health,attack,defense,experience_reward,gold_reward,icon) values
('20000000-0000-4000-8000-000000000001','nebelwolf','Nebelwolf','Ein ausgehungerter Jäger, der beinahe lautlos durch den Nebel streift.','beast',1,38,8,3,55,18,'◈'),
('20000000-0000-4000-8000-000000000002','moosgoblin','Moosgoblin-Plünderer','Ein gerissener Plünderer mit rostiger Klinge und überraschender Ausdauer.','humanoid',2,58,11,5,90,32,'♟'),
('20000000-0000-4000-8000-000000000003','ruinenwaechter','Wächter der Ruinen','Eine uralte Rüstung, die von grüner Runenenergie zusammengehalten wird.','construct',3,82,14,8,145,55,'♜'),
('20000000-0000-4000-8000-000000000004','schattendrache','Junger Schattendrache','Ein gefährlicher junger Drache, dessen Atem das Licht verschlingt.','dragon',5,135,20,12,280,110,'◆')
on conflict(id) do update set slug=excluded.slug,name=excluded.name,description=excluded.description,enemy_type=excluded.enemy_type,level=excluded.level,max_health=excluded.max_health,attack=excluded.attack,defense=excluded.defense,experience_reward=excluded.experience_reward,gold_reward=excluded.gold_reward,icon=excluded.icon;

create or replace function public.start_combat(p_character_id uuid,p_enemy_id uuid)
returns uuid language plpgsql security definer set search_path=public
as $$
declare v_user uuid:=auth.uid(); v_character record; v_enemy record; v_session uuid;
begin
  if v_user is null then raise exception 'authentication required'; end if;
  select id,level,health,mana into v_character from public.characters where id=p_character_id and user_id=v_user for update;
  if v_character.id is null then raise exception 'character not found'; end if;
  if v_character.health<=0 then raise exception 'character needs healing'; end if;
  select id,level,max_health,name into v_enemy from public.enemies where id=p_enemy_id and status='published';
  if v_enemy.id is null then raise exception 'enemy not found'; end if;
  if v_enemy.level>v_character.level+2 then raise exception 'enemy level too high'; end if;
  select id into v_session from public.combat_sessions where character_id=p_character_id and user_id=v_user and status='active' limit 1;
  if v_session is not null then return v_session; end if;
  insert into public.combat_sessions(character_id,user_id,enemy_id,player_health,player_mana,enemy_health)
  values(p_character_id,v_user,p_enemy_id,v_character.health,v_character.mana,v_enemy.max_health) returning id into v_session;
  insert into public.combat_events(session_id,turn,actor,action,message) values(v_session,1,'system','start','Der Kampf gegen '||v_enemy.name||' beginnt.');
  return v_session;
end;
$$;

create or replace function public.perform_combat_action(p_session_id uuid,p_action text,p_skill_id text default null)
returns jsonb language plpgsql security definer set search_path=public
as $$
declare
  v_user uuid:=auth.uid(); v_session record; v_character record; v_enemy record; v_skill record;
  v_player_attack integer; v_player_defense integer; v_damage integer:=0; v_enemy_damage integer:=0;
  v_defending boolean:=false; v_message text; v_status text:='active';
begin
  if v_user is null then raise exception 'authentication required'; end if;
  select * into v_session from public.combat_sessions where id=p_session_id and user_id=v_user and status='active' for update;
  if v_session.id is null then raise exception 'active combat not found'; end if;
  select * into v_character from public.characters where id=v_session.character_id and user_id=v_user for update;
  select * into v_enemy from public.enemies where id=v_session.enemy_id;
  v_player_attack:=greatest(1,5+v_character.level+floor((coalesce(v_character.strength,10)-10)/2.0)::integer);
  v_player_defense:=greatest(0,10+floor((coalesce(v_character.constitution,10)-10)/2.0)::integer+floor(v_character.level/2.0)::integer);

  if p_action='attack' then
    v_damage:=greatest(1,v_player_attack+floor(random()*4)::integer-floor(v_enemy.defense/2.0)::integer);
    v_message:=v_character.name||' trifft '||v_enemy.name||' für '||v_damage||' Schaden.';
  elsif p_action='defend' then
    v_defending:=true; v_message:=v_character.name||' nimmt eine verteidigende Haltung ein.';
  elsif p_action='skill' then
    select s.* into v_skill from public.skills s join public.character_skills cs on cs.skill_id=s.id
    where cs.character_id=v_character.id and cs.user_id=v_user and s.id=p_skill_id and s.skill_type='active';
    if v_skill.id is null then raise exception 'active skill unavailable'; end if;
    if v_session.player_mana<v_skill.mana_cost then raise exception 'not enough mana'; end if;
    v_session.player_mana:=v_session.player_mana-v_skill.mana_cost;
    v_damage:=greatest(1,v_player_attack+v_skill.mana_cost+floor((coalesce(v_character.intelligence,10)-10)/2.0)::integer-floor(v_enemy.defense/3.0)::integer);
    v_message:=v_character.name||' setzt '||v_skill.name||' ein und verursacht '||v_damage||' Schaden.';
  elsif p_action='flee' then
    if random()<0.5 then
      v_status:='fled'; v_message:=v_character.name||' entkommt aus dem Kampf.';
    else v_message:='Die Flucht misslingt.'; end if;
  else raise exception 'invalid combat action'; end if;

  insert into public.combat_events(session_id,turn,actor,action,amount,message) values(v_session.id,v_session.turn,'player',p_action,v_damage,v_message);
  v_session.enemy_health:=greatest(0,v_session.enemy_health-v_damage);
  if v_session.enemy_health=0 then
    v_status:='victory';
    insert into public.combat_events(session_id,turn,actor,action,message) values(v_session.id,v_session.turn,'system','victory',v_enemy.name||' wurde besiegt. Belohnung: '||v_enemy.experience_reward||' EP und '||v_enemy.gold_reward||' Gold.');
    update public.characters set health=v_session.player_health,mana=v_session.player_mana,experience=experience+v_enemy.experience_reward,gold=gold+v_enemy.gold_reward where id=v_character.id and user_id=v_user;
  elsif v_status='active' then
    v_enemy_damage:=greatest(1,v_enemy.attack+floor(random()*4)::integer-floor(v_player_defense/2.0)::integer);
    if v_defending then v_enemy_damage:=greatest(0,floor(v_enemy_damage/2.0)::integer); end if;
    v_session.player_health:=greatest(0,v_session.player_health-v_enemy_damage);
    insert into public.combat_events(session_id,turn,actor,action,amount,message) values(v_session.id,v_session.turn,'enemy','attack',v_enemy_damage,v_enemy.name||' verursacht '||v_enemy_damage||' Schaden.');
    if v_session.player_health=0 then v_status:='defeat'; insert into public.combat_events(session_id,turn,actor,action,message) values(v_session.id,v_session.turn,'system','defeat',v_character.name||' wurde besiegt.'); end if;
    update public.characters set health=v_session.player_health,mana=v_session.player_mana where id=v_character.id and user_id=v_user;
  elsif v_status='fled' then
    update public.characters set health=v_session.player_health,mana=v_session.player_mana where id=v_character.id and user_id=v_user;
  end if;

  update public.combat_sessions set status=v_status,turn=turn+1,player_health=v_session.player_health,player_mana=v_session.player_mana,enemy_health=v_session.enemy_health,completed_at=case when v_status='active' then null else now() end where id=v_session.id;
  return jsonb_build_object('status',v_status,'playerHealth',v_session.player_health,'playerMana',v_session.player_mana,'enemyHealth',v_session.enemy_health,'playerDamage',v_damage,'enemyDamage',v_enemy_damage);
end;
$$;

create or replace function public.rest_character(p_character_id uuid)
returns void language plpgsql security definer set search_path=public
as $$
declare v_user uuid:=auth.uid();
begin
  if v_user is null then raise exception 'authentication required'; end if;
  if exists(select 1 from public.combat_sessions where character_id=p_character_id and user_id=v_user and status='active') then raise exception 'active combat prevents resting'; end if;
  update public.characters set health=max_health,mana=max_mana where id=p_character_id and user_id=v_user;
  if not found then raise exception 'character not found'; end if;
end;
$$;

revoke all on function public.start_combat(uuid,uuid),public.perform_combat_action(uuid,text,text),public.rest_character(uuid) from public,anon;
grant execute on function public.start_combat(uuid,uuid),public.perform_combat_action(uuid,text,text),public.rest_character(uuid) to authenticated;
notify pgrst,'reload schema';
commit;
