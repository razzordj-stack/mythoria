begin;
create table if not exists public.achievements(id text primary key,title text not null,description text not null,icon text not null,sort_order integer not null default 0);
create table if not exists public.character_achievements(id uuid primary key default gen_random_uuid(),character_id uuid not null references public.characters(id) on delete cascade,user_id uuid not null references auth.users(id) on delete cascade,achievement_id text not null references public.achievements(id) on delete cascade,unlocked_at timestamptz not null default now(),unique(character_id,achievement_id));
alter table public.achievements enable row level security; alter table public.character_achievements enable row level security;
create policy "achievements_read" on public.achievements for select to authenticated using(true);
create policy "character_achievements_select_own" on public.character_achievements for select to authenticated using((select auth.uid())=user_id);
revoke all on public.achievements,public.character_achievements from anon; grant select on public.achievements,public.character_achievements to authenticated;
insert into public.achievements(id,title,description,icon,sort_order) values
('first_steps','Erste Schritte','Entdecke den ersten Ort mit einem Charakter.','⌖',10),
('pathfinder','Pfadfinder','Entdecke drei unterschiedliche Orte mit einem Charakter.','✦',20),
('world_wanderer','Weltenwanderer','Entdecke alle sechs bekannten Orte Mythorias.','◇',30)
on conflict(id) do update set title=excluded.title,description=excluded.description,icon=excluded.icon,sort_order=excluded.sort_order;

create or replace function public.award_discovery_achievements()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_count integer;
begin
 select count(*) into v_count from public.character_location_discoveries where character_id=new.character_id;
 if v_count>=1 then insert into public.character_achievements(character_id,user_id,achievement_id) values(new.character_id,new.user_id,'first_steps') on conflict do nothing; end if;
 if v_count>=3 then insert into public.character_achievements(character_id,user_id,achievement_id) values(new.character_id,new.user_id,'pathfinder') on conflict do nothing; end if;
 if v_count>=6 then insert into public.character_achievements(character_id,user_id,achievement_id) values(new.character_id,new.user_id,'world_wanderer') on conflict do nothing; end if;
 return new;
end; $$;
drop trigger if exists discoveries_award_achievements on public.character_location_discoveries;
create trigger discoveries_award_achievements after insert on public.character_location_discoveries for each row execute function public.award_discovery_achievements();
insert into public.character_achievements(character_id,user_id,achievement_id)
select character_id,user_id,case when count(*)>=6 then 'world_wanderer' when count(*)>=3 then 'pathfinder' else 'first_steps' end from public.character_location_discoveries group by character_id,user_id on conflict do nothing;
insert into public.character_achievements(character_id,user_id,achievement_id)
select character_id,user_id,'first_steps' from public.character_location_discoveries group by character_id,user_id having count(*)>=3 on conflict do nothing;
insert into public.character_achievements(character_id,user_id,achievement_id)
select character_id,user_id,'pathfinder' from public.character_location_discoveries group by character_id,user_id having count(*)>=6 on conflict do nothing;
notify pgrst,'reload schema'; commit;
