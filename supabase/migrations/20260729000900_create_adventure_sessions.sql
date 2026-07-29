begin;

create table if not exists public.adventure_sessions (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Neue Chronik',
  status text not null default 'active',
  current_scene jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint adventure_sessions_title_length check (char_length(title) between 2 and 120),
  constraint adventure_sessions_status_allowed check (status in ('active','completed','abandoned'))
);

create table if not exists public.adventure_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.adventure_sessions(id) on delete cascade,
  role text not null,
  content text not null,
  structured_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint adventure_messages_role_allowed check (role in ('user','assistant','system','npc')),
  constraint adventure_messages_content_length check (char_length(content) between 1 and 8000)
);

create unique index if not exists adventure_sessions_one_active_character_idx
  on public.adventure_sessions(character_id) where status = 'active';
create index if not exists adventure_sessions_user_updated_idx
  on public.adventure_sessions(user_id, updated_at desc);
create index if not exists adventure_messages_session_created_idx
  on public.adventure_messages(session_id, created_at);

drop trigger if exists adventure_sessions_set_updated_at on public.adventure_sessions;
create trigger adventure_sessions_set_updated_at before update on public.adventure_sessions
for each row execute function public.set_updated_at();

alter table public.adventure_sessions enable row level security;
alter table public.adventure_messages enable row level security;

create policy "adventure_sessions_select_own" on public.adventure_sessions for select to authenticated
using ((select auth.uid()) = user_id);
create policy "adventure_sessions_insert_own" on public.adventure_sessions for insert to authenticated
with check ((select auth.uid()) = user_id and exists (
  select 1 from public.characters c where c.id = character_id and c.user_id = (select auth.uid())
));
create policy "adventure_sessions_update_own" on public.adventure_sessions for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "adventure_messages_select_own" on public.adventure_messages for select to authenticated
using (exists (
  select 1 from public.adventure_sessions s where s.id = session_id and s.user_id = (select auth.uid())
));
create policy "adventure_messages_insert_user" on public.adventure_messages for insert to authenticated
with check (role = 'user' and exists (
  select 1 from public.adventure_sessions s where s.id = session_id and s.user_id = (select auth.uid()) and s.status = 'active'
));

revoke all on public.adventure_sessions, public.adventure_messages from anon;
grant select, insert, update on public.adventure_sessions to authenticated;
grant select, insert on public.adventure_messages to authenticated;

create or replace function public.start_or_resume_adventure(p_character_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_character_name text;
  v_session_id uuid;
begin
  if v_user is null then raise exception 'authentication required'; end if;
  select name into v_character_name from public.characters where id = p_character_id and user_id = v_user;
  if v_character_name is null then raise exception 'character not found'; end if;
  select id into v_session_id from public.adventure_sessions
    where character_id = p_character_id and user_id = v_user and status = 'active'
    order by updated_at desc limit 1;
  if v_session_id is not null then return v_session_id; end if;
  insert into public.adventure_sessions(character_id,user_id,title,current_scene)
  values(p_character_id,v_user,'Die Chronik von ' || v_character_name,'{"state":"awaiting_first_action"}'::jsonb)
  returning id into v_session_id;
  insert into public.adventure_messages(session_id,role,content,structured_data)
  values(v_session_id,'assistant','Die Seiten der Chronik sind bereit. Beschreibe, wie dein Abenteuer beginnen soll.', '{"kind":"introduction","choices":["Eine geheimnisvolle Spur verfolgen","In einer Taverne nach Arbeit suchen","Die Wildnis erkunden"]}'::jsonb);
  return v_session_id;
end;
$$;

revoke all on function public.start_or_resume_adventure(uuid) from public, anon;
grant execute on function public.start_or_resume_adventure(uuid) to authenticated;
notify pgrst, 'reload schema';
commit;
