begin;

create table if not exists public.adventure_ai_usage(
  id bigint generated always as identity primary key, request_id uuid not null unique references public.adventure_turn_requests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, provider text not null, model text not null,
  input_tokens integer not null default 0 check(input_tokens>=0), output_tokens integer not null default 0 check(output_tokens>=0), duration_ms integer not null default 0 check(duration_ms>=0), created_at timestamptz not null default now()
);
create index if not exists adventure_ai_usage_user_created_idx on public.adventure_ai_usage(user_id,created_at desc);
alter table public.adventure_ai_usage enable row level security;
create policy "adventure_ai_usage_own_read" on public.adventure_ai_usage for select to authenticated using(user_id=(select auth.uid()));
revoke all on public.adventure_ai_usage from anon,authenticated;
grant select on public.adventure_ai_usage to authenticated;

drop function if exists public.begin_adventure_turn_request(uuid,uuid);
create function public.begin_adventure_turn_request(p_request_id uuid,p_session_id uuid,p_daily_limit integer default 40)
returns text language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid(); v_existing text;
begin
 if v_user is null then raise exception 'authentication required'; end if;
 if p_daily_limit not between 1 and 200 then raise exception 'invalid daily limit'; end if;
 if not exists(select 1 from public.adventure_sessions where id=p_session_id and user_id=v_user and status='active') then raise exception 'active adventure session not found'; end if;
 select status into v_existing from public.adventure_turn_requests where id=p_request_id and user_id=v_user;
 if v_existing is not null then return v_existing; end if;
 if (select count(*) from public.adventure_turn_requests where user_id=v_user and created_at>=now()-interval '24 hours')>=p_daily_limit then return 'daily_limit'; end if;
 if exists(select 1 from public.adventure_turn_requests where session_id=p_session_id and user_id=v_user and created_at>now()-interval '3 seconds') then return 'throttled'; end if;
 if exists(select 1 from public.adventure_turn_requests where session_id=p_session_id and user_id=v_user and status='processing' and created_at>now()-interval '60 seconds') then return 'processing'; end if;
 insert into public.adventure_turn_requests(id,session_id,user_id,status) values(p_request_id,p_session_id,v_user,'processing');
 return 'started';
end; $$;

create or replace function public.record_adventure_ai_usage(p_request_id uuid,p_provider text,p_model text,p_input_tokens integer default 0,p_output_tokens integer default 0,p_duration_ms integer default 0)
returns void language plpgsql security definer set search_path=public as $$
begin
 if p_provider not in('openai','openrouter') then raise exception 'invalid provider'; end if;
 insert into public.adventure_ai_usage(request_id,user_id,provider,model,input_tokens,output_tokens,duration_ms)
 select p_request_id,auth.uid(),p_provider,left(p_model,120),greatest(p_input_tokens,0),greatest(p_output_tokens,0),greatest(p_duration_ms,0)
 where exists(select 1 from public.adventure_turn_requests where id=p_request_id and user_id=auth.uid())
 on conflict(request_id) do nothing;
end; $$;
revoke all on function public.begin_adventure_turn_request(uuid,uuid,integer),public.record_adventure_ai_usage(uuid,text,text,integer,integer,integer) from public,anon;
grant execute on function public.begin_adventure_turn_request(uuid,uuid,integer),public.record_adventure_ai_usage(uuid,text,text,integer,integer,integer) to authenticated;
notify pgrst,'reload schema';
commit;
