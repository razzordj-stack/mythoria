begin;
create table if not exists public.adventure_turn_requests (
 id uuid primary key, session_id uuid not null references public.adventure_sessions(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade, status text not null default 'processing',
 error_code text, created_at timestamptz not null default now(), completed_at timestamptz,
 constraint adventure_turn_requests_status_allowed check (status in ('processing','completed','failed'))
);
create index if not exists adventure_turn_requests_session_created_idx on public.adventure_turn_requests(session_id,created_at desc);
alter table public.adventure_turn_requests enable row level security;
create policy "adventure_turn_requests_select_own" on public.adventure_turn_requests for select to authenticated using ((select auth.uid())=user_id);
revoke all on public.adventure_turn_requests from anon,authenticated;
grant select on public.adventure_turn_requests to authenticated;

create or replace function public.begin_adventure_turn_request(p_request_id uuid,p_session_id uuid)
returns text language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid(); v_existing text;
begin
 if v_user is null then raise exception 'authentication required'; end if;
 if not exists(select 1 from public.adventure_sessions where id=p_session_id and user_id=v_user and status='active') then raise exception 'active adventure session not found'; end if;
 select status into v_existing from public.adventure_turn_requests where id=p_request_id and user_id=v_user;
 if v_existing is not null then return v_existing; end if;
 if exists(select 1 from public.adventure_turn_requests where session_id=p_session_id and user_id=v_user and created_at>now()-interval '3 seconds') then return 'throttled'; end if;
 if exists(select 1 from public.adventure_turn_requests where session_id=p_session_id and user_id=v_user and status='processing' and created_at>now()-interval '60 seconds') then return 'processing'; end if;
 insert into public.adventure_turn_requests(id,session_id,user_id,status) values(p_request_id,p_session_id,v_user,'processing');
 return 'started';
end; $$;

create or replace function public.finish_adventure_turn_request(p_request_id uuid,p_success boolean,p_error_code text default null)
returns void language plpgsql security definer set search_path=public as $$
begin
 update public.adventure_turn_requests set status=case when p_success then 'completed' else 'failed' end,
 error_code=case when p_success then null else left(coalesce(p_error_code,'unknown'),80) end,completed_at=now()
 where id=p_request_id and user_id=auth.uid() and status='processing';
end; $$;
revoke all on function public.begin_adventure_turn_request(uuid,uuid) from public,anon;
revoke all on function public.finish_adventure_turn_request(uuid,boolean,text) from public,anon;
grant execute on function public.begin_adventure_turn_request(uuid,uuid) to authenticated;
grant execute on function public.finish_adventure_turn_request(uuid,boolean,text) to authenticated;
notify pgrst,'reload schema';
commit;
