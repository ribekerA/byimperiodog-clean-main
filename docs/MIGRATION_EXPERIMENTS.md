# 🚀 Guia: Aplicar Migração de Experimentos A/B

## 📋 Passo a Passo

### 1. Acessar Supabase Dashboard

1. Abra o navegador e vá para: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione o projeto **byimperiodog-clean** (ou o nome do seu projeto)

### 2. Abrir SQL Editor

1. No menu lateral esquerdo, clique em **SQL Editor** (ícone de código)
2. Clique em **+ New query** (botão no canto superior direito)

### 3. Copiar e Colar o SQL

Copie o conteúdo abaixo e cole no SQL Editor:

```sql
-- Experiments A/B tables for testing and optimizations

create table if not exists public.experiments (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  name text not null,
  description text,
  status text not null default 'draft', -- 'draft'|'running'|'paused'|'completed'
  audience text, -- optional targeting rules (JSON or simple tag)
  variants jsonb not null default '[]'::jsonb, -- array of { key, label, weight }
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_experiments_status on public.experiments (status);
create index if not exists idx_experiments_key on public.experiments (key);

drop trigger if exists t_experiments_touch on public.experiments;
create trigger t_experiments_touch before update on public.experiments
for each row execute function public._touch_updated_at();

comment on table public.experiments is 'A/B tests and experiments configuration';
comment on column public.experiments.key is 'Unique identifier used in tracking events';
comment on column public.experiments.variants is 'Array of variant definitions with keys, labels, and traffic weights';
```

### 4. Executar a Migração

1. Clique no botão **Run** (ou pressione `Ctrl+Enter` / `Cmd+Enter`)
2. Aguarde a execução (deve levar 1-2 segundos)
3. Verifique se apareceu a mensagem de sucesso: ✅ **Success. No rows returned**

### 5. Verificar Tabela Criada

1. No menu lateral, clique em **Table Editor**
2. Procure a tabela **experiments** na lista
3. Deve aparecer com as seguintes colunas:
   - `id` (uuid)
   - `key` (text)
   - `name` (text)
   - `description` (text)
   - `status` (text)
   - `audience` (text)
   - `variants` (jsonb)
   - `starts_at` (timestamptz)
   - `ends_at` (timestamptz)
   - `created_at` (timestamptz)
   - `updated_at` (timestamptz)

### 6. Configurar RLS (Row Level Security) - OPCIONAL

Se quiser restringir acesso:

```sql
-- Permitir leitura pública de experimentos ativos
alter table public.experiments enable row level security;

create policy "Experiments públicos são visíveis"
  on public.experiments for select
  using (status = 'running');

-- Admin pode fazer tudo (requer autenticação)
create policy "Admin full access"
  on public.experiments
  using (auth.role() = 'service_role');
```

## ✅ Validação

Após aplicar a migração, execute este SQL para testar:

```sql
-- Inserir experimento de teste
insert into public.experiments (key, name, description, status, variants)
values (
  'test-experiment',
  'Teste de A/B',
  'Experimento de teste para validação',
  'draft',
  '[
    {"key": "control", "label": "Controle", "weight": 50},
    {"key": "variant-a", "label": "Variante A", "weight": 50}
  ]'::jsonb
);

-- Verificar se foi criado
select id, key, name, status, variants from public.experiments;

-- Limpar teste (opcional)
-- delete from public.experiments where key = 'test-experiment';
```

## 🎯 Próximos Passos

Após confirmar que a tabela foi criada com sucesso:

1. ✅ Tabela `experiments` criada
2. ⏭️ Executar seed: `npm run seed`
3. ⏭️ Acessar `/admin/experiments` para gerenciar

## ❓ Troubleshooting

### Erro: "function public._touch_updated_at() does not exist"

Execute primeiro:

```sql
create or replace function public._touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
```

### Erro: "permission denied"

Certifique-se de estar usando uma conta com permissões de admin no Supabase.

---

**Pronto para o próximo passo?** 
Depois de aplicar a migração, volte aqui e executaremos: `npm run seed` 🚀
