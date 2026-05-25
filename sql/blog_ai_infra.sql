-- Infraestrutura de sessões IA, agendamento e histórico de cobertura

create table if not exists public.ai_generation_sessions (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  phase text not null default 'outline', -- outline|expand|enrich|finalize|done|error
  progress int not null default 0 check (progress between 0 and 100),
  status text not null default 'active', -- active|completed|error
  error_message text,
  post_id uuid references public.blog_posts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.ai_generation_sessions_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;$$;

drop trigger if exists t_ai_generation_sessions_touch on public.ai_generation_sessions;
create trigger t_ai_generation_sessions_touch before update on public.ai_generation_sessions
for each row execute function public.ai_generation_sessions_touch();

-- Agendamentos (eventos adicionais além de scheduled_at do post)
create table if not exists public.blog_post_schedule_events (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.blog_posts(id) on delete cascade,
  run_at timestamptz not null,
  action text not null, -- publish|update|custom
  payload jsonb,
  executed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_blog_post_schedule_events_run_at on public.blog_post_schedule_events(run_at asc);

-- Histórico de cobertura de clusters
create table if not exists public.blog_coverage_history (
  id bigserial primary key,
  snapshot_at timestamptz not null default now(),
  covered int not null,
  total int not null,
  percent int not null,
  missing jsonb
);
create index if not exists idx_blog_coverage_history_snapshot on public.blog_coverage_history(snapshot_at desc);
