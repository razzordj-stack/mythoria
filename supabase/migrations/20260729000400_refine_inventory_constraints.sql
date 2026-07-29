begin;

update public.inventory_items
set rarity = 'common'
where rarity not in (
    'common',
    'uncommon',
    'rare',
    'epic',
    'legendary'
);

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'inventory_items_rarity_allowed'
          and conrelid = 'public.inventory_items'::regclass
    ) then
        alter table public.inventory_items
            add constraint inventory_items_rarity_allowed
            check (
                rarity in (
                    'common',
                    'uncommon',
                    'rare',
                    'epic',
                    'legendary'
                )
            );
    end if;
end
$$;

create index if not exists inventory_items_is_equipped_idx
    on public.inventory_items(is_equipped);

create index if not exists inventory_items_character_equipped_idx
    on public.inventory_items(character_id, is_equipped);

notify pgrst, 'reload schema';

commit;