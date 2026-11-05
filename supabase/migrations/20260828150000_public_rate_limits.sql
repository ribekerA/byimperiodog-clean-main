-- Limite distribuido para endpoints publicos de escrita e de custo elevado.
-- A aplicacao envia apenas HMAC-SHA256 de escopo + IP; nenhum IP e persistido.

create table if not exists public.public_rate_limits (
  key_hash text primary key check (key_hash ~ '^[0-9a-f]{64}$'),
  requests integer not null default 0 check (requests >= 0),
  window_started_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);

alter table public.public_rate_limits enable row level security;
revoke all on table public.public_rate_limits from public, anon, authenticated;

create or replace function public.consume_public_rate_limit(
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns table(allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_time timestamptz := clock_timestamp();
  current_row public.public_rate_limits%rowtype;
begin
  if p_key_hash !~ '^[0-9a-f]{64}$'
     or p_limit < 1 or p_limit > 100000
     or p_window_seconds < 1 or p_window_seconds > 604800 then
    raise exception 'invalid public rate limit parameters';
  end if;

  insert into public.public_rate_limits as limits (
    key_hash,
    requests,
    window_started_at,
    updated_at
  )
  values (p_key_hash, 1, current_time, current_time)
  on conflict (key_hash) do update
  set requests = case
        when limits.window_started_at <= current_time - make_interval(secs => p_window_seconds)
          then 1
        else limits.requests + 1
      end,
      window_started_at = case
        when limits.window_started_at <= current_time - make_interval(secs => p_window_seconds)
          then current_time
        else limits.window_started_at
      end,
      updated_at = current_time
  returning * into current_row;

  -- Limpeza probabilistica evita crescimento indefinido sem pagar um DELETE
  -- em toda requisicao. O maior periodo aceito e de sete dias.
  if random() < 0.005 then
    delete from public.public_rate_limits
    where updated_at < current_time - interval '8 days';
  end if;

  if current_row.requests <= p_limit then
    return query select true, 0;
  else
    return query select
      false,
      greatest(
        1,
        ceil(extract(epoch from (
          current_row.window_started_at
          + make_interval(secs => p_window_seconds)
          - current_time
        )))::integer
      );
  end if;
end;
$$;

revoke all on function public.consume_public_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_public_rate_limit(text, integer, integer) to service_role;
