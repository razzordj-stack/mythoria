begin;

create or replace function public.record_adventure_turn(
  p_session_id uuid,
  p_action text,
  p_response text,
  p_structured_data jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'authentication required';
  end if;
  if char_length(trim(p_action)) not between 2 and 2000 then
    raise exception 'invalid player action';
  end if;
  if char_length(trim(p_response)) not between 1 and 8000 then
    raise exception 'invalid assistant response';
  end if;

  perform 1
  from public.adventure_sessions
  where id = p_session_id
    and user_id = v_user
    and status = 'active'
  for update;
  if not found then
    raise exception 'active adventure session not found';
  end if;

  insert into public.adventure_messages(session_id, role, content, structured_data)
  values
    (p_session_id, 'user', trim(p_action), '{"kind":"player_action"}'::jsonb),
    (p_session_id, 'assistant', trim(p_response), coalesce(p_structured_data, '{}'::jsonb));

  update public.adventure_sessions
  set current_scene = jsonb_build_object(
        'state', 'awaiting_player_action',
        'scene', coalesce(p_structured_data->>'scene', '')
      ),
      updated_at = now()
  where id = p_session_id;
end;
$$;

revoke all on function public.record_adventure_turn(uuid, text, text, jsonb) from public, anon;
grant execute on function public.record_adventure_turn(uuid, text, text, jsonb) to authenticated;

notify pgrst, 'reload schema';
commit;
