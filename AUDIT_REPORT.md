# 🔍 AUDITORIA COMPLETA DO CÓDIGO - By Império Dog

**Data:** 01/12/2025  
**Auditor:** GitHub Copilot (Claude Sonnet 4.5)  
**Escopo:** Análise completa de código, arquitetura, duplicações e gaps

---

## 📋 SUMÁRIO EXECUTIVO

### Status Geral do Projeto
- ✅ **Domain Layer:** Existe e está bem estruturado (puppy.ts, taxonomies.ts, config.ts)
- ⚠️ **Catalog Service:** AUSENTE - lógica espalhada em componentes
- ⚠️ **Admin:** Parcialmente implementado, falta gestão completa de puppies
- ✅ **Lead Funnel:** Implementado e funcional (LeadForm + API + Supabase)
- ⚠️ **Tracking:** Implementado mas com duplicações

### Problemas Críticos Identificados
1. **Duplicação de tipos** - 4+ definições de `Puppy` e variações
2. **Lógica de filtros em componentes** - Deveria estar em service layer
3. **Inconsistência de nomenclatura** - `puppies` table vs `Puppy` entity
4. **Schema puppy.ts ausente** - foi deletado recentemente
5. **Admin sem CRUD completo** - Falta create/edit forms

---

## 🚨 ISSUES CRÍTICAS (BLOQUEANTES)

### 1. DUPLICAÇÃO DE TIPOS `Puppy`

**Localização:** 
- `src/domain/puppy.ts` ✅ (entidade principal - CORRETO)
- `src/types/puppy.ts` ⚠️ (RawPuppy, PuppyDTO - LEGADO)
- `src/lib/types.ts` ⚠️ (Puppy interface - DUPLICADO)
- `src/lib/usePuppy.ts` ⚠️ (PuppyNorm - DUPLICADO)
- `src/components/PuppiesGrid.tsx` ⚠️ (type Puppy inline - DUPLICADO)

**TODO:**
```typescript
// TODO: CONSOLIDAR TIPOS
// - Manter apenas src/domain/puppy.ts como source of truth
// - Remover src/types/puppy.ts (legado)
// - Remover src/lib/types.ts (duplicado)
// - Atualizar src/lib/usePuppy.ts para usar domain/puppy
// - Remover tipo inline em PuppiesGrid.tsx
```

### 2. ARQUIVO DELETADO RECENTEMENTE

**Arquivo:** `src/lib/schema/puppy.ts`  
**Status:** ❌ DELETADO (comando terminal: `Remove-Item -Path "src/lib/schema/puppy.ts" -Force`)

**Impacto:**
- Funções `normalizePuppyFromDB()` podem estar quebradas
- Imports em `app/filhotes/page.tsx` vão falhar

**TODO:**
```typescript
// TODO: RESTAURAR OU RECRIAR
// - Verificar se normalizePuppyFromDB ainda é usado
// - Se sim: recriar em src/lib/catalog/normalize.ts
// - Se não: remover imports órfãos
```

### 3. AUSÊNCIA DE SERVICE LAYER PARA CATÁLOGO

**Problema:** Lógica de filtros, busca e paginação está espalhada em componentes client-side.

**Arquivos afetados:**
- `src/components/PuppiesGrid.tsx` (filtros inline)
- `app/filhotes/page.tsx` (fetchPuppies inline)
- `app/(admin)/admin/(protected)/puppies/page.tsx` (fetch inline)

**TODO:**
```typescript
// TODO: CRIAR SERVICE LAYER
// src/lib/catalog/service.ts:
// - listPuppies(filters, sort, pagination)
// - getPuppyBySlug(slug)
// - getPuppiesByColor(color)
// - getPuppiesByCity(city)
// - searchPuppies(query)
// Todos os componentes devem usar o service, NUNCA Supabase direto
```

---

## ⚠️ ISSUES DE ARQUITETURA

### 4. COMPONENTES SEM TIPAGEM FORTE

**Componentes:**
- `PuppiesGrid.tsx` - usa `any` e tipos permissivos inline
- `PuppyCard.tsx` - aceita object sem validação
- `PuppyDetailsModal.tsx` - fetches data inline sem service

**TODO:**
```typescript
// TODO: TIPAR COMPONENTES
// - PuppiesGrid: aceitar Puppy[] do domain
// - PuppyCard: interface PuppyCardProps com Puppy do domain
// - PuppyDetailsModal: usar service.getPuppyBySlug()
```

### 5. ROTAS SEM SEO COMPLETO

**Rotas problemáticas:**
```
/filhotes/page.tsx         ⚠️ Metadata OK, mas sem generateStaticParams
/filhotes/[slug]/page.tsx  ❌ NÃO EXISTE - rota dinâmica ausente
/spitz-anao/cor/[color]/page.tsx  ❌ NÃO EXISTE
/spitz-anao/[city]/page.tsx       ❌ NÃO EXISTE
```

**TODO:**
```typescript
// TODO: CRIAR ROTAS DINÂMICAS FALTANTES
// 1. app/filhotes/[slug]/page.tsx
//    - generateStaticParams() com lista de puppies
//    - generateMetadata() dinâmico
//    - JSON-LD Product schema
// 2. app/spitz-anao/cor/[color]/page.tsx
//    - generateStaticParams() com COLORS taxonomy
//    - Filtrar puppies por cor via service
// 3. app/spitz-anao/[city]/page.tsx
//    - generateStaticParams() com CITIES taxonomy
//    - Filtrar puppies por cidade via service
```

### 6. ADMIN SEM CRUD COMPLETO

**Status atual:**
- ✅ Lista de puppies (`app/(admin)/admin/(protected)/puppies/page.tsx`)
- ❌ CREATE - Formulário de criação AUSENTE
- ❌ EDIT - Formulário de edição AUSENTE
- ⚠️ DELETE - Existe mas sem confirmação robusta

**TODO:**
```typescript
// TODO: IMPLEMENTAR ADMIN CRUD COMPLETO
// 1. app/(admin)/admin/(protected)/puppies/new/page.tsx
//    - Form com validação Zod
//    - Upload de imagens
//    - Preview antes de salvar
// 2. app/(admin)/admin/(protected)/puppies/[id]/edit/page.tsx
//    - Form pré-preenchido
//    - Upload adicional de imagens
//    - Histórico de alterações
// 3. Melhorar confirmação de delete
//    - Modal com warning
//    - Soft delete (status = deleted)
```

---

## 🔄 DUPLICAÇÕES DE LÓGICA

### 7. LÓGICA DE FILTROS DUPLICADA

**Problema:** Filtros implementados 3+ vezes em lugares diferentes.

**Localizações:**
- `PuppiesGrid.tsx` linhas 140-160 (filtros client-side)
- `app/(admin)/admin/(protected)/puppies/page.tsx` linhas 100-140 (filtros admin)
- Ambos reimplementam: busca textual, filtro por cor, sexo, status, preço

**TODO:**
```typescript
// TODO: CENTRALIZAR FILTROS
// src/lib/catalog/filters.ts:
// - applyFilters(puppies: Puppy[], filters: PuppyFilters): Puppy[]
// - applySearch(puppies: Puppy[], query: string): Puppy[]
// - applySort(puppies: Puppy[], sortBy: PuppySortBy): Puppy[]
// Reusar em PuppiesGrid E admin
```

### 8. NORMALIZAÇÃO DE DADOS DUPLICADA

**Problema:** Múltiplas funções fazem a mesma coisa (converter DB → DTO).

**Funções encontradas:**
- `normalizePuppy()` em `src/types/puppy.ts`
- `normalizePuppyFromDB()` em `src/lib/schema/puppy.ts` (DELETADO)
- `buildOfferCatalogSchema()` em `src/lib/schema/jsonld.ts` (faz normalização inline)

**TODO:**
```typescript
// TODO: UMA ÚNICA FUNÇÃO DE NORMALIZAÇÃO
// src/lib/catalog/normalize.ts:
// - normalizePuppyFromDB(raw: any): Puppy
// Usar em TODOS os lugares que buscam do Supabase
```

### 9. TRACKING EVENTS DUPLICADOS

**Problema:** Eventos de tracking implementados em múltiplos arquivos.

**Arquivos:**
- `src/lib/track.ts` (sendGA, sendFB, sendTT, sendPIN)
- `src/lib/events.ts` (trackWhatsAppClick, trackLeadFormSubmit, etc)
- Ambos fazem a mesma coisa mas com nomenclatura diferente

**TODO:**
```typescript
// TODO: UNIFICAR TRACKING
// - Manter apenas src/lib/events.ts
// - Remover src/lib/track.ts (consolidar funções)
// - Usar nomes consistentes: track{EventName}
```

---

## 🗃️ INCONSISTÊNCIAS DE DADOS

### 10. MAPEAMENTO DB ↔ DOMAIN INCONSISTENTE

**Problema:** Tabela `puppies` no Supabase tem colunas diferentes da entidade `Puppy`.

**Tabela Supabase (`puppies`):**
```sql
- id, slug, name, description
- price_cents, color, gender, birth_date
- images (jsonb), city, state
- is_partner_breeder, breeder_name  ⚠️ NUNCA USAR NO FRONT
- status, aggregate_rating, review_count
```

**Entidade Domain (`Puppy`):**
```typescript
- breed, sex (não gender), readyForAdoptionDate
- title (não name), seoTitle, seoDescription
- source (não is_partner_breeder), internalSourceId
```

**TODO:**
```typescript
// TODO: ALINHAR SCHEMA DB COM DOMAIN
// Opção 1: Migration SQL para renomear colunas
//   - gender → sex
//   - is_partner_breeder → source (enum: 'own-breeding' | 'external-breeder')
//   - breeder_name → internal_source_id
// Opção 2: Criar VIEW no Supabase que faz o mapeamento
// Opção 3: Normalização robusta em normalize.ts
```

### 11. CAMPOS `is_partner_breeder` EXPOSTOS NO FRONT

**⚠️ VIOLAÇÃO DA REGRA DE NEGÓCIO:**  
Domain diz: "NUNCA expor criador parceiro ao público"

**Problema encontrado:**
- `app/filhotes/page.tsx` linha 109: SELECT inclui `is_partner_breeder, breeder_name`
- Esses campos NÃO devem ser enviados ao front (mesmo que não sejam renderizados)

**TODO:**
```typescript
// TODO: REMOVER CAMPOS INTERNOS DA API PÚBLICA
// 1. Revisar TODOS os .select() do Supabase
// 2. Criar helper: getPublicPuppyColumns()
// 3. NUNCA incluir: is_partner_breeder, breeder_name, cost_cents, profit_margin
// 4. Esses campos só devem ser visíveis no admin com auth
```

---

## 🚧 CÓDIGO MORTO (DEAD CODE)

### 12. ARQUIVOS LEGACY NÃO USADOS

**Arquivos identificados:**
```
archive_routes/
  app_site_backup/filhote/actions.ts   ⚠️ Server actions antigas
  app_site_backup/filhote/page.tsx     ⚠️ Rota antiga duplicada
  app_search/                          ⚠️ Search route antiga
  app_site_blog_rollback/              ⚠️ Backup de blog
```

**TODO:**
```bash
# TODO: CLEANUP DE ARQUIVOS MORTOS
# Validar se archive_routes/ ainda é necessário
# Se não: git rm -rf archive_routes/
# Se sim: mover para fora do projeto (backup externo)
```

### 13. COMPONENTES NÃO USADOS

**Componentes suspeitos:**
- `src/components/PuppyDetailsModal.tsx` - usado apenas em PuppiesGrid?
- `src/lib/usePuppy.ts` - hook customizado, quantos lugares usa?

**TODO:**
```bash
# TODO: AUDIT DE USO DE COMPONENTES
# Usar ferramenta: npx depcheck
# Ou grep recursivo:
# grep -r "PuppyDetailsModal" --include="*.tsx" --include="*.ts"
# Se <2 usos: considerar inline ou remover
```

---

## 🔐 SEGURANÇA E ADMIN

### 14. ADMIN SEM GESTÃO DE LEADS COMPLETA

**Status atual:**
- ✅ Listagem de leads (`app/(admin)/admin/(protected)/analytics/page.tsx`)
- ❌ Detalhes de lead individual AUSENTE
- ❌ Atualização de status (novo → contatado → convertido) AUSENTE
- ❌ Filtros avançados (por UTM, cidade, cor preferida) AUSENTE

**TODO:**
```typescript
// TODO: ADMIN DE LEADS COMPLETO
// 1. app/(admin)/admin/(protected)/leads/page.tsx
//    - Lista com filtros (status, UTM, período)
//    - Exportar CSV
// 2. app/(admin)/admin/(protected)/leads/[id]/page.tsx
//    - Detalhes completos do lead
//    - Histórico de interações
//    - Botão "Marcar como Contatado/Convertido"
// 3. API route: PATCH /api/admin/leads/[id]
//    - Atualizar status
//    - Adicionar notas internas
```

### 15. ADMIN SEM RBAC (ROLE-BASED ACCESS CONTROL)

**Problema:** Sistema usa senha única para admin (`ADMIN_PASS`).  
Não há diferenciação de roles (admin vs moderador vs editor).

**TODO:**
```typescript
// TODO: IMPLEMENTAR RBAC BÁSICO
// 1. Tabela Supabase: admin_users
//    - id, email, role (admin | editor | viewer)
// 2. Middleware verifica role antes de permitir ação
// 3. Admin: full access
//    Editor: pode criar/editar puppies/blog
//    Viewer: apenas leitura
```

---

## 📊 SEO TÉCNICO

### 16. SITEMAP.XML INCOMPLETO

**Status atual:**
- ✅ `app/sitemap.ts` existe e é dinâmico
- ⚠️ Inclui: homepage, filhotes, blog, cores, cidades, stories
- ❌ NÃO INCLUI: Páginas de puppy individuais (`/filhotes/[slug]`)

**TODO:**
```typescript
// TODO: ADICIONAR PUPPIES INDIVIDUAIS NO SITEMAP
// app/sitemap.ts:
// - Buscar todos puppies com status=available
// - Adicionar ao sitemap: /filhotes/[slug]
// - lastModified baseado em updated_at
// - priority: 0.8 (alta)
```

### 17. METADATA DINÂMICO AUSENTE

**Problema:** Rotas dinâmicas sem `generateMetadata()`.

**Rotas afetadas:**
- `/filhotes/[slug]` - NÃO EXISTE
- `/blog/[slug]` - ✅ TEM metadata (OK)

**TODO:**
```typescript
// TODO: METADATA DINÂMICO PARA PUPPIES
// app/filhotes/[slug]/page.tsx:
// export async function generateMetadata({ params }): Promise<Metadata> {
//   const puppy = await service.getPuppyBySlug(params.slug);
//   return {
//     title: PuppyHelpers.generateSeoTitle(puppy),
//     description: PuppyHelpers.generateSeoDescription(puppy),
//     keywords: PuppyHelpers.generateSeoKeywords(puppy),
//     openGraph: { ... },
//   };
// }
```

### 18. CANONICAL URLs FALTANDO

**Problema:** Várias páginas sem canonical definido ou com canônica incorreta.

**TODO:**
```typescript
// TODO: REVIEW CANONICAL URLS
// Garantir que TODAS as páginas têm:
// metadata.alternates.canonical = URL_ABSOLUTA
// Verificar em: colors, cities, intent pages, blog
```

---

## 🎨 UI/UX E COMPONENTES

### 19. COMPONENTES SEM LOADING STATES

**Componentes afetados:**
- `PuppiesGrid.tsx` - tem skeleton ✅
- `PuppyDetailsModal.tsx` - não tem loading inline ❌
- Forms de admin - não têm disabled durante submit ❌

**TODO:**
```typescript
// TODO: LOADING STATES EM TODOS OS COMPONENTES
// - Modal: exibir skeleton enquanto busca
// - Forms: disabled={isSubmitting}
// - Buttons: loading spinner quando isLoading
```

### 20. ERRO HANDLING INCONSISTENTE

**Problema:** Alguns componentes mostram erro, outros fazem silent fail.

**TODO:**
```typescript
// TODO: ERROR BOUNDARY GLOBAL
// app/error.tsx:
// - Capturar erros de runtime
// - Exibir UI amigável
// - Log para Sentry/similar
// 
// TODO: ERROR STATE EM COMPONENTES
// - PuppiesGrid: se fetch falhar, mostrar retry
// - Forms: exibir mensagem de erro específica
```

---

## 📝 DOCUMENTAÇÃO

### 21. README DESATUALIZADO

**Status:**
- ✅ Existem múltiplos READMEs (README_BLOG.md, README_DEPLOY.md, etc)
- ⚠️ README.md principal não reflete estrutura atual

**TODO:**
```markdown
# TODO: ATUALIZAR README.md PRINCIPAL
## Seções necessárias:
1. Sobre o Projeto (By Império Dog)
2. Tech Stack (Next.js 14, Supabase, TypeScript)
3. Estrutura de Pastas
4. Como Rodar Localmente
5. Variáveis de Ambiente
6. Deploy (Vercel)
7. Admin Access
8. API Routes
```

### 22. COMENTÁRIOS TODO ESPALHADOS

**Encontrado:**
- `src/components/LeadForm.tsx` linha 85: "// TODO: Validar telefone E.164"
- `app/api/contract/route.ts` linha 10: "// TODO: upload files to Supabase storage"

**TODO:**
```bash
# TODO: CONSOLIDAR TODOS OS TODOs
# grep -r "TODO:" --include="*.ts" --include="*.tsx" > TODOS.md
# Priorizar e criar issues no GitHub
```

---

## 🧪 TESTES

### 23. AUSÊNCIA DE TESTES UNITÁRIOS

**Status:**
- ✅ `vitest.config.ts` configurado
- ❌ ZERO arquivos `.test.ts` ou `.spec.ts` encontrados

**TODO:**
```typescript
// TODO: TESTES CRÍTICOS
// 1. src/domain/puppy.test.ts
//    - PuppyPrice.fromCents()
//    - PuppyAge.getDays()
//    - PuppyHelpers.generateSlug()
// 2. src/lib/catalog/service.test.ts
//    - listPuppies()
//    - filters
// 3. app/api/leads/route.test.ts
//    - Validação de schema
//    - Rate limiting
```

### 24. E2E TESTS DESATUALIZADOS

**Status:**
- ✅ `playwright.config.ts` existe
- ⚠️ Pasta `tests/` existe mas desatualizada

**TODO:**
```typescript
// TODO: E2E CRÍTICOS
// tests/e2e/catalog.spec.ts:
//   - Visitar /filhotes
//   - Filtrar por cor
//   - Abrir detalhes de puppy
// tests/e2e/lead-form.spec.ts:
//   - Preencher formulário
//   - Submit
//   - Verificar redirect WhatsApp
// tests/e2e/admin.spec.ts:
//   - Login
//   - Criar puppy
//   - Editar puppy
```

---

## 🚀 PERFORMANCE

### 25. IMAGENS SEM OTIMIZAÇÃO COMPLETA

**Problema:**
- ✅ next/image usado na maioria dos lugares
- ⚠️ Algumas imagens sem `sizes` prop
- ❌ Placeholder blur ausente em alguns cards

**TODO:**
```typescript
// TODO: AUDIT DE IMAGENS
// 1. Garantir sizes em TODAS as <Image>
// 2. Adicionar blurDataURL em cards
// 3. Verificar se AVIF está sendo gerado (next.config.mjs)
```

### 26. BUNDLE SIZE SEM ANÁLISE

**TODO:**
```bash
# TODO: ANALISAR BUNDLE
# npm run build
# npx @next/bundle-analyzer
# Identificar libs grandes:
# - framer-motion (lazy load?)
# - lodash (usar lodash-es tree-shakeable?)
```

---

## 📱 ACESSIBILIDADE

### 27. A11Y BÁSICO AUSENTE

**Problemas identificados:**
- ❌ Sem `alt` em algumas imagens
- ❌ Buttons sem `aria-label` quando só têm ícone
- ❌ Forms sem labels explícitos (alguns usam placeholder apenas)

**TODO:**
```typescript
// TODO: A11Y AUDIT
// 1. Rodar Lighthouse Accessibility
// 2. Adicionar alt em TODAS as imagens
// 3. aria-label em botões de ícone
// 4. Labels em TODOS os inputs (mesmo que visualmente hidden)
```

---

## 📊 ANALYTICS E TRACKING

### 28. CONVERSÃO NÃO RASTREADA COMPLETAMENTE

**Status:**
- ✅ `trackLeadFormSubmit()` existe
- ⚠️ Não rastreia: views de puppy, cliques em WhatsApp, scroll depth

**TODO:**
```typescript
// TODO: EVENTOS DE CONVERSÃO FALTANTES
// src/lib/events.ts:
// - trackPuppyView(puppyId)
// - trackWhatsAppClick(source, puppyId?)
// - trackScrollDepth(percentage)
// - trackTimeOnPage(seconds)
```

---

## 🔧 DEVOPS E DEPLOY

### 29. VARIÁVEIS DE AMBIENTE MAL DOCUMENTADAS

**Problema:**
- ✅ `.env.example` existe
- ⚠️ Faltam comentários explicando cada var

**TODO:**
```bash
# TODO: DOCUMENTAR ENVS
# .env.example:
# # Supabase (obrigatório)
# NEXT_PUBLIC_SUPABASE_URL=https://...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# SUPABASE_SERVICE_ROLE_KEY=... # Admin only
#
# # Admin Auth (obrigatório) — nunca com prefixo NEXT_PUBLIC_,
# # que o Next inlina no bundle do browser
# ADMIN_PASS=senha-forte
#
# # Tracking (opcional)
# NEXT_PUBLIC_GTM_ID=GTM-...
```

### 30. CI/CD SEM LINTING/TESTS

**Status:**
- ❌ Sem `.github/workflows/` detectado
- ❌ Build roda sem rodar testes antes

**TODO:**
```yaml
# TODO: CRIAR .github/workflows/ci.yml
# on: [push, pull_request]
# jobs:
#   - lint (eslint)
#   - type-check (tsc --noEmit)
#   - test (vitest run)
#   - build (next build)
```

---

## 📈 PRIORIZAÇÃO DE CORREÇÕES

### 🔴 CRÍTICO (Fazer AGORA)
1. ✅ Restaurar/recriar `src/lib/schema/puppy.ts` (ou consolidar normalização)
2. ✅ Criar service layer (`src/lib/catalog/service.ts`)
3. ✅ Consolidar tipos Puppy (remover duplicações)
4. ✅ Remover `is_partner_breeder` dos SELECTs públicos
5. ✅ Criar rotas dinâmicas faltantes (`/filhotes/[slug]`, `/spitz-anao/cor/[color]`, `/spitz-anao/[city]`)

### 🟡 IMPORTANTE (Próximas 2 semanas)
6. ✅ Admin CRUD completo (create/edit puppies)
7. ✅ Admin de leads completo
8. ✅ Testes unitários críticos (domain, service, API)
9. ✅ Error boundary global
10. ✅ Metadata dinâmico em todas as rotas

### 🟢 DESEJÁVEL (Backlog)
11. ✅ RBAC no admin
12. ✅ E2E tests
13. ✅ Bundle analysis
14. ✅ A11y audit completo
15. ✅ CI/CD pipeline

---

## 🎯 CHECKLIST DE AÇÃO IMEDIATA

- [ ] **ETAPA 1:** Consolidar tipos Puppy
- [ ] **ETAPA 2:** Criar service layer completo
- [ ] **ETAPA 3:** Rotas dinâmicas SEO
- [ ] **ETAPA 4:** Admin CRUD puppies
- [ ] **ETAPA 5:** Admin gestão de leads
- [ ] **ETAPA 6:** Remover código morto
- [ ] **ETAPA 7:** Testes críticos
- [ ] **ETAPA 8:** Deploy confidence (CI/CD)

---

**Próximo Passo:** Executar ETAPA 2 (Catálogo Vivo + Modelagem de Domínio)

