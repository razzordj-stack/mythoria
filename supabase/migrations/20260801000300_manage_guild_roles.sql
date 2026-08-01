begin;

create or replace function public.set_guild_member_role(p_guild_id uuid,p_member_id uuid,p_role text)
returns void language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid();
begin
  if not exists(select 1 from public.guilds where id=p_guild_id and owner_id=v_user) then raise exception 'guild owner required'; end if;
  if p_role not in ('member','officer') then raise exception 'invalid guild role'; end if;
  update public.guild_members set role=p_role where guild_id=p_guild_id and user_id=p_member_id and user_id<>v_user;
  if not found then raise exception 'guild member not found'; end if;
end;
$$;

create or replace function public.remove_guild_member(p_guild_id uuid,p_member_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid();
begin
  if not exists(select 1 from public.guilds where id=p_guild_id and owner_id=v_user) then raise exception 'guild owner required'; end if;
  delete from public.guild_members where guild_id=p_guild_id and user_id=p_member_id and user_id<>v_user;
  if not found then raise exception 'guild member not found'; end if;
end;
$$;

revoke all on function public.set_guild_member_role(uuid,uuid,text),public.remove_guild_member(uuid,uuid) from public,anon;
grant execute on function public.set_guild_member_role(uuid,uuid,text),public.remove_guild_member(uuid,uuid) to authenticated;
notify pgrst,'reload schema';
commit;
