begin;

create or replace function public.transfer_party_leadership(p_party_id uuid,p_new_leader_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid();
begin
  if not exists(select 1 from public.multiplayer_parties where id=p_party_id and leader_id=v_user) then raise exception 'leader required'; end if;
  if p_new_leader_id=v_user or not exists(select 1 from public.multiplayer_party_members where party_id=p_party_id and user_id=p_new_leader_id) then raise exception 'party member not found'; end if;
  update public.multiplayer_parties set leader_id=p_new_leader_id where id=p_party_id;
end;
$$;

create or replace function public.remove_party_member(p_party_id uuid,p_member_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid();
begin
  if not exists(select 1 from public.multiplayer_parties where id=p_party_id and leader_id=v_user) then raise exception 'leader required'; end if;
  if p_member_id=v_user then raise exception 'leader cannot remove self'; end if;
  delete from public.multiplayer_party_members where party_id=p_party_id and user_id=p_member_id;
  if not found then raise exception 'party member not found'; end if;
  update public.multiplayer_parties set status=case when not exists(select 1 from public.multiplayer_party_members where party_id=p_party_id and is_ready=false) and (select count(*) from public.multiplayer_party_members where party_id=p_party_id)>=2 then 'ready' else 'forming' end where id=p_party_id;
end;
$$;

revoke all on function public.transfer_party_leadership(uuid,uuid),public.remove_party_member(uuid,uuid) from public,anon;
grant execute on function public.transfer_party_leadership(uuid,uuid),public.remove_party_member(uuid,uuid) to authenticated;
notify pgrst,'reload schema';
commit;
