# INVENTARIO DO PROJETO

## Stack e Estrutura
- **Framework**: Next.js 14 App Router (`app/`), com suporte a RSC e rotas dinâmicas.
- **Admin**: rotas em `app/(admin)/admin/*`, protegido via middleware (`middleware.ts`) e layouts específicos (`app/(admin)/admin/layout.tsx`, `app/(admin)/admin/(protected)/layout.tsx`).
- **APIs/Admin**: endpoints REST em `app/api/admin/**` (blog, puppies, cadastros, uploads, analytics, etc.), sem Server Actions declaradas.
- **Formulários/Wizard**: React Hook Form (`react-hook-form`) + Zod (`zod`) para validação client-side; autosave via hook `src/hooks/useAutosave.ts`.
- **Tabelas**: TanStack React Table (`@tanstack/react-table`) com componentes customizados (`src/components/admin/table/VirtualizedDataTable.tsx`, `src/components/admin/datatable/AdminDataTable.tsx`) e virtualização (`@tanstack/react-virtual`).
- **UI/UX**: Radix UI (`@radix-ui/react-*`) para dialogs, tooltips e command palettes; design tokens em `design-system/`.
- **Uploads**: componentes client (`src/components/admin/upload/FileUploader.tsx`) enviando para APIs (`app/api/admin/blog/media/upload`, `app/api/admin/puppies/upload`, etc.).
- **Autenticação/RBAC atual**: cookies `adm`/`admin_auth` verificados em `middleware.ts` e helpers (`src/lib/adminAuth.ts`); não há roles, apenas flag booleana.
- **Estado Global**: uso pontual de `localStorage` (streak, admin pass). Não há Redux/RTK/SWR configurados globalmente; fetchers manuais via `adminFetch`.
- **Testes existentes**:
  - Unitários (Vitest) em `tests/unit/**` e `tests/**/*.test.ts(x)` cobrindo libs e hooks.
  - Integração/admin: `tests/admin/command-palette.test.tsx`.
  - E2E (Playwright) em `tests/e2e/**`.
  - Scripts auxiliares em `scripts/` (SEO, PSI, etc.).
- **CI/Pipeline**: scripts npm (`lint`, `typecheck`, `test`, `test:e2e`, `lh:ci`, `psi:validate`). Não há workflow YAML detectado aqui, mas `.github/` existe com pipelines (consultar ao iniciar CI hardening).

## Pontos de Risco
- **Segurança**: ausência de RBAC granular; validações server-side frágeis (APIs aceitam JSON livre); rate-limit inexistente; `adminFetch` confia em header `x-admin-pass` com fallback localStorage.
- **Concorrência/Dados**: rotas de mutação não tratam `updatedAt`/versionamento; autosave persiste sem controle de conflito; optimistic updates limitados.
- **Performance**: múltiplas implementações de tabela (duplicidade), virtualização parcial; imports globais podem renderizar bundle maior que necessário; upload/cropper cria blobs sem throttling.
- **Acessibilidade**: ícones de ordenação com caracteres corrompidos; foco visível inconsistente; falta `aria-live` em toasts padrão; atalhos com conflitos (`/`, `?` interceptam sem checar contextos); modais sem trap dedicado.
- **UX/Produtividade**: navegação duplicada (Sidebar vs AdminSidebar), ausência de undo/redo real no wizard, export CSV parcial (sem import), ausência de indicadores de conflito/estado offline.
- **SEO/Admin**: admin já `noindex` via metadata e header, mas precisa garantir ausência em sitemap e remover OG/LD JSON herdados.

## Prioridades (Ganho x Esforço x Risco)

| Prioridade | Item                                                                 | Ganho                              | Esforço | Risco |
|------------|----------------------------------------------------------------------|------------------------------------|---------|-------|
| **P0**     | Harden/admin layout: SEO off, landmarks, hotkeys padronizados        | Alto (conformidade SEO/A11y)       | Médio   | Baixo |
| **P0**     | RBAC + validações Zod + rate limit (`safeAction`, `limiter`)         | Muito alto (segurança/dados)       | Alto    | Médio |
| **P0**     | DataTable unificada com virtualização + bulk actions estáveis        | Alto (produtividade/perf)          | Médio   | Médio |
| **P0**     | Wizard autosave/undo + toasts acessíveis                             | Médio (UX/A11y)                    | Médio   | Baixo |
| **P0**     | Upload seguro (validar MIME, remover EXIF, sanitizar nomes)          | Alto (segurança)                   | Médio   | Médio |
| **P1**     | Páginas públicas (FAQ JSON-LD, Privacidade, Termos) + navegação      | Alto (SEO/compliance)              | Médio   | Baixo |
| **P1**     | Footer/Nav tap targets + contraste AA                                | Médio (A11y)                       | Baixo   | Baixo |
| **P2**     | Sincronização com SWR/React Query + optimistic/rollback              | Alto (confiabilidade de dados)     | Alto    | Médio |
| **P2**     | Revisão de componentes, remoção de CSS morto, tree-shaking           | Médio (manutenção/perf)            | Médio   | Baixo |
| **P2**     | Pipeline CI full (lint→typecheck→test→build→e2e) com reports         | Alto (qualidade contínua)          | Médio   | Médio |

