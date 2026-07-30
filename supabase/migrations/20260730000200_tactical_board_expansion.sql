begin;

alter table public.tactical_maps drop constraint if exists tactical_maps_location_id_key;
alter table public.tactical_maps add column if not exists map_type text not null default 'exploration';
alter table public.tactical_maps add column if not exists variant text not null default 'standard';
alter table public.tactical_maps add constraint tactical_maps_type_allowed check(map_type in('exploration','combat','dungeon'));
create unique index if not exists tactical_maps_location_type_variant_idx on public.tactical_maps(location_id,map_type,variant);

alter table public.tactical_map_tokens alter column character_id drop not null;
alter table public.tactical_map_tokens alter column user_id drop not null;
alter table public.tactical_map_tokens add column if not exists entity_type text not null default 'player';
alter table public.tactical_map_tokens add column if not exists vision_range integer not null default 4;
alter table public.tactical_map_tokens add column if not exists movement_range integer not null default 6;
alter table public.tactical_map_tokens add column if not exists is_hidden boolean not null default false;
alter table public.tactical_map_tokens add constraint tactical_tokens_entity_allowed check(entity_type in('player','companion','npc','enemy'));

create table if not exists public.tactical_fog_cells(
 id uuid primary key default gen_random_uuid(),map_id uuid not null references public.tactical_maps(id) on delete cascade,
 party_id uuid references public.multiplayer_parties(id) on delete cascade,owner_id uuid not null references auth.users(id) on delete cascade,
 x integer not null,y integer not null,revealed_at timestamptz not null default now(),unique(map_id,owner_id,x,y)
);
create table if not exists public.tactical_map_objects(
 id uuid primary key default gen_random_uuid(),map_id uuid not null references public.tactical_maps(id) on delete cascade,
 party_id uuid references public.multiplayer_parties(id) on delete cascade,owner_id uuid not null references auth.users(id) on delete cascade,
 object_type text not null,label text not null,x integer not null,y integer not null,is_hidden boolean not null default false,created_at timestamptz not null default now(),
 constraint tactical_object_type_allowed check(object_type in('door','trap','chest','marker','exit'))
);
create table if not exists public.tactical_dice_rolls(
 id uuid primary key default gen_random_uuid(),map_id uuid not null references public.tactical_maps(id) on delete cascade,
 party_id uuid references public.multiplayer_parties(id) on delete cascade,user_id uuid not null references auth.users(id) on delete cascade,
 roller_name text not null,die integer not null,raw_value integer not null,modifier integer not null,total integer not null,created_at timestamptz not null default now(),
 constraint tactical_die_allowed check(die in(4,6,8,10,12,20,100)),constraint tactical_modifier_range check(modifier between -20 and 20)
);

alter table public.tactical_fog_cells enable row level security;alter table public.tactical_map_objects enable row level security;alter table public.tactical_dice_rolls enable row level security;
create policy "tactical_fog_group_read" on public.tactical_fog_cells for select to authenticated using(owner_id=auth.uid() or(party_id is not null and public.is_party_member(party_id)));
create policy "tactical_objects_group_read" on public.tactical_map_objects for select to authenticated using(owner_id=auth.uid() or(party_id is not null and public.is_party_member(party_id)));
create policy "tactical_rolls_group_read" on public.tactical_dice_rolls for select to authenticated using(user_id=auth.uid() or(party_id is not null and public.is_party_member(party_id)));
revoke all on public.tactical_fog_cells,public.tactical_map_objects,public.tactical_dice_rolls from anon;revoke insert,update,delete on public.tactical_fog_cells,public.tactical_map_objects,public.tactical_dice_rolls from authenticated;
grant select on public.tactical_fog_cells,public.tactical_map_objects,public.tactical_dice_rolls to authenticated;

create or replace function public.is_tactical_game_master(p_map uuid) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.tactical_map_tokens t left join public.multiplayer_parties p on p.id=t.party_id where t.map_id=p_map and t.user_id=auth.uid() and(t.party_id is null or p.leader_id=auth.uid()))
$$;

create or replace function public.reveal_tactical_cell(p_map_id uuid,p_x integer,p_y integer) returns void language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid();v_party uuid;begin if not public.is_tactical_game_master(p_map_id) then raise exception 'game master required';end if;
select party_id into v_party from public.tactical_map_tokens where map_id=p_map_id and user_id=v_user limit 1;
insert into public.tactical_fog_cells(map_id,party_id,owner_id,x,y) values(p_map_id,v_party,v_user,p_x,p_y) on conflict(map_id,owner_id,x,y) do nothing;end$$;

create or replace function public.spawn_tactical_entity(p_map_id uuid,p_type text,p_label text,p_x integer,p_y integer) returns uuid language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid();v_party uuid;v_id uuid;begin if not public.is_tactical_game_master(p_map_id) then raise exception 'game master required';end if;if p_type not in('npc','enemy','companion') then raise exception 'invalid entity';end if;
select party_id into v_party from public.tactical_map_tokens where map_id=p_map_id and user_id=v_user limit 1;
insert into public.tactical_map_tokens(map_id,party_id,user_id,label,x,y,color,entity_type,is_hidden,vision_range,movement_range) values(p_map_id,v_party,v_user,left(trim(p_label),40),p_x,p_y,case p_type when'enemy'then'#d95050'when'npc'then'#d8a844'else'#5f7ee8'end,p_type,p_type='enemy',3,5) returning id into v_id;return v_id;end$$;

create or replace function public.place_tactical_object(p_map_id uuid,p_type text,p_label text,p_x integer,p_y integer,p_hidden boolean default false) returns uuid language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid();v_party uuid;v_id uuid;begin if not public.is_tactical_game_master(p_map_id) then raise exception 'game master required';end if;
select party_id into v_party from public.tactical_map_tokens where map_id=p_map_id and user_id=v_user limit 1;
insert into public.tactical_map_objects(map_id,party_id,owner_id,object_type,label,x,y,is_hidden) values(p_map_id,v_party,v_user,p_type,left(trim(p_label),50),p_x,p_y,p_hidden) returning id into v_id;return v_id;end$$;

create or replace function public.roll_tactical_die(p_map_id uuid,p_die integer,p_modifier integer default 0) returns public.tactical_dice_rolls language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid();v_party uuid;v_name text;v_raw integer;v_row public.tactical_dice_rolls;begin if p_die not in(4,6,8,10,12,20,100)or p_modifier not between -20 and 20 then raise exception 'invalid roll';end if;
select t.party_id,t.label into v_party,v_name from public.tactical_map_tokens t where t.map_id=p_map_id and t.user_id=v_user limit 1;if v_name is null then raise exception 'join map first';end if;v_raw:=floor(random()*p_die)::integer+1;
insert into public.tactical_dice_rolls(map_id,party_id,user_id,roller_name,die,raw_value,modifier,total) values(p_map_id,v_party,v_user,v_name,p_die,v_raw,p_modifier,v_raw+p_modifier) returning * into v_row;return v_row;end$$;

create or replace function public.move_tactical_token(p_token_id uuid,p_x integer,p_y integer) returns void language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid();v_token record;v_columns integer;v_rows integer;begin select t.*,m.grid_columns,m.grid_rows into v_token from public.tactical_map_tokens t join public.tactical_maps m on m.id=t.map_id where t.id=p_token_id;
if v_token.id is null or not(v_token.user_id=v_user or public.is_tactical_game_master(v_token.map_id))then raise exception 'token not controllable';end if;if p_x<0 or p_y<0 or p_x>=v_token.grid_columns or p_y>=v_token.grid_rows then raise exception 'position outside map';end if;
if greatest(abs(p_x-v_token.x),abs(p_y-v_token.y))>v_token.movement_range then raise exception 'movement range exceeded';end if;update public.tactical_map_tokens set x=p_x,y=p_y where id=p_token_id;end$$;

insert into public.tactical_maps(location_id,name,image_path,grid_columns,grid_rows,map_type,variant,status) values
('10000000-0000-4000-8000-000000000001','Silberhain · Mondkreis','/maps/silberhain-battlemap.png',24,24,'exploration','standard','published'),
('10000000-0000-4000-8000-000000000003','Aschgrat · Minenpass','/maps/aschgrat-battlemap.png',24,24,'combat','standard','published'),
('10000000-0000-4000-8000-000000000004','Nebelmoor · Versunkene Pfade','/maps/nebelmoor-battlemap.png',24,24,'exploration','standard','published')
on conflict(location_id,map_type,variant) do update set name=excluded.name,image_path=excluded.image_path,status='published';

revoke all on function public.is_tactical_game_master(uuid),public.reveal_tactical_cell(uuid,integer,integer),public.spawn_tactical_entity(uuid,text,text,integer,integer),public.place_tactical_object(uuid,text,text,integer,integer,boolean),public.roll_tactical_die(uuid,integer,integer) from public,anon;
grant execute on function public.is_tactical_game_master(uuid),public.reveal_tactical_cell(uuid,integer,integer),public.spawn_tactical_entity(uuid,text,text,integer,integer),public.place_tactical_object(uuid,text,text,integer,integer,boolean),public.roll_tactical_die(uuid,integer,integer) to authenticated;
do $$begin alter publication supabase_realtime add table public.tactical_fog_cells;exception when duplicate_object then null;end$$;
do $$begin alter publication supabase_realtime add table public.tactical_map_objects;exception when duplicate_object then null;end$$;
do $$begin alter publication supabase_realtime add table public.tactical_dice_rolls;exception when duplicate_object then null;end$$;
notify pgrst,'reload schema';commit;
