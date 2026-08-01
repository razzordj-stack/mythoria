begin;
alter table public.player_memberships add column if not exists stripe_customer_id text unique, add column if not exists stripe_subscription_id text unique;
commit;
