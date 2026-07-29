begin;

create table if not exists public.companion_templates(
  id uuid primary key default gen_random_uuid(),slug text not null unique,name text not null,description text not null,
  companion_class text not null,role text not null,required_level integer not null default 1,recruitment_cost integer not null default 0,
  required_faction_id uuid references public.factions(id) on delete set null,required_reputation integer not null default 0,
  attack_bonus integer not null default 0,defense_bonus integer not null default 0,magic_bonus integer not null default 0,
  icon text not null default '♙',status text not null default 'published',sort_order integer not null default 0,
  constraint companion_template_values_valid check(required_level>=1 and recruitment_cost>=0 and required_reputation between -1000 and 1000),
  constraint companion_template_role_allowed check(role in('damage','tank','support','healer')),
  constraint companion_template_status_allowed check(status in('draft','published'))
);
create table if not exists public.character_companions(
  id uuid primary key default gen_random_uuid(),character_id uuid not null references public.characters(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,companion_id uuid not null references public.companion_templates(id) on delete restrict,
  loyalty integer not null default 0,party_slot integer,recruited_at timestamptz not null default now(),updated_at timestamptz not null default now(),
  unique(character_id,companion_id),constraint companion_loyalty_range check(loyalty between 0 and 100),
  constraint companion_party_slot_valid check(party_slot is null or party_slot between 1 and 2)
);
create unique index if not exists character_companions_unique_slot_idx on public.character_companions(character_id,party_slot) where party_slot is not null;
create index if not exists character_companions_character_idx on public.character_companions(character_id,recruited_at);
create trigger character_companions_set_updated_at before update on public.character_companions for each row execute function public.set_updated_at();
alter table public.companion_templates enable row level security;alter table public.character_companions enable row level security;
create policy "companion_templates_read" on public.companion_templates for select to authenticated using(status='published');
create policy "character_companions_own" on public.character_companions for select to authenticated using((select auth.uid())=user_id);
revoke all on public.companion_templates,public.character_companions from anon;
revoke insert,update,delete on public.companion_templates,public.character_companions from authenticated;
grant select on public.companion_templates,public.character_companions to authenticated;

insert into public.companion_templates(id,slug,name,description,companion_class,role,required_level,recruitment_cost,required_faction_id,required_reputation,attack_bonus,defense_bonus,magic_bonus,icon,sort_order) values
('60000000-0000-4000-8000-000000000001','lyra-waldpfad','Lyra Waldpfad','Eine ruhige Fährtenleserin, die Gefahren erkennt, bevor sie zuschlagen.','Waldläuferin','damage',1,45,null,0,3,1,0,'➶',10),
('60000000-0000-4000-8000-000000000002','brom-eisenfaust','Brom Eisenfaust','Ein erfahrener Schildträger mit trockenem Humor und unerschütterlicher Haltung.','Wächter','tank',1,55,null,0,1,4,0,'♜',20),
('60000000-0000-4000-8000-000000000003','selene-mondquell','Selene Mondquell','Eine wandernde Heilerin, deren Gebete selbst alte Wunden schließen.','Klerikerin','healer',2,80,'50000000-0000-4000-8000-000000000001',100,0,2,3,'✧',30),
('60000000-0000-4000-8000-000000000004','orik-runensprecher','Orik Runensprecher','Ein Gelehrter des Konvents, der Runen in Schutz und Zerstörung verwandelt.','Runenmagier','support',3,110,'50000000-0000-4000-8000-000000000003',100,0,1,5,'✦',40),
('60000000-0000-4000-8000-000000000005','kaela-grenzklinge','Kaela Grenzklinge','Eine Veteranin der Grenzmarken, die keinen Schritt kampflos preisgibt.','Kriegerin','damage',3,120,'50000000-0000-4000-8000-000000000002',100,5,2,0,'⚔',50),
('60000000-0000-4000-8000-000000000006','nox','Nox','Ein rätselhafter Schattenläufer, dessen Loyalität nur schwer zu gewinnen ist.','Schattenläufer','support',5,180,null,0,4,1,3,'◈',60)
on conflict(id) do update set name=excluded.name,description=excluded.description,companion_class=excluded.companion_class,role=excluded.role,required_level=excluded.required_level,recruitment_cost=excluded.recruitment_cost,required_faction_id=excluded.required_faction_id,required_reputation=excluded.required_reputation,attack_bonus=excluded.attack_bonus,defense_bonus=excluded.defense_bonus,magic_bonus=excluded.magic_bonus,icon=excluded.icon,sort_order=excluded.sort_order;

create or replace function public.recruit_companion(p_character_id uuid,p_companion_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid();v_character record;v_companion record;v_reputation integer:=0;
begin
 if v_user is null then raise exception 'authentication required';end if;
 select * into v_character from public.characters where id=p_character_id and user_id=v_user for update;if v_character.id is null then raise exception 'character not found';end if;
 select * into v_companion from public.companion_templates where id=p_companion_id and status='published';if v_companion.id is null then raise exception 'companion unavailable';end if;
 if v_character.level<v_companion.required_level then raise exception 'character level too low';end if;
 if v_companion.required_faction_id is not null then select reputation into v_reputation from public.character_reputation where character_id=p_character_id and faction_id=v_companion.required_faction_id;v_reputation:=coalesce(v_reputation,0);if v_reputation<v_companion.required_reputation then raise exception 'reputation too low';end if;end if;
 if v_character.gold<v_companion.recruitment_cost then raise exception 'not enough gold';end if;
 insert into public.character_companions(character_id,user_id,companion_id) values(p_character_id,v_user,p_companion_id) on conflict(character_id,companion_id) do nothing;
 if not found then raise exception 'companion already recruited';end if;
 update public.characters set gold=gold-v_companion.recruitment_cost where id=p_character_id;
end;$$;

create or replace function public.set_companion_party_status(p_character_companion_id uuid,p_active boolean)
returns void language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid();v_row record;v_slot integer;
begin
 if v_user is null then raise exception 'authentication required';end if;
 select * into v_row from public.character_companions where id=p_character_companion_id and user_id=v_user for update;if v_row.id is null then raise exception 'companion not found';end if;
 if not p_active then update public.character_companions set party_slot=null where id=v_row.id;return;end if;
 if v_row.party_slot is not null then return;end if;
 select slot into v_slot from generate_series(1,2) slot where not exists(select 1 from public.character_companions where character_id=v_row.character_id and party_slot=slot) order by slot limit 1;
 if v_slot is null then raise exception 'party is full';end if;update public.character_companions set party_slot=v_slot where id=v_row.id;
end;$$;

create or replace function public.dismiss_companion(p_character_companion_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid();begin if v_user is null then raise exception 'authentication required';end if;delete from public.character_companions where id=p_character_companion_id and user_id=v_user;if not found then raise exception 'companion not found';end if;end;$$;

create or replace function public.combat_increases_companion_loyalty() returns trigger language plpgsql security definer set search_path=public as $$
begin if new.status='victory' and old.status is distinct from 'victory' then update public.character_companions set loyalty=least(100,loyalty+2) where character_id=new.character_id and user_id=new.user_id and party_slot is not null;end if;return new;end;$$;
drop trigger if exists combat_companion_loyalty on public.combat_sessions;
create trigger combat_companion_loyalty after update of status on public.combat_sessions for each row execute function public.combat_increases_companion_loyalty();

revoke all on function public.recruit_companion(uuid,uuid),public.set_companion_party_status(uuid,boolean),public.dismiss_companion(uuid),public.combat_increases_companion_loyalty() from public,anon;
grant execute on function public.recruit_companion(uuid,uuid),public.set_companion_party_status(uuid,boolean),public.dismiss_companion(uuid) to authenticated;
notify pgrst,'reload schema';commit;
