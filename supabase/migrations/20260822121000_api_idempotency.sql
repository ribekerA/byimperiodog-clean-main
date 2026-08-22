-- Deduplicacao atomica para POSTs que podem disparar efeitos externos.
-- A chave persistida e scope + SHA-256; o valor enviado pelo navegador nao e
-- armazenado em texto puro.

create table if not exists public.api_idempotency_keys (
  key text primary key,
  status text not null check (status in ('processing', 'completed')),
  response_status integer,
  response_body jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists api_idempotency_keys_expires_at_idx
  on public.api_idempotency_keys (expires_at);

alter table public.api_idempotency_keys enable row level security;

create or replace function public.begin_api_idempotent_request(
  p_key text,
  p_processing_seconds integer default 120
)
returns table (state text, response_status integer, response_body jsonb)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_inserted integer;
  v_row public.api_idempotency_keys%rowtype;
begin
  if p_key is null or length(p_key) = 0 or length(p_key) > 300 then
    raise exception 'invalid idempotency key';
  end if;
  if p_processing_seconds < 10 or p_processing_seconds > 3600 then
    raise exception 'invalid processing window';
  end if;

  delete from public.api_idempotency_keys
  where ctid in (
    select ctid from public.api_idempotency_keys
    where expires_at <= v_now
    limit 100
  );

  insert into public.api_idempotency_keys as keys (
    key, status, expires_at
  ) values (
    p_key, 'processing', v_now + make_interval(secs => p_processing_seconds)
  )
  on conflict (key) do nothing;
  get diagnostics v_inserted = row_count;

  if v_inserted = 1 then
    return query select 'acquired'::text, null::integer, null::jsonb;
    return;
  end if;

  select * into v_row
  from public.api_idempotency_keys
  where key = p_key
  for update;

  if v_row.status = 'completed' and v_row.expires_at > v_now then
    return query select 'completed'::text, v_row.response_status, v_row.response_body;
    return;
  end if;

  if v_row.status = 'processing' and v_row.expires_at > v_now then
    return query select 'in_progress'::text, null::integer, null::jsonb;
    return;
  end if;

  update public.api_idempotency_keys
  set status = 'processing',
      response_status = null,
      response_body = null,
      updated_at = v_now,
      expires_at = v_now + make_interval(secs => p_processing_seconds)
  where key = p_key;

  return query select 'acquired'::text, null::integer, null::jsonb;
end;
$$;

create or replace function public.complete_api_idempotent_request(
  p_key text,
  p_response_status integer,
  p_response_body jsonb,
  p_ttl_seconds integer default 86400
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_response_status < 200 or p_response_status > 599 then
    raise exception 'invalid response status';
  end if;
  if p_ttl_seconds < 60 or p_ttl_seconds > 604800 then
    raise exception 'invalid idempotency ttl';
  end if;

  update public.api_idempotency_keys
  set status = 'completed',
      response_status = p_response_status,
      response_body = p_response_body,
      updated_at = clock_timestamp(),
      expires_at = clock_timestamp() + make_interval(secs => p_ttl_seconds)
  where key = p_key and status = 'processing';
end;
$$;

create or replace function public.release_api_idempotent_request(p_key text)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  delete from public.api_idempotency_keys
  where key = p_key and status = 'processing';
$$;

revoke all on table public.api_idempotency_keys from public, anon, authenticated;
revoke all on function public.begin_api_idempotent_request(text, integer) from public, anon, authenticated;
revoke all on function public.complete_api_idempotent_request(text, integer, jsonb, integer) from public, anon, authenticated;
revoke all on function public.release_api_idempotent_request(text) from public, anon, authenticated;
grant execute on function public.begin_api_idempotent_request(text, integer) to service_role;
grant execute on function public.complete_api_idempotent_request(text, integer, jsonb, integer) to service_role;
grant execute on function public.release_api_idempotent_request(text) to service_role;
