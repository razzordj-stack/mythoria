begin;
create or replace function public.change_character_quest(p_character_id uuid,p_quest_id uuid,p_action text)
returns void language plpgsql security invoker set search_path = public
as $$
declare v_user uuid := auth.uid(); v_level integer; v_xp integer; v_gold integer; v_new_xp integer;
begin
 if v_user is null then raise exception 'authentication required'; end if;
 select level into v_level from public.characters where id=p_character_id and user_id=v_user for update;
 if v_level is null then raise exception 'character not found'; end if;
 select experience_reward,gold_reward into v_xp,v_gold from public.quests where id=p_quest_id and status='available' and level_requirement<=v_level;
 if v_xp is null then raise exception 'quest unavailable or level too low'; end if;
 if p_action='accept' then
   insert into public.character_quests(character_id,quest_id,user_id,status,started_at,completed_at)
   values(p_character_id,p_quest_id,v_user,'active',now(),null)
   on conflict(character_id,quest_id) do update set status='active',started_at=now(),completed_at=null
   where character_quests.status='abandoned';
 elsif p_action='abandon' then
   update public.character_quests set status='abandoned' where character_id=p_character_id and quest_id=p_quest_id and user_id=v_user and status='active';
   if not found then raise exception 'active quest not found'; end if;
 elsif p_action='complete' then
   update public.character_quests set status='completed',completed_at=now(),progress='{"percent":100}'::jsonb
   where character_id=p_character_id and quest_id=p_quest_id and user_id=v_user and status='active';
   if not found then raise exception 'active quest not found'; end if;
   update public.characters set experience=experience+v_xp,gold=gold+v_gold where id=p_character_id and user_id=v_user returning experience into v_new_xp;
   update public.characters set level=public.level_from_experience(v_new_xp) where id=p_character_id and user_id=v_user;
 else raise exception 'invalid quest action'; end if;
end;
$$;
notify pgrst, 'reload schema';
commit;
