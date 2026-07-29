begin;

alter table public.characters
    add column if not exists strength integer default 10,
    add column if not exists dexterity integer default 10,
    add column if not exists intelligence integer default 10,
    add column if not exists constitution integer default 10,
    add column if not exists wisdom integer default 10,
    add column if not exists charisma integer default 10,
    add column if not exists health integer default 100,
    add column if not exists max_health integer default 100,
    add column if not exists mana integer default 50,
    add column if not exists max_mana integer default 50,
    add column if not exists gold integer default 0;

do $$
declare
    attribute record;
begin
    for attribute in
        select *
        from (
            values
                ('strength', 'characters_strength_nonnegative'),
                ('dexterity', 'characters_dexterity_nonnegative'),
                ('intelligence', 'characters_intelligence_nonnegative'),
                ('constitution', 'characters_constitution_nonnegative'),
                ('wisdom', 'characters_wisdom_nonnegative'),
                ('charisma', 'characters_charisma_nonnegative'),
                ('health', 'characters_health_nonnegative'),
                ('max_health', 'characters_max_health_nonnegative'),
                ('mana', 'characters_mana_nonnegative'),
                ('max_mana', 'characters_max_mana_nonnegative'),
                ('gold', 'characters_gold_nonnegative')
        ) as checks(column_name, constraint_name)
    loop
        if not exists (
            select 1
            from pg_constraint
            where conname = attribute.constraint_name
              and conrelid = 'public.characters'::regclass
        ) then
            execute format(
                'alter table public.characters add constraint %I check (%I is null or %I >= 0)',
                attribute.constraint_name,
                attribute.column_name,
                attribute.column_name
            );
        end if;
    end loop;
end
$$;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'characters_health_within_max'
          and conrelid = 'public.characters'::regclass
    ) then
        alter table public.characters
            add constraint characters_health_within_max
            check (
                health is null
                or max_health is null
                or health <= max_health
            );
    end if;

    if not exists (
        select 1
        from pg_constraint
        where conname = 'characters_mana_within_max'
          and conrelid = 'public.characters'::regclass
    ) then
        alter table public.characters
            add constraint characters_mana_within_max
            check (
                mana is null
                or max_mana is null
                or mana <= max_mana
            );
    end if;
end
$$;

notify pgrst, 'reload schema';

commit;