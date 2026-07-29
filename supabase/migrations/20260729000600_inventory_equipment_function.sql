begin;
create or replace function public.set_inventory_item_equipped(p_item_id uuid, p_equipped boolean)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_character_id uuid;
  v_slot text;
begin
  if v_user_id is null then raise exception 'authentication required'; end if;
  select character_id, equipment_slot into v_character_id, v_slot
  from public.inventory_items
  where id = p_item_id and user_id = v_user_id
  for update;
  if v_character_id is null then raise exception 'item not found'; end if;
  if p_equipped and v_slot is null then raise exception 'equipment slot required'; end if;
  if p_equipped then
    update public.inventory_items
      set is_equipped = false
      where character_id = v_character_id and user_id = v_user_id
        and equipment_slot = v_slot and id <> p_item_id and is_equipped;
  end if;
  update public.inventory_items set is_equipped = p_equipped
    where id = p_item_id and user_id = v_user_id;
end;
$$;
revoke all on function public.set_inventory_item_equipped(uuid, boolean) from public, anon;
grant execute on function public.set_inventory_item_equipped(uuid, boolean) to authenticated;
commit;
