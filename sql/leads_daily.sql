create or replace function public.leads_daily(from_ts timestamptz)
returns table(day date, value bigint)
language sql stable
as $$
  select date_trunc('day', created_at)::date as day,
         count(*)::bigint as value
  from leads
  where created_at >= from_ts
  group by 1
  order by 1;
$$;

revoke all on function public.leads_daily(timestamptz) from public;
grant execute on function public.leads_daily(timestamptz) to anon, authenticated;
