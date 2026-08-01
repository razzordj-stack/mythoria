begin;

-- Party changes are delivered only after the existing RLS policies allow a user
-- to see the affected row. This makes the social dashboard update for invited
-- players and party members without exposing other groups.
do $$ begin
  alter publication supabase_realtime add table public.multiplayer_parties;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.multiplayer_party_members;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.multiplayer_party_invites;
exception when duplicate_object then null;
end $$;

commit;
