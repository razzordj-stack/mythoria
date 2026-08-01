begin;

create or replace function public.get_ai_operations_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path=public
as $$
begin
  if not public.is_admin(array['super_admin','content_admin','moderator']) then
    raise exception 'admin access required';
  end if;

  return jsonb_build_object(
    'requests24h', (select count(*) from public.adventure_turn_requests where created_at >= now() - interval '24 hours'),
    'completed24h', (select count(*) from public.adventure_turn_requests where created_at >= now() - interval '24 hours' and status = 'completed'),
    'failed24h', (select count(*) from public.adventure_turn_requests where created_at >= now() - interval '24 hours' and status = 'failed'),
    'requests7d', (select count(*) from public.adventure_turn_requests where created_at >= now() - interval '7 days'),
    'completed7d', (select count(*) from public.adventure_turn_requests where created_at >= now() - interval '7 days' and status = 'completed'),
    'failed7d', (select count(*) from public.adventure_turn_requests where created_at >= now() - interval '7 days' and status = 'failed'),
    'inputTokens7d', (select coalesce(sum(input_tokens), 0) from public.adventure_ai_usage where created_at >= now() - interval '7 days'),
    'outputTokens7d', (select coalesce(sum(output_tokens), 0) from public.adventure_ai_usage where created_at >= now() - interval '7 days'),
    'averageDurationMs7d', (select coalesce(round(avg(duration_ms))::integer, 0) from public.adventure_ai_usage where created_at >= now() - interval '7 days'),
    'models', (
      select coalesce(jsonb_agg(jsonb_build_object('provider', provider, 'model', model, 'requests', requests) order by requests desc), '[]'::jsonb)
      from (
        select provider, model, count(*) as requests
        from public.adventure_ai_usage
        where created_at >= now() - interval '7 days'
        group by provider, model
      ) grouped_models
    ),
    'recentFailures', (
      select coalesce(jsonb_agg(jsonb_build_object('errorCode', error_code, 'count', failure_count) order by failure_count desc), '[]'::jsonb)
      from (
        select coalesce(error_code, 'unknown') as error_code, count(*) as failure_count
        from public.adventure_turn_requests
        where created_at >= now() - interval '7 days' and status = 'failed'
        group by error_code
        order by failure_count desc
        limit 5
      ) failures
    )
  );
end;
$$;

revoke all on function public.get_ai_operations_overview() from public, anon;
grant execute on function public.get_ai_operations_overview() to authenticated;

notify pgrst, 'reload schema';
commit;
