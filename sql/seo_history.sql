-- Histórico de ações do AutopilotSEO
create table if not exists public.seo_history (
  id uuid primary key default gen_random_uuid(),
  route text not null,
  action text not null,
  before jsonb,
  after jsonb,
  applied_by text default 'autopilot',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.set_seo_history_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_seo_history_updated_at on public.seo_history;
create trigger trg_seo_history_updated_at
before update on public.seo_history
for each row execute function public.set_seo_history_updated_at();
