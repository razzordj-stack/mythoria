begin;

drop function if exists public.record_adventure_turn(uuid, text, text, jsonb);

create or replace function public.record_adventure_turn(
  p_session_id uuid,
  p_action text,
  p_response text,
  p_structured_data jsonb default '{}'::jsonb,
  p_effects jsonb default '{}'::jsonb
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
  v_result jsonb;
begin
  if v_user is null then raise exception 'authentication required'; end if;
  if char_length(trim(p_action)) not between 2 and 2000 then raise exception 'invalid player action'; end if;
  if char_length(trim(p_response)) not between 1 and 8000 then raise exception 'invalid assistant response'; end if;

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

  update public.characters
  set level = public.level_from_experience(experience)
  where id = v_character_id and user_id = v_user;

  update public.adventure_sessions
  set current_scene = jsonb_build_object('state', 'awaiting_player_action', 'scene', coalesce(p_structured_data->>'scene', '')),
      updated_at = now()
  where id = p_session_id;

  select jsonb_build_object(
    'health', health,
    'mana', mana,
    'gold', gold,
    'experience', experience,
    'level', level,
    'applied_effects', jsonb_build_object(
      'health', v_health_delta,
      'mana', v_mana_delta,
      'gold', v_gold_delta,
      'experience', v_experience_delta
    )
  ) into v_result
  from public.characters
  where id = v_character_id and user_id = v_user;

  return v_result;
exception
  when invalid_text_representation then
    raise exception 'invalid adventure effects';
end;
$$;

revoke all on function public.record_adventure_turn(uuid, text, text, jsonb, jsonb) from public, anon;
grant execute on function public.record_adventure_turn(uuid, text, text, jsonb, jsonb) to authenticated;

notify pgrst, 'reload schema';
commit;
