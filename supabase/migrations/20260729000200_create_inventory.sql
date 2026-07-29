begin;

create table if not exists public.inventory_items (
    id uuid primary key default gen_random_uuid(),
    character_id uuid not null
        references public.characters(id) on delete cascade,
    user_id uuid not null
        references auth.users(id) on delete cascade,
    name text not null,
    description text,
    item_type text not null,
    rarity text not null default 'common',
    quantity integer not null default 1,
    is_equipped boolean not null default false,
    attack_bonus integer not null default 0,
    defense_bonus integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint inventory_items_name_not_empty
        check (length(trim(name)) > 0),
    constraint inventory_items_type_not_empty
        check (length(trim(item_type)) > 0),
    constraint inventory_items_rarity_not_empty
        check (length(trim(rarity)) > 0),
    constraint inventory_items_quantity_positive
        check (quantity > 0),
    constraint inventory_items_attack_bonus_nonnegative
        check (attack_bonus >= 0),
    constraint inventory_items_defense_bonus_nonnegative
        check (defense_bonus >= 0)
);

create index if not exists inventory_items_character_id_idx
    on public.inventory_items(character_id);

create index if not exists inventory_items_user_id_idx
    on public.inventory_items(user_id);

alter table public.inventory_items enable row level security;

drop policy if exists "inventory_select_own_characters"
    on public.inventory_items;
create policy "inventory_select_own_characters"
    on public.inventory_items
    for select
    to authenticated
    using (
        user_id = auth.uid()
        and exists (
            select 1
            from public.characters
            where characters.id = inventory_items.character_id
              and characters.user_id = auth.uid()
        )
    );

drop policy if exists "inventory_insert_own_characters"
    on public.inventory_items;
create policy "inventory_insert_own_characters"
    on public.inventory_items
    for insert
    to authenticated
    with check (
        user_id = auth.uid()
        and exists (
            select 1
            from public.characters
            where characters.id = inventory_items.character_id
              and characters.user_id = auth.uid()
        )
    );

drop policy if exists "inventory_update_own_characters"
    on public.inventory_items;
create policy "inventory_update_own_characters"
    on public.inventory_items
    for update
    to authenticated
    using (
        user_id = auth.uid()
        and exists (
            select 1
            from public.characters
            where characters.id = inventory_items.character_id
              and characters.user_id = auth.uid()
        )
    )
    with check (
        user_id = auth.uid()
        and exists (
            select 1
            from public.characters
            where characters.id = inventory_items.character_id
              and characters.user_id = auth.uid()
        )
    );

drop policy if exists "inventory_delete_own_characters"
    on public.inventory_items;
create policy "inventory_delete_own_characters"
    on public.inventory_items
    for delete
    to authenticated
    using (
        user_id = auth.uid()
        and exists (
            select 1
            from public.characters
            where characters.id = inventory_items.character_id
              and characters.user_id = auth.uid()
        )
    );

create or replace function public.set_inventory_item_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists inventory_items_set_updated_at
    on public.inventory_items;
create trigger inventory_items_set_updated_at
    before update on public.inventory_items
    for each row
    execute function public.set_inventory_item_updated_at();

notify pgrst, 'reload schema';

commit;