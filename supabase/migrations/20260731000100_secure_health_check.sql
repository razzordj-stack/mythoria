-- Allows the public health endpoint to verify database reachability without
-- exposing any application table or relaxing row-level security policies.
create or replace function public.check_database_health()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select true;
$$;

revoke all on function public.check_database_health() from public;
grant execute on function public.check_database_health() to anon, authenticated;
