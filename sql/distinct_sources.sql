create or replace function public.distinct_sources(tz text, days integer)
returns table(source text)
language sql stable
as $$
  with period_start as (
    select ((date_trunc('day', (now() at time zone tz)) - make_interval(days => days - 1)) at time zone tz) as ts
  )
  select coalesce(utm_source, 'direct')::text as source
  from leads
  where created_at >= (select ts from period_start)
  group by 1
  order by 1;
$$;

grant execute on function public.distinct_sources(text, integer) to anon, authenticated;
