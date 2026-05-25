-- SEO independence layer: rules, overrides, suggestions

-- Global and scoped rules. scope examples: 'global','post','tag','category','page'
create table if not exists public.seo_rules (
  id uuid primary key default gen_random_uuid(),
  scope text not null,
  scope_ref text, -- optional (e.g., page path) or uuid as text
  rules_json jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists t_seo_rules_touch on public.seo_rules;
create trigger t_seo_rules_touch before update on public.seo_rules
for each row execute function public._touch_updated_at();

create index if not exists idx_seo_rules_scope on public.seo_rules (scope, active);

-- Final explicit overrides, one per entity
create table if not exists public.seo_overrides (
  entity_type text not null, -- 'post','tag','category','page'
  entity_id uuid,           -- null for pages referenced by slug in entity_ref
  entity_ref text,          -- optional ref like page path
  data_json jsonb not null default '{}'::jsonb, -- { title, description, canonical, og_image_url, robots, ... }
  updated_by uuid,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint seo_overrides_uniq unique (entity_type, entity_id, entity_ref)
);

create index if not exists idx_seo_overrides_entity on public.seo_overrides (entity_type, entity_id);

-- AI suggestions store with approval
create table if not exists public.seo_suggestions (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid,
  entity_ref text,
  data_json jsonb not null, -- suggestion payload
  score numeric,            -- optional quality score
  status text not null default 'proposed', -- 'proposed'|'approved'|'rejected'
  created_by uuid,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_seo_suggestions_entity on public.seo_suggestions (entity_type, entity_id, status, created_at desc);

-- Redirects table
create table if not exists public.redirects (
  from_path text primary key,
  to_url text not null,
  type text not null default 'permanent', -- 'permanent'|'temporary'
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Outbox for cache invalidation/webhooks
create table if not exists public.webhook_outbox (
  id uuid primary key default gen_random_uuid(),
  event text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending', -- 'pending'|'sent'|'failed'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists t_webhook_outbox_touch on public.webhook_outbox;
create trigger t_webhook_outbox_touch before update on public.webhook_outbox
for each row execute function public._touch_updated_at();

