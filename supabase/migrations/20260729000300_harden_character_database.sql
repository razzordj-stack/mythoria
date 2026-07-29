begin;

update public.characters
set
    strength = coalesce(strength, 10),
    dexterity = coalesce(dexterity, 10),
    intelligence = coalesce(intelligence, 10),
    constitution = coalesce(constitution, 10),
    wisdom = coalesce(wisdom, 10),
    charisma = coalesce(charisma, 10),
    health = coalesce(health, 100),
    max_health = greatest(coalesce(max_health, 100), coalesce(health, 100)),
    mana = coalesce(mana, 50),
    max_mana = greatest(coalesce(max_mana, 50), coalesce(mana, 50)),
    gold = coalesce(gold, 0),
    level = greatest(coalesce(level, 1), 1),
    experience = greatest(coalesce(experience, 0), 0),
    updated_at = coalesce(updated_at, now());

alter table public.characters
    alter column strength set default 10,
    alter column strength set not null,
    alter column dexterity set default 10,
    alter column dexterity set not null,
    alter column intelligence set default 10,
    alter column intelligence set not null,
    alter column constitution set default 10,
    alter column constitution set not null,
    alter column wisdom set default 10,
    alter column wisdom set not null,
    alter column charisma set default 10,
    alter column charisma set not null,
    alter column health set default 100,
    alter column health set not null,
    alter column max_health set default 100,
    alter column max_health set not null,
    alter column mana set default 50,
    alter column mana set not null,
    alter column max_mana set default 50,
    alter column max_mana set not null,
    alter column gold set default 0,
    alter column gold set not null,
    alter column level set default 1,
    alter column level set not null,
    alter column experience set default 0,
    alter column experience set not null,
    alter column created_at set default now(),
    alter column created_at set not null,
    alter column updated_at set default now(),
    alter column updated_at set not null;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'characters_user_id_fkey'
          and conrelid = 'public.characters'::regclass
    ) then
        alter table public.characters
            add constraint characters_user_id_fkey
            foreign key (user_id)
            references auth.users(id)
            on delete cascade;
    end if;

    if not exists (
        select 1
        from pg_constraint
        where conname = 'characters_name_not_empty'
          and conrelid = 'public.characters'::regclass
    ) then
        alter table public.characters
            add constraint characters_name_not_empty
            check (length(trim(name)) between 3 and 40);
    end if;

    if not exists (
        select 1
        from pg_constraint
        where conname = 'characters_race_not_empty'
          and conrelid = 'public.characters'::regclass
    ) then
        alter table public.characters
            add constraint characters_race_not_empty
            check (length(trim(race)) > 0);
    end if;

    if not exists (
        select 1
        from pg_constraint
        where conname = 'characters_class_not_empty'
          and conrelid = 'public.characters'::regclass
    ) then
        alter table public.characters
            add constraint characters_class_not_empty
            check (length(trim(character_class)) > 0);
    end if;

    if not exists (
        select 1
        from pg_constraint
        where conname = 'characters_level_positive'
          and conrelid = 'public.characters'::regclass
    ) then
        alter table public.characters
            add constraint characters_level_positive
            check (level >= 1);
    end if;

    if not exists (
        select 1
        from pg_constraint
        where conname = 'characters_experience_nonnegative'
          and conrelid = 'public.characters'::regclass
    ) then
        alter table public.characters
            add constraint characters_experience_nonnegative
            check (experience >= 0);
    end if;
end
$$;

create index if not exists characters_user_id_idx
    on public.characters(user_id);

create index if not exists characters_user_created_at_idx
    on public.characters(user_id, created_at desc);

create index if not exists inventory_items_user_character_idx
    on public.inventory_items(user_id, character_id);

create or replace function public.set_updated_at()
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

drop trigger if exists characters_set_updated_at
    on public.characters;
create trigger characters_set_updated_at
    before update on public.characters
    for each row
    execute function public.set_updated_at();

drop trigger if exists inventory_items_set_updated_at
    on public.inventory_items;
create trigger inventory_items_set_updated_at
    before update on public.inventory_items
    for each row
    execute function public.set_updated_at();

alter table public.characters enable row level security;
alter table public.inventory_items enable row level security;

do $$
declare
    existing_policy record;
begin
    for existing_policy in
        select policyname
        from pg_policies
        where schemaname = 'public'
          and tablename = 'characters'
    loop
        execute format(
            'drop policy if exists %I on public.characters',
            existing_policy.policyname
        );
    end loop;
end
$$;

create policy "characters_select_own"
    on public.characters
    for select
    to authenticated
    using ((select auth.uid()) = user_id);

create policy "characters_insert_own"
    on public.characters
    for insert
    to authenticated
    with check ((select auth.uid()) = user_id);

create policy "characters_update_own"
    on public.characters
    for update
    to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

create policy "characters_delete_own"
    on public.characters
    for delete
    to authenticated
    using ((select auth.uid()) = user_id);

drop policy if exists "inventory_select_own_characters"
    on public.inventory_items;
drop policy if exists "inventory_insert_own_characters"
    on public.inventory_items;
drop policy if exists "inventory_update_own_characters"
    on public.inventory_items;
drop policy if exists "inventory_delete_own_characters"
    on public.inventory_items;

create policy "inventory_select_own_characters"
    on public.inventory_items
    for select
    to authenticated
    using (
        (select auth.uid()) = user_id
        and exists (
            select 1
            from public.characters
            where characters.id = inventory_items.character_id
              and characters.user_id = (select auth.uid())
        )
    );

create policy "inventory_insert_own_characters"
    on public.inventory_items
    for insert
    to authenticated
    with check (
        (select auth.uid()) = user_id
        and exists (
            select 1
            from public.characters
            where characters.id = inventory_items.character_id
              and characters.user_id = (select auth.uid())
        )
    );

create policy "inventory_update_own_characters"
    on public.inventory_items
    for update
    to authenticated
    using (
        (select auth.uid()) = user_id
        and exists (
            select 1
            from public.characters
            where characters.id = inventory_items.character_id
              and characters.user_id = (select auth.uid())
        )
    )
    with check (
        (select auth.uid()) = user_id
        and exists (
            select 1
            from public.characters
            where characters.id = inventory_items.character_id
              and characters.user_id = (select auth.uid())
        )
    );

create policy "inventory_delete_own_characters"
    on public.inventory_items
    for delete
    to authenticated
    using (
        (select auth.uid()) = user_id
        and exists (
            select 1
            from public.characters
            where characters.id = inventory_items.character_id
              and characters.user_id = (select auth.uid())
        )
    );

revoke all on table public.characters from anon;
revoke all on table public.inventory_items from anon;

grant select, insert, update, delete
    on table public.characters
    to authenticated;

grant select, insert, update, delete
    on table public.inventory_items
    to authenticated;

notify pgrst, 'reload schema';

commit;