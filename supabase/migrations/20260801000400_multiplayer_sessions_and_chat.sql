begin;

create table if not exists public.multiplayer_party_sessions(
  id uuid primary key default gen_random_uuid(), party_id uuid not null unique references public.multiplayer_parties(id) on delete cascade,
  location_id uuid not null references public.world_locations(id) on delete restrict, location_slug text not null, location_name text not null,
  status text not null default 'active' check(status in('active','completed')), started_by uuid not null references auth.users(id) on delete restrict,
  started_at timestamptz not null default now(), ended_at timestamptz
);
create table if not exists public.multiplayer_party_messages(
  id uuid primary key default gen_random_uuid(), session_id uuid not null references public.multiplayer_party_sessions(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade, content text not null check(char_length(content) between 1 and 500), created_at timestamptz not null default now()
);
create index if not exists multiplayer_party_messages_session_created_idx on public.multiplayer_party_messages(session_id,created_at);

alter table public.multiplayer_party_sessions enable row level security;
alter table public.multiplayer_party_messages enable row level security;
create policy "party_sessions_member_read" on public.multiplayer_party_sessions for select to authenticated using(public.is_party_member(party_id));
create or replace function public.is_party_session_member(p_session uuid) returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from public.multiplayer_party_sessions s where s.id=p_session and public.is_party_member(s.party_id))$$;
create policy "party_messages_member_read" on public.multiplayer_party_messages for select to authenticated using(public.is_party_session_member(session_id));
revoke all on public.multiplayer_party_sessions,public.multiplayer_party_messages from anon;
revoke insert,update,delete on public.multiplayer_party_sessions,public.multiplayer_party_messages from authenticated;
grant select on public.multiplayer_party_sessions,public.multiplayer_party_messages to authenticated;

create or replace function public.start_multiplayer_party_session(p_party_id uuid) returns uuid language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid();v_location uuid;v_slug text;v_name text;v_session uuid;v_members integer;v_locations integer;
begin
  if not exists(select 1 from public.multiplayer_parties where id=p_party_id and leader_id=v_user and status='ready') then raise exception 'party not ready'; end if;
  select count(*),count(distinct c.current_location_id),min(c.current_location_id) into v_members,v_locations,v_location from public.multiplayer_party_members pm join public.characters c on c.id=pm.character_id where pm.party_id=p_party_id;
  if v_members<2 or v_locations<>1 or v_location is null then raise exception 'party members must share location'; end if;
  select slug,name into v_slug,v_name from public.world_locations where id=v_location;
  if not exists(select 1 from public.tactical_maps where location_id=v_location and status='published') then raise exception 'no tactical map'; end if;
  insert into public.multiplayer_party_sessions(party_id,location_id,location_slug,location_name,status,started_by,started_at,ended_at) values(p_party_id,v_location,v_slug,v_name,'active',v_user,now(),null) on conflict(party_id) do update set location_id=excluded.location_id,location_slug=excluded.location_slug,location_name=excluded.location_name,status='active',started_by=excluded.started_by,started_at=now(),ended_at=null returning id into v_session;
  return v_session;
end;$$;
create or replace function public.end_multiplayer_party_session(p_party_id uuid) returns void language plpgsql security definer set search_path=public as $$begin if not exists(select 1 from public.multiplayer_parties where id=p_party_id and leader_id=auth.uid()) then raise exception 'leader required'; end if;update public.multiplayer_party_sessions set status='completed',ended_at=now() where party_id=p_party_id and status='active';if not found then raise exception 'active session not found';end if;end;$$;
create or replace function public.send_multiplayer_party_message(p_session_id uuid,p_content text) returns void language plpgsql security definer set search_path=public as $$declare v_party uuid;begin select party_id into v_party from public.multiplayer_party_sessions where id=p_session_id and status='active';if v_party is null or not public.is_party_member(v_party) then raise exception 'active party session not found';end if;insert into public.multiplayer_party_messages(session_id,author_id,content) values(p_session_id,auth.uid(),left(trim(p_content),500));end;$$;
revoke all on function public.is_party_session_member(uuid),public.start_multiplayer_party_session(uuid),public.end_multiplayer_party_session(uuid),public.send_multiplayer_party_message(uuid,text) from public,anon;
grant execute on function public.is_party_session_member(uuid),public.start_multiplayer_party_session(uuid),public.end_multiplayer_party_session(uuid),public.send_multiplayer_party_message(uuid,text) to authenticated;
do $$begin alter publication supabase_realtime add table public.multiplayer_party_sessions;exception when duplicate_object then null;end$$;
do $$begin alter publication supabase_realtime add table public.multiplayer_party_messages;exception when duplicate_object then null;end$$;
notify pgrst,'reload schema';
commit;
