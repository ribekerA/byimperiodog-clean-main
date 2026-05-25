create or replace function public.leads_daily_tz_v2(tz text, days integer, source text default null)
returns table(day date, value bigint)
language sql stable
as $$
  with bounds as (
    select (date_trunc('day', (now() at time zone tz)) at time zone tz)::date as today
  ),
  series as (
    select generate_series((select today from bounds) - (days - 1), (select today from bounds), interval '1 day')::date as d
  ),
  counts as (
    select (created_at at time zone tz)::date as d, count(*)::bigint as c
    from leads
    where created_at >= ((select today from bounds) - (days - 1))::timestamp
      and (source is null or utm_source = source)
    group by 1
  )
  select s.d as day, coalesce(c.c, 0) as value
  from series s
  left join counts c on c.d = s.d
  order by s.d;
$$;

grant execute on function public.leads_daily_tz_v2(text, integer, text) to anon, authenticated;
