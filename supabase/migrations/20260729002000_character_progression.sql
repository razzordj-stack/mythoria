begin;

create or replace function public.sync_character_progression()
returns trigger language plpgsql set search_path = public
as $$
declare
  v_old_max_health integer;
  v_old_max_mana integer;
  v_new_max_health integer;
  v_new_max_mana integer;
begin
  new.experience := greatest(coalesce(new.experience, 0), 0);
  new.level := public.level_from_experience(new.experience);
  v_new_max_health := 80 + greatest(coalesce(new.constitution, 10), 0) * 2 + (new.level - 1) * 8;
  v_new_max_mana := 30 + greatest(coalesce(new.wisdom, 10), 0) * 2 + (new.level - 1) * 5;

  if tg_op = 'INSERT' then
    new.max_health := v_new_max_health;
    new.max_mana := v_new_max_mana;
    new.health := least(v_new_max_health, greatest(coalesce(new.health, v_new_max_health), 0));
    new.mana := least(v_new_max_mana, greatest(coalesce(new.mana, v_new_max_mana), 0));
  else
    v_old_max_health := coalesce(old.max_health, 100);
    v_old_max_mana := coalesce(old.max_mana, 50);
    new.max_health := v_new_max_health;
    new.max_mana := v_new_max_mana;
    new.health := least(v_new_max_health, greatest(coalesce(new.health, 0) + greatest(v_new_max_health - v_old_max_health, 0), 0));
    new.mana := least(v_new_max_mana, greatest(coalesce(new.mana, 0) + greatest(v_new_max_mana - v_old_max_mana, 0), 0));
  end if;
  return new;
end;
$$;

drop trigger if exists characters_sync_progression on public.characters;
create trigger characters_sync_progression
before insert or update of experience, constitution, wisdom on public.characters
for each row execute function public.sync_character_progression();

update public.characters set experience = experience;

notify pgrst, 'reload schema';
commit;
