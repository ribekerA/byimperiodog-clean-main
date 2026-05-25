# Instruções de desenvolvimento — By Império Dog

Resumo rápido para rodar, aplicar migrations e testar localmente.

1) Instalar dependências

```powershell
npm install
```

2) Gerar assets pré-dev (se preferir manual):

```powershell
node scripts/gen-client-photos.mjs
```

3) Rodar dev (recomendado sem predev automático em Windows se predev bloquear):

```powershell
# Gera assets
node scripts/gen-client-photos.mjs
# Inicia Next
npm run dev
```

4) Aplicar migrations no Supabase

- Se você tem `psql` e `DATABASE_URL` configurado:

```powershell
# a partir do root do repo
.
\scripts\apply-supabase-migrations.ps1
```

- Se você tem `supabase` CLI instalado:

```powershell
.
\scripts\apply-supabase-migrations.ps1
```

- Senão: abra `sql/blog.sql` e `sql/blog_comments.sql` na SQL Editor do Supabase e rode o conteúdo manualmente.

5) Testar endpoints locais

```powershell
# servidor dev rodando em http://localhost:3000
.
\scripts\test-api-endpoints.ps1
```

6) Build produção

```powershell
# limpa .next se necessário
Remove-Item -LiteralPath .next -Recurse -Force -ErrorAction SilentlyContinue
# gerar assets
node scripts/gen-client-photos.mjs
# build
$env:CI='true'; npx cross-env NEXT_DISABLE_VERSION_CHECK=1 NEXT_TELEMETRY_DISABLED=1 next build
```

Se algo falhar, cole a saída do build aqui que eu analiso e corrijo.

## Troubleshooting Blog (Posts não aparecem)

Se `/blog` ou `/blog/[slug]` não exibirem posts:

1. Verifique variáveis de ambiente (dev ou Vercel):
	- `NEXT_PUBLIC_SUPABASE_URL`
	- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
	Se faltarem, a listagem mostra razão `env-missing`.
2. Confirme no banco:
	```sql
	select status, count(*) from blog_posts group by status;
	```
	Só `status='published'` é público.
3. Publicar rascunhos:
	```sql
	update blog_posts set status='published' where status in ('draft','review');
	```
4. Preview em desenvolvimento: adicione `?preview=1` à URL para enxergar `draft` e `review`.
5. API de debug (local ou deploy):
	- Defina `DEBUG_TOKEN="algum-segredo"`.
	- Requisição:
	  ```bash
	  curl -H "x-debug-token: $DEBUG_TOKEN" http://localhost:3000/api/debug/blog
	  ```
6. RLS (caso esqueceu migrations): execute `sql/blog.sql` para criar política:
	- Política esperada: `blog_posts_public_read` (SELECT usando `status = 'published'`).

### Mensagens de diagnóstico na listagem
| Reason code | Significado | Ação |
|-------------|-------------|------|
| env-missing | Env Supabase ausente | Configurar variáveis NEXT_PUBLIC_* |
| no-published | Zero posts publicados | Publicar ou usar preview em dev |
| error | Falha na query | Ver console server / logs Supabase |

Com `?preview=1` (somente `NODE_ENV!==production`) aparecem também `draft` e `review`.

## Fluxo Editorial Acelerado

Ferramentas adicionadas para agilizar publicação e depuração.

### Preview de Posts
- Acrescente `?preview=1` à URL de `/blog` ou `/blog/[slug]` em desenvolvimento para enxergar rascunhos (draft) e revisão (review).
- Nos cards da listagem aparecem badges de status.
- Dentro do post em preview (não publicado) aparece um banner com botão "Publicar agora".

### Endpoints Admin
Requer header `x-admin-token` igual a `ADMIN_TOKEN` (ou fallback `DEBUG_TOKEN` se `ADMIN_TOKEN` não definido). Necessário também `SUPABASE_SERVICE_ROLE_KEY` configurado.

1. Publicar post
```
POST /api/admin/blog/publish
Body: { "id": "<uuid>" } ou { "slug": "meu-post" }
```
2. Despublicar post
```
POST /api/admin/blog/unpublish
Body: { "id"|"slug", toStatus?: "draft"|"review"|"archived", keepPublishedAt?: boolean }
```
3. Revalidar cache ISR
```
POST /api/admin/revalidate
Body: { path?: "/blog" } ou { slug: "meu-post" }
```

Exemplo curl (PowerShell use `$env:ADMIN_TOKEN`):
```bash
curl -X POST \
	-H "x-admin-token: $ADMIN_TOKEN" \
	-H "Content-Type: application/json" \
	-d '{"slug":"meu-post"}' \
	http://localhost:3000/api/admin/blog/publish
```

### Script em Lote

Publicar todos os drafts/review de uma vez:
```bash
node scripts/blog-publish-all.mjs --dry   # mostra o que seria publicado
node scripts/blog-publish-all.mjs         # executa
```

### Diagnóstico de Variáveis

Componente `EnvDiagnostics` (apenas dev) pode ser usado em páginas internas para listar variáveis públicas ausentes:
```tsx
<EnvDiagnostics required={["NEXT_PUBLIC_SUPABASE_URL","NEXT_PUBLIC_SUPABASE_ANON_KEY"]} />
```


