create table if not exists public.autosales_sequences (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  puppy_id uuid references public.puppies(id) on delete set null,
  tone text,
  urgency text,
  status text not null default 'scheduled',
  next_step text,
  next_run_at timestamptz,
  step_index integer not null default 0,
  total_steps integer not null default 0,
  fallback_required boolean not null default false,
  fallback_reason text,
  bypass_human boolean not null default false,
  metrics jsonb not null default '{}',
  strategy jsonb not null default '{}',
  last_message_type text,
  last_message_sent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_autosales_sequences_lead on public.autosales_sequences (lead_id);
create index if not exists idx_autosales_sequences_status_run on public.autosales_sequences (status, next_run_at);

create table if not exists public.autosales_logs (
  id uuid primary key default uuid_generate_v4(),
  sequence_id uuid not null references public.autosales_sequences(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  puppy_id uuid references public.puppies(id) on delete set null,
  message_type text not null,
  content text not null,
  cta_link text,
  status text not null default 'queued',
  error text,
  metadata jsonb not null default '{}',
  objections text[] default array[]::text[],
  sent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_autosales_logs_sequence on public.autosales_logs (sequence_id);
create index if not exists idx_autosales_logs_lead on public.autosales_logs (lead_id);

create or replace function public.set_autosales_sequences_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_autosales_sequences_updated_at on public.autosales_sequences;
create trigger trg_autosales_sequences_updated_at
before update on public.autosales_sequences
for each row execute function public.set_autosales_sequences_updated_at();
