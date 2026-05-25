# Supabase — Guia de Desenvolvimento Local

Este documento explica como usar o Supabase CLI para desenvolver localmente com banco de dados PostgreSQL embutido, autenticação, storage e edge functions.

---

## 📋 Pré-requisitos

- **Supabase CLI** instalado (via Scoop no Windows ou npm/homebrew em outros sistemas)
- **Docker Desktop** rodando (necessário para containers locais do Supabase)
- Projeto Supabase linkado (arquivo `supabase/config.toml` já configurado)

---

## 🚀 Comandos Disponíveis

### Iniciar ambiente local

```bash
npm run supabase:start
```

Isso inicia:
- PostgreSQL local na porta `54322`
- Supabase Studio na porta `54323` (UI admin: http://127.0.0.1:54323)
- API local na porta `54321`
- Inbucket (teste de emails) na porta `54324`

**URLs geradas:**
- API URL: `http://127.0.0.1:54321`
- Studio URL: `http://127.0.0.1:54323`
- DB URL: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

**Credenciais padrão locais:**
- `anon key`: exibida no terminal após `supabase start`
- `service_role key`: exibida no terminal após `supabase start`

Copie essas keys e adicione ao seu `.env.local` (veja seção **Configuração de Variáveis** abaixo).

---

### Parar ambiente local

```bash
npm run supabase:stop
```

Para e remove os containers Docker do Supabase. Dados persistem em volumes Docker a menos que você use `--no-backup`.

---

### Resetar banco de dados local

```bash
npm run supabase:db:reset
```

**O que faz:**
1. Derruba o banco local
2. Recria do zero
3. Aplica todas as migrações em `supabase/migrations/` (em ordem)
4. Executa seeds em `supabase/seed.sql` (se existir)

**Use quando:**
- Quiser limpar completamente o estado local
- Adicionar novas migrações e quiser testá-las do zero
- Reverter mudanças experimentais

⚠️ **Atenção:** todos os dados locais serão perdidos.

---

### Aplicar migrações ao banco remoto

```bash
npm run supabase:db:push
```

**O que faz:**
- Envia migrações locais (`supabase/migrations/*.sql`) para o banco remoto linkado
- Útil após desenvolver novas tabelas/funções localmente e validar

⚠️ **Atenção:** certifique-se de testar migrações localmente antes de fazer push para produção.

---

### Gerar tipos TypeScript atualizados

```bash
npm run supabase:types
```

**O que faz:**
- Lê o schema do banco **local** (após `supabase start`)
- Gera tipos TypeScript em `src/types/supabase.ts`
- Mantém a tipagem sincronizada com as tabelas e views do DB

**Quando rodar:**
- Após criar/alterar tabelas, views ou funções
- Após resetar o banco (`db:reset`) com novas migrações
- Antes de commitar mudanças de schema

---

## 🛠️ Fluxo de Trabalho Típico

### 1. Iniciar desenvolvimento

```bash
# Inicie o Supabase local
npm run supabase:start

# Em outro terminal, inicie o Next.js
npm run dev
```

Acesse:
- Next.js: http://localhost:3000
- Supabase Studio: http://127.0.0.1:54323

---

### 2. Criar uma migração

```bash
# Gera um novo arquivo de migração SQL
supabase migration new add_puppies_table
```

Edite o arquivo gerado em `supabase/migrations/<timestamp>_add_puppies_table.sql`:

```sql
create table public.puppies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  breed text,
  status text check (status in ('disponivel', 'reservado', 'vendido', 'indisponivel')),
  created_at timestamptz default now()
);
```

---

### 3. Aplicar a migração localmente

```bash
npm run supabase:db:reset
```

Valide no Studio (http://127.0.0.1:54323) se a tabela foi criada.

---

### 4. Gerar tipos TypeScript

```bash
npm run supabase:types
```

Isso atualiza `src/types/supabase.ts` com os tipos de `puppies`.

---

### 5. Enviar para produção

Após validar localmente:

```bash
# Faz push das migrações para o projeto remoto
npm run supabase:db:push

# Gera tipos do banco remoto (opcional, se preferir types de prod)
supabase gen types typescript --linked > src/types/supabase.ts
```

---

## ⚙️ Configuração de Variáveis de Ambiente

### `.env.local` (desenvolvimento local)

Crie/atualize `.env.local` com as credenciais geradas por `supabase start`:

```dotenv
# --------------------------
# Supabase REMOTO (produção)
# --------------------------
NEXT_PUBLIC_SUPABASE_URL=https://npmnuihgydadihktglrd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...seu_anon_key_remoto
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...seu_service_role_key_remoto

# --------------------------
# Supabase LOCAL (dev)
# --------------------------
# Descomente para usar o ambiente local:
# NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...anon_key_local_do_terminal
# SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...service_role_key_local_do_terminal

# --------------------------
# Outras variáveis
# --------------------------
ADMIN_PASS=seu_admin_password_aqui
NEXT_PUBLIC_SITE_URL=http://localhost:3000
OPENAI_API_KEY=sk-proj-...
# ... (demais variáveis conforme .env.example)
```

**Importante:**
- **Local:** use `http://127.0.0.1:54321` e as keys exibidas no terminal após `supabase start`.
- **Remoto:** use `https://npmnuihgydadihktglrd.supabase.co` e as keys do painel Supabase.

Para alternar entre local e remoto, comente/descomente as linhas apropriadas ou use dois arquivos `.env.local.dev` e `.env.local.prod`.

---

## 📦 Estrutura do Projeto Supabase

```
supabase/
├── config.toml          # Configuração do CLI (portas, features, etc.)
├── seed.sql             # Script de seed executado após db reset
├── migrations/          # Migrações SQL versionadas (aplicadas em ordem)
│   └── <timestamp>_<nome>.sql
└── functions/           # Edge Functions (Deno runtime)
```

---

## 🔍 Comandos Úteis Adicionais

### Ver status do ambiente local

```bash
supabase status
```

### Criar dump do banco local

```bash
supabase db dump -f supabase/seed.sql --data-only
```

### Aplicar mudanças incrementais (diff)

```bash
supabase db diff -f <nome_migracao>
```

Isso compara o schema local com as migrações existentes e gera um novo arquivo de migração com as diferenças.

---

## 🐛 Troubleshooting

### Erro "Docker is not running"

Certifique-se de que o Docker Desktop está iniciado antes de rodar `supabase start`.

### Erro "Failed to connect to postgres"

Reinicie os containers:

```bash
npm run supabase:stop
npm run supabase:start
```

### Tipos desatualizados

Se os tipos em `src/types/supabase.ts` não refletem o schema:

```bash
npm run supabase:types
```

### Conflito de portas

Se as portas padrão (54321, 54322, 54323, 54324) estiverem em uso, edite `supabase/config.toml` e ajuste as portas.

---

## 📚 Referências

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Local Development Guide](https://supabase.com/docs/guides/local-development)
- [Database Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Type Generation](https://supabase.com/docs/guides/api/generating-types)

---

## ✅ Checklist Rápido

- [ ] Docker Desktop rodando
- [ ] `npm run supabase:start` executado com sucesso
- [ ] URLs e keys copiadas para `.env.local`
- [ ] Migrações aplicadas com `npm run supabase:db:reset`
- [ ] Tipos gerados com `npm run supabase:types`
- [ ] Next.js rodando com `npm run dev`
- [ ] Testado no Studio (http://127.0.0.1:54323)

---

**Pronto!** Agora você tem um ambiente Supabase local completo e pode desenvolver sem depender da instância remota. 🚀
