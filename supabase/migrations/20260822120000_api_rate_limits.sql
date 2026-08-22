-- Rate limit compartilhado entre instancias serverless.
-- Os identificadores recebidos pela funcao ja chegam como hashes SHA-256; o IP
-- original nunca e persistido nesta tabela.

create table if not exists public.api_rate_limits (
  key text primary key,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count >= 0),
  expires_at timestamptz not null
);

create index if not exists api_rate_limits_expires_at_idx
  on public.api_rate_limits (expires_at);

alter table public.api_rate_limits enable row level security;

-- Sem policies de proposito: anon/authenticated nao podem ler nem gravar os
-- contadores. A aplicacao chama a funcao abaixo com a service_role.

create or replace function public.consume_api_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns table (allowed boolean, remaining integer, reset_at timestamptz)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_window interval;
begin
  if p_key is null or length(p_key) = 0 or length(p_key) > 300 then
    raise exception 'invalid rate-limit key';
  end if;
  if p_limit < 1 or p_limit > 100000 then
    raise exception 'invalid rate-limit limit';
  end if;
  if p_window_seconds < 1 or p_window_seconds > 2678400 then
    raise exception 'invalid rate-limit window';
  end if;

  v_window := make_interval(secs => p_window_seconds);

  -- Limpeza incremental evita crescimento ilimitado sem exigir pg_cron.
  delete from public.api_rate_limits
  where ctid in (
    select ctid
    from public.api_rate_limits
    where expires_at <= v_now
    limit 100
  );

  return query
  insert into public.api_rate_limits as limits (
    key,
    window_started_at,
    request_count,
    expires_at
  ) values (
    p_key,
    v_now,
    1,
    v_now + v_window
  )
  on conflict (key) do update
  set
    window_started_at = case
      when limits.expires_at <= v_now then v_now
      else limits.window_started_at
    end,
    request_count = case
      when limits.expires_at <= v_now then 1
      else limits.request_count + 1
    end,
    expires_at = case
      when limits.expires_at <= v_now then v_now + v_window
      else limits.expires_at
    end
  returning
    limits.request_count <= p_limit,
    greatest(p_limit - limits.request_count, 0),
    limits.expires_at;
end;
$$;

revoke all on table public.api_rate_limits from public, anon, authenticated;
revoke all on function public.consume_api_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text, integer, integer) to service_role;
