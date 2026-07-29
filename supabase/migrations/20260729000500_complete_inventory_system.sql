begin;

alter table public.inventory_items
  add column if not exists equipment_slot text,
  add column if not exists magic_bonus integer not null default 0,
  add column if not exists health_bonus integer not null default 0,
  add column if not exists mana_bonus integer not null default 0,
  add column if not exists value integer not null default 0,
  add column if not exists image_url text;

alter table public.inventory_items
  drop constraint if exists inventory_items_rarity_allowed;

alter table public.inventory_items
  add constraint inventory_items_rarity_allowed
  check (rarity in ('common','uncommon','rare','epic','legendary','mythic')),
  add constraint inventory_items_equipment_slot_allowed
  check (equipment_slot is null or equipment_slot in ('head','chest','hands','legs','feet','main_hand','off_hand','ring_1','ring_2','amulet')),
  add constraint inventory_items_magic_bonus_nonnegative check (magic_bonus >= 0),
  add constraint inventory_items_health_bonus_nonnegative check (health_bonus >= 0),
  add constraint inventory_items_mana_bonus_nonnegative check (mana_bonus >= 0),
  add constraint inventory_items_value_nonnegative check (value >= 0);

create unique index if not exists inventory_items_unique_equipped_slot_idx
  on public.inventory_items(character_id, equipment_slot)
  where is_equipped = true and equipment_slot is not null;

create index if not exists inventory_items_character_type_idx
  on public.inventory_items(character_id, item_type);

notify pgrst, 'reload schema';
commit;
