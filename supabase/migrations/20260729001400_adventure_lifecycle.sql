begin;
create or replace function public.complete_adventure(p_session_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid();
begin
 if v_user is null then raise exception 'authentication required'; end if;
 update public.adventure_sessions set status='completed',completed_at=now(),updated_at=now()
 where id=p_session_id and user_id=v_user and status='active';
 if not found then raise exception 'active adventure session not found'; end if;
 insert into public.adventure_messages(session_id,role,content,structured_data)
 values(p_session_id,'assistant','Diese Chronik endet hier. Doch jede vollendete Geschichte hinterlässt Spuren in Mythoria.',
 '{"kind":"conclusion","choices":[]}'::jsonb);
end; $$;
revoke all on function public.complete_adventure(uuid) from public,anon;
grant execute on function public.complete_adventure(uuid) to authenticated;
notify pgrst,'reload schema';
commit;
