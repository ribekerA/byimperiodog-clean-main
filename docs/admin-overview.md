# Visão geral da área /admin

Diagnóstico textual (sem código) das rotas e páginas admin atuais. Foco: propósito, dados Supabase, ações disponíveis, dependências e pendências/risco.

## /admin/dashboard
- **Objetivo**: console operacional com visão de saúde (leads, estoque, riscos) e insights de IA.
- **Dados Supabase**: tabela `leads` (id, created_at, cor_preferida, sexo_preferido, status), tabela `puppies` (status, price_cents, midia), usados em cálculos de métricas e riscos de demanda.
- **Ações do usuário**: consumir indicadores; não há ações CRUD diretas, apenas leitura e visualização de alertas/insights. Botão de publish no bloco preview (blog) está incluído nos dados do artigo no JSON-LD, mas não há outros gatilhos.
- **Dependências**: `supabaseAdmin`, IA (`generateDeepInsights`, `generateDecisions`, `recalcDemandPredictions`, `AIInsightsPanel`, `OperationalAlertsPanel`), componente `actions.ts` (server action), `insights.ts` (mapeamento de payload).
- **Pendências/risco**: warnings de “Critical dependency” não afetam aqui. Sem mocks aparentes. Atenção a duplicidade anterior de `mapDeepInsightsToPayload` (já isolada em `insights.ts`). Nenhuma interação de update real (somente leitura).

## /admin/puppies
- **Objetivo**: gestão de filhotes (listar, alterar status, criar/editar).
- **Dados Supabase**:
  - Página principal usa `listPuppiesCatalog` (Supabase `puppies` + normalização) com limite 200, inclui datas e status.
  - Edições/criação usam API `/api/admin/puppies/manage` para status e `/api/admin/puppies`/`/api/admin/puppies/manage` para persistir (supabase tables `puppies`, `puppy_media` etc.).
  - Formulário converte URLs de storage Supabase para público.
- **Ações**: mudar status via tabela; navegar para `/admin/puppies/new`, `/edit/[id]`, `/[id]` para detalhes. Uploads e reorder de mídia via `MediaManager` (chama APIs admin de upload/presign). Edit page chama `/api/admin/puppies?id=...`.
- **Dependências**: `listPuppiesCatalog`, client components `PuppiesTable`, `PuppiesPageClient`, `_components` (Form, MediaManager, ColorSelector, PriceInputMasked), API routes `app/api/admin/puppies/*`.
- **Pendências/bugs**:
  - Build atual falha em `/api/admin/puppies/route.ts` (type guard fraco: assume `entry.url` em um objeto tipado `{}`) – precisa ajustar union/string/objeto antes de acesso.
  - Lead counts passados como `{}` (sem integração real).
  - Algumas páginas extras (`page.tsx` vs `pageClient.tsx`, `PuppiesBoard`, `PuppiesView`) parecem redundantes/não usadas na rota principal.

## /admin/leads
- **Objetivo**: mini-CRM para funil de leads.
- **Dados Supabase**: usa `listLeadsAdmin` (tabela `leads`, possivelmente join de interações) para listar. Detalhe `[id]` carrega lead via `supabaseAdmin` (seleção por id) e interações relacionadas.
- **Ações**: alterar status via `/api/admin/leads/status`; gerar “IA” via `/api/admin/leads/intel`; links para WhatsApp com mensagem padrão; filtros de cidade/cor/status; ordenar por risco/status; abrir detalhe.
- **Dependências**: `LeadsCRM`, `computeLeadRisk`, UI badges (`LeadFraudBadge`, `LeadCrossMatchCard`, etc.), API routes admin de leads.
- **Pendências/bugs**:
  - Recentemente havia erro de tipo “anchor” por index inválido; foi normalizado para map fixo de status (ok).
  - Campos de IA usam estado local; podem estar desconectados de backend (sinais guardados apenas no cliente).
  - `mock-data.ts` existe (mock), mas página principal já usa Supabase; precisa remover/garantir não usado.

## /admin/analytics
- **Objetivo**: visão analítica (leads, interações, estoque, IA, SEO autopilot).
- **Dados Supabase**:
  - `leads` (fetch limitado e desde data), `lead_interactions` (tempo de resposta, mensagens), `puppies`, `catalog_ai_events`.
  - Usa vários módulos de IA (conversion analyzer, dashboard narrative, deep insights, decisions, demand prediction, catalog analytics, autopilot SEO) que combinam dados supabase.
- **Ações**: leitura; não há ações de escrita. Renderiza cards, gráficos e narrativas.
- **Dependências**: `supabaseAdmin`, AI libs citadas, chart components (`MetricCard`, `BarChart`, `LineChart`, `PieChart`).
- **Pendências/risco**:
  - Grande quantidade de IA custom; validar que tabelas (`lead_interactions`, `catalog_ai_events`) existem/populadas.
  - Se tabelas vazias, cards ficam vazios; não há mocks explícitos.

## /admin/config
- **Objetivo**: gerenciar config de marca/SEO/contato.
- **Dados Supabase**: tabela `admin_config` (id=default). Campos: brand_name/tagline, contatos, redes, mensagens WhatsApp, templates de contato/followup, regras, SEO defaults.
- **Ações**: editar e salvar via `ConfigForm` (POST `/api/admin/settings`? – precisa confirmar rota usada; form recebe initialData, submit provavelmente atrelado à API).
- **Dependências**: `supabaseAdmin` para fetch inicial; `ConfigForm` UI.
- **Pendências**: confirmar endpoint real de save; se `/api/admin/settings` não existir/retornar ok, botão falha silenciosamente. Testar em produção.

## /admin/config/tracking
- **Objetivo**: configurar pixels (GTM, GA4, Meta, TikTok, Pinterest, Hotjar, Clarity).
- **Dados Supabase**: fetch em `/api/admin/settings` (mesma rota da config geral) para `PublicTrackingSettings`.
- **Ações**: editar campos e salvar via POST `/api/admin/settings`.
- **Dependências**: `TrackingSettingsPage`, `TrackingSettingsForm`.
- **Pendências/bugs**: value precisava ser string (ajustado). Garantir que `settings` API trate arrays customizados (há campo `custom_pixels` no tipo público? se voltar array, input ignore).

## /admin/analytics (subrotas blog)
- `/admin/blog/analytics`, `/admin/blog/comments`, `/admin/blog/editor`, `/admin/blog/preview/[id]`, `/admin/blog/schedule`: blog tooling.
- **Dados**: maioria menciona TODO/mocks (analytics page tem TODO comentário; comments page TODO). Editor/preview integram Supabase `blog_posts` via compile; preview carrega dados de Supabase/MDX.
- **Pendências**: vários arquivos duplicados/antigos (`page.old.tsx`), wizard; verificar quais realmente expostos no menu. Muitos podem ser legados e não referenciados.

## /admin/content, /admin/media, /admin/web-stories, /admin/relatorios, /admin/system/health, /admin/experiments, /admin/pixel-experiments
- **Objetivo**: utilitários diversos (editor, calendário, web stories, relatórios, health).
- **Dados**: vários são mocks ou placeholders:
  - `/admin/content` exibe texto “Tabela de conteúdo (mock)”.
  - `/admin/settings` (não confundir com config) menciona “UI mock”.
  - Web stories/new, media, relatorios, experiments, pixel-experiments: parecem estáticos/dummy; não vi chamadas supabase.
- **Pendências**: ligar a bancos/rotas reais ou ocultar.

## /admin/login e layouts
- Auth layout `/admin/(auth)/layout.tsx`, login page; guarda fluxo básico.
- Protected layout `/admin/(protected)/layout.tsx` inclui `AdminNav`, `AdminTopbar`, guard.
- Guard layout at root `/admin/guard-layout.tsx`.
- Dependências: validação de sessão (ver `lib/auth` fora deste escopo).

## Problemas e itens duplicados/desnecessários
- API `/api/admin/puppies/route.ts` acessa `entry.url` em objeto tipado `{}` -> quebra build; precisa type guard.
- Conteúdo contentlayer warnings continuam, mas não bloqueiam admin.
- Páginas duplicadas/legadas: `app/(admin)/admin/page.tsx` (redirect?), `posts/page.tsx`, `blog/page.old.tsx`, `puppies/edit/pageClient.tsx` e `puppies/edit/page.tsx` coexistem; validar rota ativa e remover ocioso.
- Mocks: `content/page.tsx`, `settings/page.tsx`, `leads/mock-data.ts`, TODOs em blog analytics/comments.
- Integrações parcialmente ligadas: lead IA cards em LeadsCRM guardam state local; lead counts em PuppiesPageClient estão vazios; tracking settings dependem de API compartilhar shape correto.

## Próximos passos sugeridos (diagnóstico)
- Consertar type guard em `/api/admin/puppies/route.ts` para descompactar mídia (string vs {url/src}).
- Revisar endpoints usados por Config/Tracking (`/api/admin/settings`) e garantir suporte a todos os campos e tipos (arrays).
- Decidir quais páginas legadas (blog analytics/comments old, content mocks, settings mock, pixel-experiments) permanecem; remover/ocultar se não serão finalizadas.
- Preencher leadCounts no catálogo admin ou esconder coluna até integrar.
- Validar tabelas `lead_interactions`, `catalog_ai_events`, `admin_config` no Supabase; se faltarem, ajustar seed/migrações.
