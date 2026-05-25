-- Tabela de configuração administrativa (marcas, funil, SEO)
create table if not exists public.admin_config (
  id text primary key,
  brand_name text,
  brand_tagline text,
  contact_email text,
  contact_phone text,
  instagram text,
  tiktok text,
  whatsapp_message text,
  template_first_contact text,
  template_followup text,
  avg_response_minutes integer,
  followup_rules text,
  seo_title_default text,
  seo_description_default text,
  seo_meta_tags text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Inserção/seed única (id = 'default') se não existir
insert into public.admin_config (id, brand_name, brand_tagline)
values ('default', 'By Império Dog', 'Curadoria premium de Spitz Alemão')
on conflict (id) do nothing;

-- Trigger simples para updated_at
create or replace function public.set_admin_config_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_admin_config_updated_at on public.admin_config;
create trigger trg_admin_config_updated_at
before update on public.admin_config
for each row execute function public.set_admin_config_updated_at();
