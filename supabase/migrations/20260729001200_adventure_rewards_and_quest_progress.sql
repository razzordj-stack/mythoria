begin;

drop function if exists public.record_adventure_turn(uuid, text, text, jsonb, jsonb);

create or replace function public.record_adventure_turn(
  p_session_id uuid,
  p_action text,
  p_response text,
  p_structured_data jsonb default '{}'::jsonb,
  p_effects jsonb default '{}'::jsonb,
  p_item_rewards jsonb default '[]'::jsonb,
  p_quest_updates jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_character_id uuid;
  v_health_delta integer := least(20, greatest(-25, coalesce((p_effects->>'health')::integer, 0)));
  v_mana_delta integer := least(15, greatest(-20, coalesce((p_effects->>'mana')::integer, 0)));
  v_gold_delta integer := least(50, greatest(-20, coalesce((p_effects->>'gold')::integer, 0)));
  v_experience_delta integer := least(40, greatest(0, coalesce((p_effects->>'experience')::integer, 0)));
  v_item jsonb;
  v_quest jsonb;
  v_result jsonb;
begin
  if v_user is null then raise exception 'authentication required'; end if;
  if char_length(trim(p_action)) not between 2 and 2000 then raise exception 'invalid player action'; end if;
  if char_length(trim(p_response)) not between 1 and 8000 then raise exception 'invalid assistant response'; end if;
  if jsonb_typeof(p_item_rewards) <> 'array' or jsonb_array_length(p_item_rewards) > 1 then raise exception 'invalid item rewards'; end if;
  if jsonb_typeof(p_quest_updates) <> 'array' or jsonb_array_length(p_quest_updates) > 1 then raise exception 'invalid quest updates'; end if;

  select character_id into v_character_id
  from public.adventure_sessions
  where id = p_session_id and user_id = v_user and status = 'active'
  for update;
  if v_character_id is null then raise exception 'active adventure session not found'; end if;

  insert into public.adventure_messages(session_id, role, content, structured_data)
  values
    (p_session_id, 'user', trim(p_action), '{"kind":"player_action"}'::jsonb),
    (p_session_id, 'assistant', trim(p_response), coalesce(p_structured_data, '{}'::jsonb));

  update public.characters
  set health = least(max_health, greatest(0, health + v_health_delta)),
      mana = least(max_mana, greatest(0, mana + v_mana_delta)),
      gold = greatest(0, gold + v_gold_delta),
      experience = experience + v_experience_delta
  where id = v_character_id and user_id = v_user;

  update public.characters set level = public.level_from_experience(experience)
  where id = v_character_id and user_id = v_user;

  for v_item in select value from jsonb_array_elements(p_item_rewards) loop
    if char_length(trim(v_item->>'name')) not between 2 and 80
       or char_length(trim(v_item->>'description')) not between 2 and 300
       or v_item->>'itemType' not in ('weapon','armor','potion','scroll','quest','material','other')
       or v_item->>'rarity' not in ('common','uncommon') then
      raise exception 'invalid item reward';
    end if;
    insert into public.inventory_items(character_id,user_id,name,description,item_type,rarity,quantity,is_equipped)
    values(v_character_id,v_user,trim(v_item->>'name'),trim(v_item->>'description'),v_item->>'itemType',v_item->>'rarity',1,false);
  end loop;

  for v_quest in select value from jsonb_array_elements(p_quest_updates) loop
    if coalesce(v_quest->>'questId','') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
       or coalesce((v_quest->>'progress')::integer,0) not between 1 and 25
       or char_length(trim(v_quest->>'note')) not between 2 and 240 then
      raise exception 'invalid quest update';
    end if;
    update public.character_quests
    set progress = jsonb_build_object(
      'percent', least(95, greatest(0, coalesce((progress->>'percent')::integer,0)) + (v_quest->>'progress')::integer),
      'note', trim(v_quest->>'note')
    )
    where character_id = v_character_id and quest_id = (v_quest->>'questId')::uuid
      and user_id = v_user and status = 'active';
    if not found then raise exception 'active quest not found'; end if;
  end loop;

  update public.adventure_sessions
  set current_scene = jsonb_build_object('state','awaiting_player_action','scene',coalesce(p_structured_data->>'scene','')),
      updated_at = now()
  where id = p_session_id;

  select jsonb_build_object('health',health,'mana',mana,'gold',gold,'experience',experience,'level',level)
  into v_result from public.characters where id = v_character_id and user_id = v_user;
  return v_result;
exception
  when invalid_text_representation then raise exception 'invalid adventure data';
end;
$$;

revoke all on function public.record_adventure_turn(uuid,text,text,jsonb,jsonb,jsonb,jsonb) from public, anon;
grant execute on function public.record_adventure_turn(uuid,text,text,jsonb,jsonb,jsonb,jsonb) to authenticated;

notify pgrst, 'reload schema';
commit;
