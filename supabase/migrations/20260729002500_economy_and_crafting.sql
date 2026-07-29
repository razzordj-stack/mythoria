begin;

create table if not exists public.merchants(
  id uuid primary key default gen_random_uuid(),slug text not null unique,name text not null,description text not null,
  location_id uuid references public.world_locations(id) on delete set null,price_modifier numeric(4,2) not null default 1,
  icon text not null default '⚖',status text not null default 'published',created_at timestamptz not null default now(),
  constraint merchants_price_valid check(price_modifier between 0.50 and 2.00),constraint merchants_status_allowed check(status in('draft','published'))
);
create table if not exists public.merchant_items(
  id uuid primary key default gen_random_uuid(),merchant_id uuid not null references public.merchants(id) on delete cascade,
  name text not null,description text not null,item_type text not null,rarity text not null default 'common',price integer not null,
  stock integer,attack_bonus integer not null default 0,defense_bonus integer not null default 0,magic_bonus integer not null default 0,
  health_bonus integer not null default 0,mana_bonus integer not null default 0,equipment_slot text,image_url text,sort_order integer not null default 0,
  constraint merchant_items_price_valid check(price>0),constraint merchant_items_stock_valid check(stock is null or stock>=0),
  constraint merchant_items_rarity_allowed check(rarity in('common','uncommon','rare','epic','legendary','mythic'))
);
create table if not exists public.crafting_recipes(
  id uuid primary key default gen_random_uuid(),name text not null,description text not null,required_level integer not null default 1,gold_cost integer not null default 0,
  result_name text not null,result_description text not null,result_item_type text not null,result_rarity text not null default 'common',
  result_attack_bonus integer not null default 0,result_defense_bonus integer not null default 0,result_magic_bonus integer not null default 0,
  result_health_bonus integer not null default 0,result_mana_bonus integer not null default 0,result_value integer not null default 0,result_equipment_slot text,
  icon text not null default '⚒',status text not null default 'published',sort_order integer not null default 0,
  constraint crafting_recipe_values_valid check(required_level>=1 and gold_cost>=0 and result_value>=0),constraint crafting_recipe_status_allowed check(status in('draft','published'))
);
create table if not exists public.recipe_ingredients(
  recipe_id uuid not null references public.crafting_recipes(id) on delete cascade,item_name text not null,quantity integer not null,
  primary key(recipe_id,item_name),constraint recipe_ingredient_quantity_valid check(quantity>0)
);
create table if not exists public.economy_transactions(
  id bigint generated always as identity primary key,character_id uuid not null references public.characters(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,kind text not null,item_name text not null,quantity integer not null default 1,
  gold_change integer not null,created_at timestamptz not null default now(),constraint economy_kind_allowed check(kind in('buy','sell','craft'))
);
create index if not exists merchant_items_merchant_idx on public.merchant_items(merchant_id,sort_order);
create index if not exists economy_transactions_character_idx on public.economy_transactions(character_id,created_at desc);

alter table public.merchants enable row level security;alter table public.merchant_items enable row level security;
alter table public.crafting_recipes enable row level security;alter table public.recipe_ingredients enable row level security;alter table public.economy_transactions enable row level security;
create policy "merchants_read" on public.merchants for select to authenticated using(status='published');
create policy "merchant_items_read" on public.merchant_items for select to authenticated using(exists(select 1 from public.merchants m where m.id=merchant_id and m.status='published'));
create policy "recipes_read" on public.crafting_recipes for select to authenticated using(status='published');
create policy "recipe_ingredients_read" on public.recipe_ingredients for select to authenticated using(exists(select 1 from public.crafting_recipes r where r.id=recipe_id and r.status='published'));
create policy "economy_transactions_own" on public.economy_transactions for select to authenticated using((select auth.uid())=user_id);
revoke all on public.merchants,public.merchant_items,public.crafting_recipes,public.recipe_ingredients,public.economy_transactions from anon;
revoke insert,update,delete on public.merchants,public.merchant_items,public.crafting_recipes,public.recipe_ingredients,public.economy_transactions from authenticated;
grant select on public.merchants,public.merchant_items,public.crafting_recipes,public.recipe_ingredients,public.economy_transactions to authenticated;

insert into public.merchants(id,slug,name,description,location_id,price_modifier,icon) values
('40000000-0000-4000-8000-000000000001','goldener-amboss','Der Goldene Amboss','Mira Eisenblatt handelt mit Reisebedarf, Waffen und seltenen Werkstoffen.','10000000-0000-4000-8000-000000000002',1.00,'⚖')
on conflict(id) do update set name=excluded.name,description=excluded.description,location_id=excluded.location_id,price_modifier=excluded.price_modifier,icon=excluded.icon;

insert into public.merchant_items(id,merchant_id,name,description,item_type,rarity,price,stock,attack_bonus,defense_bonus,magic_bonus,health_bonus,mana_bonus,equipment_slot,sort_order) values
('41000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','Kräuterbündel','Frische Heilkräuter für Tränke und Salben.','material','common',8,99,0,0,0,0,0,null,10),
('41000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000001','Leere Phiole','Eine saubere Glasphiole für alchemistische Erzeugnisse.','material','common',6,99,0,0,0,0,0,null,20),
('41000000-0000-4000-8000-000000000003','40000000-0000-4000-8000-000000000001','Eisenbarren','Solides Metall für Waffen und Rüstung.','material','common',16,60,0,0,0,0,0,null,30),
('41000000-0000-4000-8000-000000000004','40000000-0000-4000-8000-000000000001','Heiltrank','Stellt im Kampf mindestens 25 Lebenspunkte wieder her.','potion','common',32,30,0,0,0,30,0,null,40),
('41000000-0000-4000-8000-000000000005','40000000-0000-4000-8000-000000000001','Manatrank','Stellt arkane Reserven wieder her.','potion','uncommon',42,20,0,0,0,0,25,null,50),
('41000000-0000-4000-8000-000000000006','40000000-0000-4000-8000-000000000001','Eisenschwert','Eine verlässliche Klinge für angehende Helden.','weapon','common',85,8,3,0,0,0,0,'main_hand',60),
('41000000-0000-4000-8000-000000000007','40000000-0000-4000-8000-000000000001','Verstärkte Lederweste','Leichte Rüstung mit solider Beweglichkeit.','armor','uncommon',110,6,0,4,0,5,0,'chest',70)
on conflict(id) do update set name=excluded.name,description=excluded.description,item_type=excluded.item_type,rarity=excluded.rarity,price=excluded.price,stock=excluded.stock,attack_bonus=excluded.attack_bonus,defense_bonus=excluded.defense_bonus,magic_bonus=excluded.magic_bonus,health_bonus=excluded.health_bonus,mana_bonus=excluded.mana_bonus,equipment_slot=excluded.equipment_slot,sort_order=excluded.sort_order;

insert into public.crafting_recipes(id,name,description,required_level,gold_cost,result_name,result_description,result_item_type,result_rarity,result_attack_bonus,result_defense_bonus,result_magic_bonus,result_health_bonus,result_mana_bonus,result_value,result_equipment_slot,icon,sort_order) values
('42000000-0000-4000-8000-000000000001','Heiltrank brauen','Verarbeitet Heilkräuter zu einem zuverlässigen Trank.',1,4,'Heiltrank','Ein frisch gebrauter Heiltrank.','potion','common',0,0,0,30,0,24,null,'⚗',10),
('42000000-0000-4000-8000-000000000002','Manatrank destillieren','Bindet arkane Energie in einer klaren Essenz.',2,10,'Manatrank','Ein Trank mit konzentrierter Manaessenz.','potion','uncommon',0,0,0,0,25,34,null,'◇',20),
('42000000-0000-4000-8000-000000000003','Runenklinge schmieden','Verbindet Eisen mit einem arkanen Runensplitter.',3,28,'Runenklinge','Eine geschmiedete Klinge mit leuchtender Rune.','weapon','rare',5,0,2,0,0,95,'main_hand','⚔',30)
on conflict(id) do update set name=excluded.name,description=excluded.description,required_level=excluded.required_level,gold_cost=excluded.gold_cost,result_name=excluded.result_name,result_description=excluded.result_description,result_item_type=excluded.result_item_type,result_rarity=excluded.result_rarity,result_attack_bonus=excluded.result_attack_bonus,result_defense_bonus=excluded.result_defense_bonus,result_magic_bonus=excluded.result_magic_bonus,result_health_bonus=excluded.result_health_bonus,result_mana_bonus=excluded.result_mana_bonus,result_value=excluded.result_value,result_equipment_slot=excluded.result_equipment_slot,icon=excluded.icon,sort_order=excluded.sort_order;
insert into public.recipe_ingredients(recipe_id,item_name,quantity) values
('42000000-0000-4000-8000-000000000001','Kräuterbündel',2),('42000000-0000-4000-8000-000000000001','Leere Phiole',1),
('42000000-0000-4000-8000-000000000002','Kräuterbündel',1),('42000000-0000-4000-8000-000000000002','Leere Phiole',1),('42000000-0000-4000-8000-000000000002','Runensplitter',1),
('42000000-0000-4000-8000-000000000003','Eisenbarren',2),('42000000-0000-4000-8000-000000000003','Runensplitter',1)
on conflict(recipe_id,item_name) do update set quantity=excluded.quantity;

create or replace function public.buy_merchant_item(p_character_id uuid,p_merchant_item_id uuid,p_quantity integer default 1)
returns void language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid();v_character record;v_item record;v_modifier numeric;v_discount numeric;v_total integer;
begin
 if v_user is null then raise exception 'authentication required';end if;if p_quantity not between 1 and 20 then raise exception 'invalid quantity';end if;
 select * into v_character from public.characters where id=p_character_id and user_id=v_user for update;if v_character.id is null then raise exception 'character not found';end if;
 select mi.*,m.price_modifier into v_item from public.merchant_items mi join public.merchants m on m.id=mi.merchant_id where mi.id=p_merchant_item_id and m.status='published' for update of mi;
 if v_item.id is null then raise exception 'merchant item unavailable';end if;if v_item.stock is not null and v_item.stock<p_quantity then raise exception 'not enough stock';end if;
 v_discount:=least(.15,greatest(0,(coalesce(v_character.charisma,10)-10)*.01));v_total:=ceil(v_item.price*v_item.price_modifier*(1-v_discount)*p_quantity)::integer;
 if v_character.gold<v_total then raise exception 'not enough gold';end if;
 update public.characters set gold=gold-v_total where id=p_character_id;
 if v_item.stock is not null then update public.merchant_items set stock=stock-p_quantity where id=v_item.id;end if;
 update public.inventory_items set quantity=quantity+p_quantity where id=(select id from public.inventory_items where character_id=p_character_id and user_id=v_user and name=v_item.name and item_type=v_item.item_type and rarity=v_item.rarity and is_equipped=false limit 1);
 if not found then insert into public.inventory_items(character_id,user_id,name,description,item_type,rarity,quantity,is_equipped,equipment_slot,attack_bonus,defense_bonus,magic_bonus,health_bonus,mana_bonus,value)
 values(p_character_id,v_user,v_item.name,v_item.description,v_item.item_type,v_item.rarity,p_quantity,false,v_item.equipment_slot,v_item.attack_bonus,v_item.defense_bonus,v_item.magic_bonus,v_item.health_bonus,v_item.mana_bonus,v_item.price);end if;
 insert into public.economy_transactions(character_id,user_id,kind,item_name,quantity,gold_change) values(p_character_id,v_user,'buy',v_item.name,p_quantity,-v_total);
end;$$;

create or replace function public.sell_inventory_item(p_character_id uuid,p_item_id uuid,p_quantity integer default 1)
returns void language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid();v_character record;v_item record;v_bonus numeric;v_total integer;
begin
 if v_user is null then raise exception 'authentication required';end if;if p_quantity not between 1 and 20 then raise exception 'invalid quantity';end if;
 select * into v_character from public.characters where id=p_character_id and user_id=v_user for update;if v_character.id is null then raise exception 'character not found';end if;
 select * into v_item from public.inventory_items where id=p_item_id and character_id=p_character_id and user_id=v_user for update;
 if v_item.id is null or v_item.is_equipped then raise exception 'item unavailable for sale';end if;if v_item.quantity<p_quantity then raise exception 'not enough items';end if;
 v_bonus:=least(.15,greatest(0,(coalesce(v_character.charisma,10)-10)*.01));v_total:=greatest(1,floor(greatest(v_item.value,1)*.5*(1+v_bonus)*p_quantity)::integer);
 if v_item.quantity=p_quantity then delete from public.inventory_items where id=v_item.id;else update public.inventory_items set quantity=quantity-p_quantity where id=v_item.id;end if;
 update public.characters set gold=gold+v_total where id=p_character_id;insert into public.economy_transactions(character_id,user_id,kind,item_name,quantity,gold_change) values(p_character_id,v_user,'sell',v_item.name,p_quantity,v_total);
end;$$;

create or replace function public.craft_character_item(p_character_id uuid,p_recipe_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid();v_character record;v_recipe record;v_ingredient record;v_stack record;v_remaining integer;
begin
 if v_user is null then raise exception 'authentication required';end if;select * into v_character from public.characters where id=p_character_id and user_id=v_user for update;if v_character.id is null then raise exception 'character not found';end if;
 select * into v_recipe from public.crafting_recipes where id=p_recipe_id and status='published';if v_recipe.id is null then raise exception 'recipe unavailable';end if;
 if v_character.level<v_recipe.required_level then raise exception 'character level too low';end if;if v_character.gold<v_recipe.gold_cost then raise exception 'not enough gold';end if;
 for v_ingredient in select * from public.recipe_ingredients where recipe_id=p_recipe_id loop
  if coalesce((select sum(quantity) from public.inventory_items where character_id=p_character_id and user_id=v_user and name=v_ingredient.item_name),0)<v_ingredient.quantity then raise exception 'missing ingredient: %',v_ingredient.item_name;end if;
 end loop;
 for v_ingredient in select * from public.recipe_ingredients where recipe_id=p_recipe_id loop
  v_remaining:=v_ingredient.quantity;
  for v_stack in select id,quantity from public.inventory_items where character_id=p_character_id and user_id=v_user and name=v_ingredient.item_name order by quantity for update loop
   exit when v_remaining=0;if v_stack.quantity<=v_remaining then v_remaining:=v_remaining-v_stack.quantity;delete from public.inventory_items where id=v_stack.id;else update public.inventory_items set quantity=quantity-v_remaining where id=v_stack.id;v_remaining:=0;end if;
  end loop;
 end loop;
 update public.characters set gold=gold-v_recipe.gold_cost where id=p_character_id;
 update public.inventory_items set quantity=quantity+1 where id=(select id from public.inventory_items where character_id=p_character_id and user_id=v_user and name=v_recipe.result_name and item_type=v_recipe.result_item_type and rarity=v_recipe.result_rarity and is_equipped=false limit 1);
 if not found then insert into public.inventory_items(character_id,user_id,name,description,item_type,rarity,quantity,is_equipped,equipment_slot,attack_bonus,defense_bonus,magic_bonus,health_bonus,mana_bonus,value)
 values(p_character_id,v_user,v_recipe.result_name,v_recipe.result_description,v_recipe.result_item_type,v_recipe.result_rarity,1,false,v_recipe.result_equipment_slot,v_recipe.result_attack_bonus,v_recipe.result_defense_bonus,v_recipe.result_magic_bonus,v_recipe.result_health_bonus,v_recipe.result_mana_bonus,v_recipe.result_value);end if;
 insert into public.economy_transactions(character_id,user_id,kind,item_name,quantity,gold_change) values(p_character_id,v_user,'craft',v_recipe.result_name,1,-v_recipe.gold_cost);
end;$$;

revoke all on function public.buy_merchant_item(uuid,uuid,integer),public.sell_inventory_item(uuid,uuid,integer),public.craft_character_item(uuid,uuid) from public,anon;
grant execute on function public.buy_merchant_item(uuid,uuid,integer),public.sell_inventory_item(uuid,uuid,integer),public.craft_character_item(uuid,uuid) to authenticated;
notify pgrst,'reload schema';commit;
