begin;

create table if not exists public.tactical_maps (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null unique references public.world_locations(id) on delete cascade,
  name text not null,
  image_path text not null,
  grid_columns integer not null default 24 check(grid_columns between 8 and 60),
  grid_rows integer not null default 24 check(grid_rows between 8 and 60),
  status text not null default 'published' check(status in('draft','published')),
  created_at timestamptz not null default now()
);

create table if not exists public.tactical_map_tokens (
  id uuid primary key default gen_random_uuid(),
  map_id uuid not null references public.tactical_maps(id) on delete cascade,
  party_id uuid references public.multiplayer_parties(id) on delete cascade,
  character_id uuid not null references public.characters(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  x integer not null default 12 check(x between 0 and 59),
  y integer not null default 12 check(y between 0 and 59),
  color text not null default '#b9ff38' check(color ~ '^#[0-9a-fA-F]{6}$'),
  updated_at timestamptz not null default now(),
  unique(map_id,character_id)
);

create index if not exists tactical_map_tokens_map_idx on public.tactical_map_tokens(map_id);
drop trigger if exists tactical_map_tokens_set_updated_at on public.tactical_map_tokens;
create trigger tactical_map_tokens_set_updated_at before update on public.tactical_map_tokens
for each row execute function public.set_updated_at();

alter table public.tactical_maps enable row level security;
alter table public.tactical_map_tokens enable row level security;
create policy "tactical_maps_authenticated_read" on public.tactical_maps for select to authenticated using(status='published');
create policy "tactical_tokens_group_read" on public.tactical_map_tokens for select to authenticated
using(user_id=(select auth.uid()) or (party_id is not null and public.is_party_member(party_id)));

revoke all on public.tactical_maps,public.tactical_map_tokens from anon;
revoke insert,update,delete on public.tactical_maps,public.tactical_map_tokens from authenticated;
grant select on public.tactical_maps,public.tactical_map_tokens to authenticated;

insert into public.tactical_maps(location_id,name,image_path,grid_columns,grid_rows,status)
values('10000000-0000-4000-8000-000000000002','Kronenwacht · Marktplatz','/maps/kronenwacht-battlemap.png',24,24,'published')
on conflict(location_id) do update set name=excluded.name,image_path=excluded.image_path,grid_columns=excluded.grid_columns,grid_rows=excluded.grid_rows,status=excluded.status;

create or replace function public.join_tactical_map(p_map_id uuid,p_character_id uuid) returns uuid
language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid();v_location uuid;v_party uuid;v_token uuid;v_count integer;v_name text;
begin
  if v_user is null then raise exception 'authentication required';end if;
  select location_id into v_location from public.tactical_maps where id=p_map_id and status='published';
  if v_location is null then raise exception 'map not found';end if;
  select name into v_name from public.characters where id=p_character_id and user_id=v_user and current_location_id=v_location;
  if v_name is null then raise exception 'character is not at this location';end if;
  select party_id into v_party from public.multiplayer_party_members where character_id=p_character_id and user_id=v_user limit 1;
  select count(*) into v_count from public.tactical_map_tokens where map_id=p_map_id;
  insert into public.tactical_map_tokens(map_id,party_id,character_id,user_id,label,x,y,color)
  values(p_map_id,v_party,p_character_id,v_user,v_name,10+(v_count%5),18+(v_count/5),case v_count%4 when 0 then '#b9ff38' when 1 then '#d8a844' when 2 then '#5f7ee8' else '#d95050' end)
  on conflict(map_id,character_id) do update set party_id=excluded.party_id,label=excluded.label returning id into v_token;
  return v_token;
end;$$;

create or replace function public.move_tactical_token(p_token_id uuid,p_x integer,p_y integer) returns void
language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid();v_columns integer;v_rows integer;
begin
  select m.grid_columns,m.grid_rows into v_columns,v_rows from public.tactical_map_tokens t join public.tactical_maps m on m.id=t.map_id where t.id=p_token_id and t.user_id=v_user;
  if v_columns is null then raise exception 'token not found';end if;
  if p_x<0 or p_y<0 or p_x>=v_columns or p_y>=v_rows then raise exception 'position outside map';end if;
  update public.tactical_map_tokens set x=p_x,y=p_y where id=p_token_id and user_id=v_user;
end;$$;

revoke all on function public.join_tactical_map(uuid,uuid),public.move_tactical_token(uuid,integer,integer) from public,anon;
grant execute on function public.join_tactical_map(uuid,uuid),public.move_tactical_token(uuid,integer,integer) to authenticated;

do $$begin
  alter publication supabase_realtime add table public.tactical_map_tokens;
exception when duplicate_object then null;
end$$;

notify pgrst,'reload schema';
commit;
