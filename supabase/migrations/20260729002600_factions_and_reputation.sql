begin;

create table if not exists public.factions(
  id uuid primary key default gen_random_uuid(),slug text not null unique,name text not null,description text not null,
  region text not null,icon text not null default '◆',color text not null default '#8f927b',status text not null default 'published',sort_order integer not null default 0,
  constraint factions_status_allowed check(status in('draft','published'))
);
create table if not exists public.character_reputation(
  id uuid primary key default gen_random_uuid(),character_id uuid not null references public.characters(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,faction_id uuid not null references public.factions(id) on delete cascade,
  reputation integer not null default 0,updated_at timestamptz not null default now(),unique(character_id,faction_id),
  constraint character_reputation_range check(reputation between -1000 and 1000)
);
create table if not exists public.reputation_events(
  id bigint generated always as identity primary key,character_id uuid not null references public.characters(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,faction_id uuid not null references public.factions(id) on delete cascade,
  amount integer not null,source_type text not null,source_id uuid not null,description text not null,created_at timestamptz not null default now(),
  unique(character_id,faction_id,source_type,source_id),constraint reputation_event_amount_valid check(amount between -250 and 250),
  constraint reputation_event_source_allowed check(source_type in('quest','combat','admin','story'))
);
create index if not exists character_reputation_user_idx on public.character_reputation(user_id,character_id);
create index if not exists reputation_events_character_idx on public.reputation_events(character_id,created_at desc);
create trigger character_reputation_set_updated_at before update on public.character_reputation for each row execute function public.set_updated_at();

alter table public.factions enable row level security;alter table public.character_reputation enable row level security;alter table public.reputation_events enable row level security;
create policy "factions_read" on public.factions for select to authenticated using(status='published');
create policy "character_reputation_own" on public.character_reputation for select to authenticated using((select auth.uid())=user_id);
create policy "reputation_events_own" on public.reputation_events for select to authenticated using((select auth.uid())=user_id);
revoke all on public.factions,public.character_reputation,public.reputation_events from anon;
revoke insert,update,delete on public.factions,public.character_reputation,public.reputation_events from authenticated;
grant select on public.factions,public.character_reputation,public.reputation_events to authenticated;

insert into public.factions(id,slug,name,description,region,icon,color,sort_order) values
('50000000-0000-4000-8000-000000000001','krone-von-avelorn','Krone von Avelorn','Die königliche Ordnung schützt Städte, Straßen und die alten Bündnisse Avelorns.','Königreich Avelorn','♛','#d8a844',10),
('50000000-0000-4000-8000-000000000002','waechter-der-grenzmarken','Wächter der Grenzmarken','Späher, Soldaten und Kundschafter halten die Gefahren des Ostens zurück.','Die Grenzmarken','♜','#73a942',20),
('50000000-0000-4000-8000-000000000003','arkaner-konvent','Arkaner Konvent','Ein Bund aus Gelehrten, Runenmeistern und Hütern gefährlichen Wissens.','Königreich Avelorn','✦','#8659bd',30)
on conflict(id) do update set name=excluded.name,description=excluded.description,region=excluded.region,icon=excluded.icon,color=excluded.color,sort_order=excluded.sort_order;

alter table public.quests add column if not exists faction_id uuid references public.factions(id) on delete set null;
alter table public.enemies add column if not exists reputation_faction_id uuid references public.factions(id) on delete set null;
alter table public.merchants add column if not exists faction_id uuid references public.factions(id) on delete set null;
update public.quests set faction_id=case id when '10000000-0000-4000-8000-000000000001' then '50000000-0000-4000-8000-000000000002'::uuid when '10000000-0000-4000-8000-000000000002' then '50000000-0000-4000-8000-000000000001'::uuid when '10000000-0000-4000-8000-000000000003' then '50000000-0000-4000-8000-000000000003'::uuid else faction_id end;
update public.enemies set reputation_faction_id=case when level<=3 then '50000000-0000-4000-8000-000000000002'::uuid else '50000000-0000-4000-8000-000000000003'::uuid end;
update public.merchants set faction_id='50000000-0000-4000-8000-000000000001' where id='40000000-0000-4000-8000-000000000001';

create or replace function public.reputation_tier(p_reputation integer)
returns text language sql immutable strict set search_path='' as $$select case when p_reputation<=-500 then 'hostile' when p_reputation<=-100 then 'unfriendly' when p_reputation<100 then 'neutral' when p_reputation<300 then 'friendly' when p_reputation<600 then 'honored' else 'revered' end$$;

create or replace function public.award_character_reputation(p_character_id uuid,p_user_id uuid,p_faction_id uuid,p_amount integer,p_source_type text,p_source_id uuid,p_description text)
returns void language plpgsql security definer set search_path=public as $$
declare v_inserted integer;
begin
 if p_faction_id is null or p_amount=0 then return;end if;
 insert into public.reputation_events(character_id,user_id,faction_id,amount,source_type,source_id,description)
 values(p_character_id,p_user_id,p_faction_id,least(250,greatest(-250,p_amount)),p_source_type,p_source_id,p_description) on conflict do nothing;
 get diagnostics v_inserted=row_count;
 if v_inserted=1 then insert into public.character_reputation(character_id,user_id,faction_id,reputation) values(p_character_id,p_user_id,p_faction_id,least(1000,greatest(-1000,p_amount)))
 on conflict(character_id,faction_id) do update set reputation=least(1000,greatest(-1000,public.character_reputation.reputation+excluded.reputation)),updated_at=now();end if;
end;$$;

create or replace function public.quest_awards_reputation() returns trigger language plpgsql security definer set search_path=public as $$
declare v_faction uuid;v_title text;v_amount integer;
begin
 if new.status='completed' and old.status is distinct from 'completed' then
  select faction_id,title,case difficulty when 'easy' then 20 when 'normal' then 35 when 'hard' then 55 else 75 end into v_faction,v_title,v_amount from public.quests where id=new.quest_id;
  perform public.award_character_reputation(new.character_id,new.user_id,v_faction,v_amount,'quest',new.id,'Quest abgeschlossen: '||v_title);
 end if;return new;
end;$$;
drop trigger if exists character_quests_award_reputation on public.character_quests;
create trigger character_quests_award_reputation after update of status on public.character_quests for each row execute function public.quest_awards_reputation();

create or replace function public.combat_awards_reputation() returns trigger language plpgsql security definer set search_path=public as $$
declare v_faction uuid;v_name text;v_amount integer;
begin
 if new.status='victory' and old.status is distinct from 'victory' then
  select reputation_faction_id,name,least(25,5+level*2) into v_faction,v_name,v_amount from public.enemies where id=new.enemy_id;
  perform public.award_character_reputation(new.character_id,new.user_id,v_faction,v_amount,'combat',new.id,'Sieg über '||v_name);
 end if;return new;
end;$$;
drop trigger if exists combat_sessions_award_reputation on public.combat_sessions;
create trigger combat_sessions_award_reputation after update of status on public.combat_sessions for each row execute function public.combat_awards_reputation();

create or replace function public.buy_merchant_item(p_character_id uuid,p_merchant_item_id uuid,p_quantity integer default 1)
returns void language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid();v_character record;v_item record;v_discount numeric;v_reputation integer:=0;v_reputation_discount numeric:=0;v_total integer;
begin
 if v_user is null then raise exception 'authentication required';end if;if p_quantity not between 1 and 20 then raise exception 'invalid quantity';end if;
 select * into v_character from public.characters where id=p_character_id and user_id=v_user for update;if v_character.id is null then raise exception 'character not found';end if;
 select mi.*,m.price_modifier,m.faction_id into v_item from public.merchant_items mi join public.merchants m on m.id=mi.merchant_id where mi.id=p_merchant_item_id and m.status='published' for update of mi;
 if v_item.id is null then raise exception 'merchant item unavailable';end if;if v_item.stock is not null and v_item.stock<p_quantity then raise exception 'not enough stock';end if;
 if v_item.faction_id is not null then select coalesce(reputation,0) into v_reputation from public.character_reputation where character_id=p_character_id and faction_id=v_item.faction_id;end if;
 v_discount:=least(.15,greatest(0,(coalesce(v_character.charisma,10)-10)*.01));v_reputation_discount:=least(.10,greatest(0,coalesce(v_reputation,0))/5000.0);
 v_total:=ceil(v_item.price*v_item.price_modifier*(1-v_discount-v_reputation_discount)*p_quantity)::integer;
 if v_character.gold<v_total then raise exception 'not enough gold';end if;update public.characters set gold=gold-v_total where id=p_character_id;
 if v_item.stock is not null then update public.merchant_items set stock=stock-p_quantity where id=v_item.id;end if;
 update public.inventory_items set quantity=quantity+p_quantity where id=(select id from public.inventory_items where character_id=p_character_id and user_id=v_user and name=v_item.name and item_type=v_item.item_type and rarity=v_item.rarity and is_equipped=false limit 1);
 if not found then insert into public.inventory_items(character_id,user_id,name,description,item_type,rarity,quantity,is_equipped,equipment_slot,attack_bonus,defense_bonus,magic_bonus,health_bonus,mana_bonus,value) values(p_character_id,v_user,v_item.name,v_item.description,v_item.item_type,v_item.rarity,p_quantity,false,v_item.equipment_slot,v_item.attack_bonus,v_item.defense_bonus,v_item.magic_bonus,v_item.health_bonus,v_item.mana_bonus,v_item.price);end if;
 insert into public.economy_transactions(character_id,user_id,kind,item_name,quantity,gold_change) values(p_character_id,v_user,'buy',v_item.name,p_quantity,-v_total);
end;$$;

revoke all on function public.reputation_tier(integer),public.award_character_reputation(uuid,uuid,uuid,integer,text,uuid,text),public.quest_awards_reputation(),public.combat_awards_reputation() from public,anon,authenticated;
grant execute on function public.reputation_tier(integer) to authenticated;
notify pgrst,'reload schema';commit;
