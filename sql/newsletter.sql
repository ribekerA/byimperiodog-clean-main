-- Tabela para inscrições de newsletter
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

-- Índice opcional para buscas por email (case-insensitive)
-- create unique index if not exists newsletter_email_unique on public.newsletter_subscribers (lower(email));

