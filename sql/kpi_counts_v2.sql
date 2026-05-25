create or replace function public.kpi_counts_v2(tz text, days integer, source text default null)
returns table(
  leads_today int,
  leads_period int,
  contacted_period int,
  contracts_period int,
  puppies_available int,
  sla_min int
)
language sql stable
as $$
  with bounds as (
    select (now() at time zone tz) as local_now
  ),
  range as (
    select
      (date_trunc('day', (select local_now from bounds)) at time zone tz) as today_start_utc,
      ((date_trunc('day', (select local_now from bounds)) - make_interval(days => days - 1)) at time zone tz) as period_start_utc
  ),
  leads_filtered as (
    select *
    from leads
    where created_at >= (select period_start_utc from range)
      and (source is null or utm_source = source)
  ),
  leads_today_tz as (
    select *
    from leads
    where created_at >= (select today_start_utc from range)
      and (source is null or utm_source = source)
  ),
  contacts as (
    select count(*)::int as c
    from leads_filtered
    where first_responded_at is not null
  ),
  contracts_f as (
    select count(*)::int as c
    from contracts ct
    left join leads l on l.id = ct.lead_id
    where ct.signed_at >= (select period_start_utc from range)
      and (source is null or l.utm_source = source)
  ),
  sla_calc as (
    select round(avg(extract(epoch from (first_responded_at - created_at))/60.0))::int as avg_min
    from leads_filtered
    where first_responded_at is not null
  )
  select
    (select count(*) from leads_today_tz)                                           as leads_today,
    (select count(*) from leads_filtered)                                           as leads_period,
    (select c from contacts)                                                        as contacted_period,
    (select c from contracts_f)                                                     as contracts_period,
    (select count(*) from puppies where status::text in ('disponivel','available')) as puppies_available,
    coalesce((select avg_min from sla_calc), 0)                                     as sla_min;
$$;

grant execute on function public.kpi_counts_v2(text, integer, text) to anon, authenticated;
