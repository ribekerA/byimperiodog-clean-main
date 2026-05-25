-- Previsões de demanda por cor/sexo para próximas 4 semanas
create table if not exists public.demand_predictions (
  id uuid primary key default gen_random_uuid(),
  color text,
  sex text,
  week_start_date date,
  week_end_date date,
  predicted_leads numeric,
  predicted_shortage boolean,
  recommendation text,
  risk_alert text,
  features jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.set_demand_predictions_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_demand_predictions_updated_at on public.demand_predictions;
create trigger trg_demand_predictions_updated_at
before update on public.demand_predictions
for each row execute function public.set_demand_predictions_updated_at();
