begin;
alter table public.characters add column if not exists current_location_id uuid references public.world_locations(id) on delete set null;
update public.characters set current_location_id='10000000-0000-4000-8000-000000000002' where current_location_id is null;
create index if not exists characters_current_location_idx on public.characters(current_location_id);

create or replace function public.travel_character(p_character_id uuid,p_location_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid(); v_level integer; v_required integer;
begin
 if v_user is null then raise exception 'authentication required'; end if;
 select level into v_level from public.characters where id=p_character_id and user_id=v_user for update;
 if v_level is null then raise exception 'character not found'; end if;
 if exists(select 1 from public.adventure_sessions where character_id=p_character_id and user_id=v_user and status='active') then raise exception 'complete the active adventure before travelling'; end if;
 select recommended_level into v_required from public.world_locations where id=p_location_id and status='published';
 if v_required is null then raise exception 'location not found'; end if;
 if v_level+2<v_required then raise exception 'character level is too low for this destination'; end if;
 update public.characters set current_location_id=p_location_id where id=p_character_id and user_id=v_user;
end; $$;
revoke all on function public.travel_character(uuid,uuid) from public,anon;
grant execute on function public.travel_character(uuid,uuid) to authenticated;

create or replace function public.start_or_resume_adventure(p_character_id uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid(); v_character_name text; v_location_name text; v_session_id uuid;
begin
 if v_user is null then raise exception 'authentication required'; end if;
 select c.name,l.name into v_character_name,v_location_name from public.characters c left join public.world_locations l on l.id=c.current_location_id where c.id=p_character_id and c.user_id=v_user;
 if v_character_name is null then raise exception 'character not found'; end if;
 v_location_name:=coalesce(v_location_name,'den unbekannten Landen');
 select id into v_session_id from public.adventure_sessions where character_id=p_character_id and user_id=v_user and status='active' order by updated_at desc limit 1;
 if v_session_id is not null then return v_session_id; end if;
 insert into public.adventure_sessions(character_id,user_id,title,current_scene)
 values(p_character_id,v_user,'Die Chronik von '||v_character_name,jsonb_build_object('state','awaiting_first_action','location',v_location_name)) returning id into v_session_id;
 insert into public.adventure_messages(session_id,role,content,structured_data)
 values(v_session_id,'assistant','Deine neue Chronik beginnt in '||v_location_name||'. Beschreibe, wonach du suchst oder welchen Weg du einschlägst.',jsonb_build_object('kind','introduction','location',v_location_name,'choices',jsonb_build_array('Die Umgebung aufmerksam erkunden','Nach Gerüchten und Arbeit fragen','Einer auffälligen Spur folgen')));
 return v_session_id;
end; $$;
notify pgrst,'reload schema';
commit;
