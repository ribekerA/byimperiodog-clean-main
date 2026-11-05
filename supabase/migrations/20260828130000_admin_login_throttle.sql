-- Bloqueio distribuido de tentativas de login administrativo.
-- Somente a service role pode executar as funcoes; IP e e-mail chegam como
-- HMAC-SHA256, nunca em texto puro.

create table if not exists public.admin_login_throttle (
  key_hash text primary key check (key_hash ~ '^[0-9a-f]{64}$'),
  attempts integer not null default 0 check (attempts >= 0),
  window_started_at timestamptz not null default clock_timestamp(),
  blocked_until timestamptz,
  updated_at timestamptz not null default clock_timestamp()
);

alter table public.admin_login_throttle enable row level security;
revoke all on table public.admin_login_throttle from anon, authenticated;

create or replace function public.consume_admin_login_attempt(
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer,
  p_block_seconds integer
)
returns table(allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_row public.admin_login_throttle%rowtype;
  current_time timestamptz := clock_timestamp();
begin
  if p_key_hash !~ '^[0-9a-f]{64}$' or p_limit < 1 or p_window_seconds < 1 or p_block_seconds < 1 then
    raise exception 'invalid throttle parameters';
  end if;

  select * into current_row
  from public.admin_login_throttle
  where key_hash = p_key_hash
  for update;

  if not found then
    insert into public.admin_login_throttle (key_hash, attempts, window_started_at, updated_at)
    values (p_key_hash, 1, current_time, current_time);
    return query select true, 0;
    return;
  end if;

  if current_row.blocked_until is not null and current_row.blocked_until > current_time then
    return query select false, greatest(1, ceil(extract(epoch from current_row.blocked_until - current_time))::integer);
    return;
  end if;

  if current_row.window_started_at <= current_time - make_interval(secs => p_window_seconds) then
    update public.admin_login_throttle
    set attempts = 1, window_started_at = current_time, blocked_until = null, updated_at = current_time
    where key_hash = p_key_hash;
    return query select true, 0;
    return;
  end if;

  if current_row.attempts >= p_limit then
    update public.admin_login_throttle
    set blocked_until = current_time + make_interval(secs => p_block_seconds), updated_at = current_time
    where key_hash = p_key_hash;
    return query select false, p_block_seconds;
    return;
  end if;

  update public.admin_login_throttle
  set attempts = attempts + 1, blocked_until = null, updated_at = current_time
  where key_hash = p_key_hash;
  return query select true, 0;
end;
$$;

create or replace function public.clear_admin_login_attempt(p_key_hash text)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  delete from public.admin_login_throttle where key_hash = p_key_hash;
$$;

revoke all on function public.consume_admin_login_attempt(text, integer, integer, integer) from public, anon, authenticated;
revoke all on function public.clear_admin_login_attempt(text) from public, anon, authenticated;
grant execute on function public.consume_admin_login_attempt(text, integer, integer, integer) to service_role;
grant execute on function public.clear_admin_login_attempt(text) to service_role;
