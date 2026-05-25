-- Tabela para armazenar recomendações de preço da IA
create table if not exists public.puppy_pricing_ai (
  id uuid primary key default gen_random_uuid(),
  puppy_id uuid not null references public.puppies(id) on delete cascade,
  price_min_cents integer,
  price_ideal_cents integer,
  price_max_cents integer,
  prob_sale_at_current numeric,
  alert text,
  reasoning text,
  features jsonb,
  computed_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (puppy_id)
);

create or replace function public.set_puppy_pricing_ai_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_puppy_pricing_ai_updated_at on public.puppy_pricing_ai;
create trigger trg_puppy_pricing_ai_updated_at
before update on public.puppy_pricing_ai
for each row execute function public.set_puppy_pricing_ai_updated_at();
