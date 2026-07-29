begin;
create table if not exists public.character_location_discoveries(
 id uuid primary key default gen_random_uuid(), character_id uuid not null references public.characters(id) on delete cascade,
 location_id uuid not null references public.world_locations(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade, discovered_at timestamptz not null default now(),
 unique(character_id,location_id)
);
create index if not exists character_location_discoveries_user_idx on public.character_location_discoveries(user_id,character_id,discovered_at desc);
alter table public.character_location_discoveries enable row level security;
create policy "location_discoveries_select_own" on public.character_location_discoveries for select to authenticated using((select auth.uid())=user_id);
revoke all on public.character_location_discoveries from anon;
grant select on public.character_location_discoveries to authenticated;

insert into public.character_location_discoveries(character_id,location_id,user_id)
select id,current_location_id,user_id from public.characters where current_location_id is not null
on conflict(character_id,location_id) do nothing;

create or replace function public.record_character_location_discovery()
returns trigger language plpgsql security definer set search_path=public as $$
begin
 if new.current_location_id is not null then
  insert into public.character_location_discoveries(character_id,location_id,user_id)
  values(new.id,new.current_location_id,new.user_id) on conflict(character_id,location_id) do nothing;
 end if;
 return new;
end; $$;
drop trigger if exists characters_record_location_discovery on public.characters;
create trigger characters_record_location_discovery after insert or update of current_location_id on public.characters
for each row execute function public.record_character_location_discovery();
notify pgrst,'reload schema';
commit;
