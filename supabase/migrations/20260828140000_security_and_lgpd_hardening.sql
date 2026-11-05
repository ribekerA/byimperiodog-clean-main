-- Dados pessoais e segredos só são acessados pelas rotas server-side com
-- service_role. REVOKE também neutraliza policies permissivas antigas.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'admin_users', 'admin_actions', 'leads', 'contracts', 'customers',
    'integrations', 'tracking_settings', 'pixels_settings',
    'newsletter_subscribers', 'webhooks', 'webhook_deliveries',
    'autosales_sequences', 'autosales_logs', 'ai_generation_sessions',
    'webhook_outbox'
  ] loop
    if to_regclass('public.' || quote_ident(table_name)) is not null then
      execute format('alter table public.%I enable row level security', table_name);
      execute format('revoke all privileges on table public.%I from anon, authenticated', table_name);
    end if;
  end loop;
end
$$;

-- Evidência mínima e auditável do consentimento da newsletter.
alter table if exists public.newsletter_subscribers
  add column if not exists consent_lgpd boolean not null default false,
  add column if not exists consent_version text,
  add column if not exists consent_timestamp timestamptz,
  add column if not exists source text,
  add column if not exists unsubscribed_at timestamptz;

-- Consolida duas migrações antigas que estavam soltas em /sql e, portanto,
-- não eram aplicadas pelo fluxo oficial do Supabase CLI.
alter table if exists public.contracts
  alter column puppy_id drop not null,
  add column if not exists expires_at timestamptz default (now() + interval '90 days');
update public.contracts
set expires_at = now() + interval '90 days'
where expires_at is null and status <> 'assinado';

-- Documentos contratuais nunca devem possuir URL pública permanente.
update storage.buckets set public = false where id = 'contracts';

drop policy if exists "contracts_private_defense" on storage.objects;
create policy "contracts_private_defense"
on storage.objects
as restrictive
for all
to anon, authenticated
using (bucket_id <> 'contracts')
with check (bucket_id <> 'contracts');

comment on policy "contracts_private_defense" on storage.objects is
  'Bloqueia acesso direto a documentos contratuais; somente URLs temporárias emitidas pelo servidor são válidas.';

-- Deduplicação durável de webhooks entre instâncias serverless.
create table if not exists public.webhook_receipts (
  provider text not null check (char_length(provider) between 1 and 40),
  event_id text not null check (char_length(event_id) between 1 and 300),
  received_at timestamptz not null default now(),
  primary key (provider, event_id)
);
alter table public.webhook_receipts enable row level security;
revoke all privileges on table public.webhook_receipts from public, anon, authenticated;

create or replace function public.claim_webhook_event(p_provider text, p_event_id text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  inserted_count integer;
begin
  if char_length(p_provider) not between 1 and 40 or char_length(p_event_id) not between 1 and 300 then
    return false;
  end if;
  delete from public.webhook_receipts where received_at < now() - interval '14 days';
  insert into public.webhook_receipts(provider, event_id)
  values (p_provider, p_event_id)
  on conflict do nothing;
  get diagnostics inserted_count = row_count;
  return inserted_count = 1;
end;
$$;

revoke all on function public.claim_webhook_event(text, text) from public, anon, authenticated;
grant execute on function public.claim_webhook_event(text, text) to service_role;
