-- Catalog AI Analytics events table (idempotent)
create table if not exists public.catalog_ai_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null, -- reorder|badge_click|personalization|seo_title|seo_description
  puppy_id uuid,
  user_session text,
  badge text,
  old_position int,
  new_position int,
  ctr_before numeric,
  ctr_after numeric,
  dwell_before_ms int,
  dwell_after_ms int,
  personalized boolean,
  clicked boolean,
  created_at timestamptz default now()
);

create index if not exists idx_catalog_ai_events_type_created on public.catalog_ai_events(event_type, created_at desc);
create index if not exists idx_catalog_ai_events_puppy on public.catalog_ai_events(puppy_id);

-- Simple metrics view (optional)
create or replace view public.catalog_ai_metrics as
select
  event_type,
  count(*) as total,
  avg(ctr_after - coalesce(ctr_before, 0)) as avg_ctr_delta,
  avg(dwell_after_ms - coalesce(dwell_before_ms, 0)) as avg_dwell_delta
from public.catalog_ai_events
group by event_type;
