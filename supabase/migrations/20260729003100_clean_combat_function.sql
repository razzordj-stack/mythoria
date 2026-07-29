begin;

create or replace function public.perform_combat_action(p_session_id uuid,p_action text,p_skill_id text default null,p_item_id uuid default null)
returns jsonb language plpgsql security definer set search_path=public
as $$
declare
  v_user uuid:=auth.uid(); v_session record; v_character record; v_enemy record; v_skill record; v_item record; v_loot record;
  v_player_attack integer; v_player_defense integer; v_magic_bonus integer; v_damage integer:=0; v_enemy_damage integer:=0;
  v_defending boolean:=false; v_message text; v_status text:='active'; v_effect_penalty integer:=0;
  v_loot_name text:=null;
begin
  if v_user is null then raise exception 'authentication required'; end if;
  select * into v_session from public.combat_sessions where id=p_session_id and user_id=v_user and status='active' for update;
  if v_session.id is null then raise exception 'active combat not found'; end if;
  select * into v_character from public.characters where id=v_session.character_id and user_id=v_user for update;
  select * into v_enemy from public.enemies where id=v_session.enemy_id;

  select coalesce(sum(attack_bonus),0),coalesce(sum(defense_bonus),0),coalesce(sum(magic_bonus),0)
  into v_player_attack,v_player_defense,v_magic_bonus from public.inventory_items
  where character_id=v_character.id and user_id=v_user and is_equipped=true;
  v_player_attack:=greatest(1,5+v_character.level+floor((coalesce(v_character.strength,10)-10)/2.0)::integer+v_player_attack);
  v_player_defense:=greatest(0,10+floor((coalesce(v_character.constitution,10)-10)/2.0)::integer+floor(v_character.level/2.0)::integer+v_player_defense);
  v_effect_penalty:=coalesce((v_session.player_effects->>'attackPenalty')::integer,0);
  v_player_attack:=greatest(1,v_player_attack-v_effect_penalty);

  select coalesce(jsonb_object_agg(key,greatest(value::integer-1,0)),'{}'::jsonb) into v_session.skill_cooldowns from jsonb_each_text(v_session.skill_cooldowns);
  if coalesce((v_session.player_effects->>'turns')::integer,0)>1 then
    v_session.player_effects:=jsonb_set(v_session.player_effects,'{turns}',to_jsonb((v_session.player_effects->>'turns')::integer-1));
  else v_session.player_effects:='{}'::jsonb; end if;

  if p_action='attack' then
    v_damage:=greatest(1,v_player_attack+floor(random()*4)::integer-floor(v_enemy.defense/2.0)::integer);
    v_message:=v_character.name||' trifft '||v_enemy.name||' für '||v_damage||' Schaden.';
  elsif p_action='defend' then
    v_defending:=true; v_message:=v_character.name||' nimmt eine verteidigende Haltung ein.';
  elsif p_action='skill' then
    select s.* into v_skill from public.skills s join public.character_skills cs on cs.skill_id=s.id
    where cs.character_id=v_character.id and cs.user_id=v_user and s.id=p_skill_id and s.skill_type='active';
    if v_skill.id is null then raise exception 'active skill unavailable'; end if;
    if coalesce((v_session.skill_cooldowns->>v_skill.id)::integer,0)>0 then raise exception 'skill on cooldown'; end if;
    if v_session.player_mana<v_skill.mana_cost then raise exception 'not enough mana'; end if;
    v_session.player_mana:=v_session.player_mana-v_skill.mana_cost;
    v_damage:=greatest(1,v_player_attack+v_skill.mana_cost+v_magic_bonus+floor((coalesce(v_character.intelligence,10)-10)/2.0)::integer-floor(v_enemy.defense/3.0)::integer);
    v_session.skill_cooldowns:=jsonb_set(v_session.skill_cooldowns,array[v_skill.id],to_jsonb(v_skill.cooldown),true);
    v_message:=v_character.name||' setzt '||v_skill.name||' ein und verursacht '||v_damage||' Schaden.';
  elsif p_action='item' then
    select * into v_item from public.inventory_items where id=p_item_id and character_id=v_character.id and user_id=v_user and item_type='potion' and quantity>0 for update;
    if v_item.id is null then raise exception 'combat item unavailable'; end if;
    v_session.player_health:=least(v_character.max_health,v_session.player_health+greatest(v_item.health_bonus,25));
    v_session.player_mana:=least(v_character.max_mana,v_session.player_mana+v_item.mana_bonus);
    if v_item.quantity=1 then delete from public.inventory_items where id=v_item.id; else update public.inventory_items set quantity=quantity-1 where id=v_item.id; end if;
    v_message:=v_character.name||' verwendet '||v_item.name||'.';
  elsif p_action='flee' then
    if random()<0.5 then v_status:='fled';v_message:=v_character.name||' entkommt aus dem Kampf.';else v_message:='Die Flucht misslingt.';end if;
  else raise exception 'invalid combat action'; end if;

  insert into public.combat_events(session_id,turn,actor,action,amount,message) values(v_session.id,v_session.turn,'player',p_action,v_damage,v_message);
  v_session.enemy_health:=greatest(0,v_session.enemy_health-v_damage);
  if v_session.enemy_health=0 then
    v_status:='victory';
    select * into v_loot from public.enemy_loot where enemy_id=v_enemy.id and random()<=drop_chance order by random() limit 1;
    if v_loot.id is not null then
      insert into public.inventory_items(character_id,user_id,name,description,item_type,rarity,quantity,is_equipped,attack_bonus,defense_bonus,magic_bonus,health_bonus,mana_bonus,value)
      values(v_character.id,v_user,v_loot.name,v_loot.description,v_loot.item_type,v_loot.rarity,1,false,v_loot.attack_bonus,v_loot.defense_bonus,v_loot.magic_bonus,v_loot.health_bonus,v_loot.mana_bonus,v_loot.value);
      v_loot_name:=v_loot.name;
    end if;
    insert into public.combat_events(session_id,turn,actor,action,message) values(v_session.id,v_session.turn,'system','victory',v_enemy.name||' wurde besiegt. Belohnung: '||v_enemy.experience_reward||' EP und '||v_enemy.gold_reward||' Gold.'||case when v_loot_name is null then '' else ' Beute: '||v_loot_name||'.' end);
    update public.characters set health=v_session.player_health,mana=v_session.player_mana,experience=experience+v_enemy.experience_reward,gold=gold+v_enemy.gold_reward where id=v_character.id and user_id=v_user;
  elsif v_status='active' then
    v_enemy_damage:=greatest(1,v_enemy.attack+floor(random()*4)::integer-floor(v_player_defense/2.0)::integer);
    if v_defending then v_enemy_damage:=greatest(0,floor(v_enemy_damage/2.0)::integer); end if;
    v_session.player_health:=greatest(0,v_session.player_health-v_enemy_damage);
    if v_enemy.enemy_type in('beast','dragon') and random()<0.20 then v_session.player_effects:=jsonb_build_object('name','Eingeschüchtert','attackPenalty',2,'turns',2); end if;
    insert into public.combat_events(session_id,turn,actor,action,amount,message) values(v_session.id,v_session.turn,'enemy','attack',v_enemy_damage,v_enemy.name||' verursacht '||v_enemy_damage||' Schaden.');
    if v_session.player_health=0 then v_status:='defeat';insert into public.combat_events(session_id,turn,actor,action,message) values(v_session.id,v_session.turn,'system','defeat',v_character.name||' wurde besiegt.');end if;
    update public.characters set health=v_session.player_health,mana=v_session.player_mana where id=v_character.id and user_id=v_user;
  elsif v_status='fled' then update public.characters set health=v_session.player_health,mana=v_session.player_mana where id=v_character.id and user_id=v_user;
  end if;

  update public.combat_sessions set status=v_status,turn=turn+1,player_health=v_session.player_health,player_mana=v_session.player_mana,enemy_health=v_session.enemy_health,skill_cooldowns=v_session.skill_cooldowns,player_effects=v_session.player_effects,completed_at=case when v_status='active' then null else now() end where id=v_session.id;
  return jsonb_build_object('status',v_status,'playerHealth',v_session.player_health,'playerMana',v_session.player_mana,'enemyHealth',v_session.enemy_health,'playerDamage',v_damage,'enemyDamage',v_enemy_damage,'loot',v_loot_name);
end;
$$;

revoke all on function public.perform_combat_action(uuid,text,text,uuid) from public,anon;
grant execute on function public.perform_combat_action(uuid,text,text,uuid) to authenticated;

notify pgrst,'reload schema';
commit;
