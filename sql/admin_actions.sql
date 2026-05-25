create table if not exists public.admin_actions (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  actor text, -- opcional (ex: email ou user id)
  ip text,
  route text not null,
  method text not null,
  action text, -- chave curta ex: generate_post, publish_post, schedule_event
  payload jsonb
);
create index if not exists idx_admin_actions_created_at on public.admin_actions(created_at desc);
