-- Tabela de inteligência para leads
create table if not exists public.lead_ai_insights (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid unique not null references public.leads(id) on delete cascade,
  intent text, -- alta|media|baixa
  urgency text, -- alta|media|baixa
  risk text, -- alto|medio|baixo
  score integer, -- 0-100
  desired_color text,
  desired_sex text,
  desired_city text,
  desired_timeframe text,
  budget_inferred text,
  emotional_tone text,
  matched_puppy_id uuid references public.puppies(id),
  suggested_puppies jsonb,
  alerts jsonb,
  next_step text,
  insights jsonb,
  processed_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.set_lead_ai_insights_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_lead_ai_insights_updated_at on public.lead_ai_insights;
create trigger trg_lead_ai_insights_updated_at
before update on public.lead_ai_insights
for each row execute function public.set_lead_ai_insights_updated_at();
