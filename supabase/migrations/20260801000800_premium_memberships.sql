begin;

create table if not exists public.player_memberships(
  user_id uuid primary key references auth.users(id) on delete cascade,
  tier text not null default 'free' check(tier in ('free','premium')),
  status text not null default 'active' check(status in ('active','trialing','past_due','canceled','expired')),
  provider text not null default 'manual' check(provider in ('manual','stripe')),
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.player_memberships enable row level security;
create policy "player_memberships_select_own" on public.player_memberships
  for select to authenticated using(user_id = (select auth.uid()));
revoke all on public.player_memberships from anon, authenticated;
grant select on public.player_memberships to authenticated;

create or replace function public.get_current_membership()
returns jsonb
language sql
stable
security definer
set search_path=public
as $$
  select jsonb_build_object(
    'tier', case
      when membership.tier = 'premium'
        and membership.status in ('active','trialing')
        and (membership.current_period_end is null or membership.current_period_end > now())
      then 'premium'
      else 'free'
    end,
    'status', coalesce(membership.status, 'active'),
    'currentPeriodEnd', membership.current_period_end
  )
  from (select auth.uid() as user_id) viewer
  left join public.player_memberships membership on membership.user_id = viewer.user_id;
$$;

revoke all on function public.get_current_membership() from public, anon;
grant execute on function public.get_current_membership() to authenticated;

notify pgrst, 'reload schema';
commit;
