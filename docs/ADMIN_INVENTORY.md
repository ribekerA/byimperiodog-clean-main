# Inventário do Admin (App Router + Supabase)

Este documento mapeia rotas, handlers, libs e componentes existentes do Admin para orientar os PRs de hardening (AA, segurança, performance, gamificação) sem quebrar contratos públicos.

## Visão geral
- Framework: Next.js 14 (App Router) + TypeScript (strict) + ESLint.
- DB/Storage: Supabase (client público e service role). Sem Prisma/Drizzle encontrados.
- Auth/Admin: RBAC centralizado (`src/lib/rbac.ts`, `src/lib/adminAuth.ts`), middleware com `X-Robots-Tag` e layout do admin com `metadata.robots` desativando SEO.
- Segurança: `safeAction` (Zod + try/catch), `limiter` e `rateLimit` in-memory usados em várias rotas.
- A11y/UX: `SkipLink`, toasts com `aria-live`, diálogos com `role=dialog` e `aria-modal`, diversos tap targets ≥48px já presentes.
- Tabelas/Virtualização: TanStack Table + `@tanstack/react-virtual` (componentes em `src/components/admin/`).
- Editor/Wizard: RHF + Zod + stepper em `src/components/admin/wizard/` e páginas sob `/admin/(protected)/blog/*`.

## Rotas do Admin (páginas)
- `/admin`
  - `app/(admin)/admin/page.tsx`
  - `app/(admin)/admin/layout.tsx` (SEO off, SkipLink, sidebar/topbar)
  - `app/(admin)/admin/guard-layout.tsx`
- Login/Auth
  - `app/(admin)/admin/(auth)/layout.tsx`
  - `app/(admin)/admin/(auth)/login/page.tsx`
- Protegidas
  - Dashboard: `app/(admin)/admin/(protected)/dashboard/page.tsx`
  - Analytics: `app/(admin)/admin/(protected)/analytics/page.tsx`
  - Blog (lista): `app/(admin)/admin/(protected)/blog/page.tsx`
  - Blog Editor: `app/(admin)/admin/(protected)/blog/editor/page.tsx`
  - Blog Wizard: `app/(admin)/admin/(protected)/blog/editor/wizard/page.tsx`
  - Blog Schedule: `app/(admin)/admin/(protected)/blog/schedule/page.tsx`
  - Blog Comments: `app/(admin)/admin/(protected)/blog/comments/page.tsx`
  - Blog Analytics: `app/(admin)/admin/(protected)/blog/analytics/page.tsx`
  - Preview: `app/(admin)/admin/(protected)/blog/preview/[id]/page.tsx`
  - Media: `app/(admin)/admin/(protected)/media/page.tsx`
  - Experiments: `app/(admin)/admin/(protected)/experiments/page.tsx`
  - System Health: `app/(admin)/admin/(protected)/system/health/page.tsx`
  - Settings: `app/(admin)/admin/(protected)/settings/page.tsx`
  - Content: `app/(admin)/admin/(protected)/content/page.tsx`
  - Content Editor: `app/(admin)/admin/(protected)/content/editor/page.tsx`
  - Content Calendar: `app/(admin)/admin/(protected)/content/calendar/page.tsx`
  - Puppies (ex.: CRUD de filhotes): várias páginas/comp.

## Handlers de API (Admin)
Principais entradas em `app/api/admin/**` (65 rotas mapeadas). Destaques:
- Blog CRUD/fluxos: `blog`, `publish`, `unpublish`, `publish-batch`, `tags`, `analytics`, `media/*`, `seo/*`, `ai/*`, `schedule/*`, `migrations/*`.
- Analytics: `analytics/{kpi,breakdown,leads_series,leads_export,sources}`.
- Puppies: `puppies`, `puppies/upload`, `puppies/sell`.
- Settings/Site: `settings`, `settings/pixels`, `site_settings`, `revalidate`, `logout`, `login`.
- Cadastros (wizard/autosave): `cadastros`, `cadastros/autosave`.

Observações:
- Muitas rotas já usam Zod, `safeAction` e/ou `limiter`/`rateLimit` utilitários.
- `adminAuth.ts` provê guards e resolução de role via cookies/headers.

## Repositórios/DB & Adapters
- Supabase clients:
  - Admin: `src/lib/supabaseAdmin.ts` (service role; stub seguro se faltar credenciais)
  - Público: `src/lib/supabasePublic.ts` / `src/lib/supabaseAnon.ts`
- Blog/Conteúdo:
  - `src/lib/blogDb.ts` (consultas públicas)
  - `src/lib/embeddings.store.blog.ts` (persistência embeddings)
  - `src/lib/seo.core.ts`, `src/lib/seoSuggestions.ts`
  - `src/lib/gamification.blog.ts` (regras/badges)
- Analytics:
  - Endpoints dedicados em `app/api/admin/analytics/*` (fonte: tabelas Supabase `analytics_*`) e `tests/database.connection.test.ts`.

## UI/UX (Admin)
- Layout/Chrome: `AdminSidebar`, `AdminTopbar` (atalhos e navegação), `SkipLink`.
- Tabelas: `src/components/admin/datatable/AdminDataTable.tsx`, `src/components/admin/table/VirtualizedDataTable.tsx`.
- Wizard: `src/components/admin/wizard/AdminWizard.tsx`.
- Dialog/Toast/UI base: `src/components/ui/{dialog,toast,tooltip}.tsx` com A11y (roles, aria-live).

## Acessibilidade (achados)
- `SkipLink` presente e landmarks corretos.
- Diálogos usam `role=dialog` e `aria-modal`.
- Toasts com `role=status|alert` e `aria-live=polite`.
- Vários controles já com min-h ≥ 48px; alguns pontos a completar em listas/paginação e botões secundários.

## Segurança
- RBAC central: `src/lib/rbac.ts`, helpers em `src/lib/adminAuth.ts` (layout guard, API guard).
- Rate limiting: `src/lib/limiter.ts` e `src/lib/rateLimit.ts`; aplicados em rotas críticas (login, autosave, AI, etc.).
- `AppError`: `src/lib/errors.ts` com mapeamento status code.
- `safeAction`: `src/lib/safeAction.ts` para padronizar validação/erros.

## SEO (Admin desligado)
- `middleware.ts`: `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet` em `/admin`/`/api/admin`.
- `app/(admin)/admin/layout.tsx`: `metadata.robots` com `{ index:false, follow:false }`.
- `next-sitemap.config.mjs`: `exclude: ['/admin/*', '/api/*']`.

## Testes existentes
- Unit: rbac, limiter, safeAction, supabase clients, media attach/list, gamification, embeddings, seo core/suggestions.
- E2E: `tests/e2e/*.spec.ts` (home/blog). Não há cenários E2E específicos do admin mapeados.

---

## Gaps e oportunidades (resumo)
- Padronizar Zod + `safeAction` em todas as mutações de `/api/admin` (algumas ainda validam manualmente).
- Garantir idempotência e CONFLICT nos agendamentos/publicações concorrentes (chave idempotente e versionamento `updatedAt`/`version`).
- Upload seguro: checagem MIME/size consistente, strip EXIF server-side e nomes sanitizados em todos os fluxos de upload.
- A11y AA: revisar tap targets em todas as ações em massa/tabelas; focus-trap consistente.
- Perf: garantir virtualização nas tabelas pesadas e `prefers-reduced-motion` para microanimações.
- Admin bundle: evitar prefetch automático nas rotas públicas (verificar links/`prefetch={false}`).