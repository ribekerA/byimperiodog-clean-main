-- Experiments A/B tables for testing and optimizations

create table if not exists public.experiments (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  name text not null,
  description text,
  status text not null default 'draft', -- 'draft'|'running'|'paused'|'completed'
  audience text, -- optional targeting rules (JSON or simple tag)
  variants jsonb not null default '[]'::jsonb, -- array of { key, label, weight }
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_experiments_status on public.experiments (status);
create index if not exists idx_experiments_key on public.experiments (key);

drop trigger if exists t_experiments_touch on public.experiments;
create trigger t_experiments_touch before update on public.experiments
for each row execute function public._touch_updated_at();

comment on table public.experiments is 'A/B tests and experiments configuration';
comment on column public.experiments.key is 'Unique identifier used in tracking events';
comment on column public.experiments.variants is 'Array of variant definitions with keys, labels, and traffic weights';
