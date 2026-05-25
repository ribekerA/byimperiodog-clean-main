# Arquitetura do Admin (By Império Dog)

## Módulos e rotas principais
- **Dashboard**: `/admin/dashboard` — visão geral (cards) e espaço para KPIs rápidos.
- **Estoque de Filhotes**: `/admin/puppies` — listagem com filtros e ações rápidas; `/admin/puppies/[id]` — criar/editar; API de status/manage.
- **Leads & Funil**: `/admin/leads` — lista com filtros (cidade, cor, status); `/admin/leads/[id]` — detalhe, status e CTA WhatsApp.
- **Relatórios & Métricas**: `/admin/relatorios` — placeholder para gráficos/KPIs (leads por dia, vendas, conversão).
- **Config & Tracking**: `/admin/tracking` — conexões OAuth, IDs de pixels e injeção de tags.
- (Legados ainda presentes: blog/seo/analytics/media/web-stories/etc.) — não removidos, mas fora do foco operacional imediato.

## Layout e navegação
- Layout protegido em `(protected)` com sidebar modular:
  - Dashboard
  - Estoque de Filhotes
  - Leads & Funil
  - Relatórios
  - Config & Tracking
- Topbar minimalista; logout direto. Nav com destaque da rota atual (AdminNav client).
- Rotas admin com `robots: noindex`.

## Autenticação e RBAC
- Login via Supabase Auth (email/senha) + tabela `admin_users` (campo `user_id`, `role`).
- Guard no layout usando `requireAdminLayout` (cookies `admin_auth/adm/admin_role`).
- APIs admin usam `requireAdmin`.

## Dados e integrações
- Filhotes: tabela `puppies` (PT/EN), APIs `/api/admin/puppies/manage`, `/api/admin/puppies/status`, GET por id.
- Leads: tabela `leads`, APIs `/api/admin/leads` (get by id), `/api/admin/leads/status`.
- Tracking: tabelas `tracking_settings`/`pixels_settings`, rota `/admin/tracking`.
- `admin_users`: habilita RBAC para o painel.

## UX atual (resumo)
- Estoque: filtros de status/cor/cidade; ações rápidas de status sem reload; form de create/edit com validação simples.
- Leads: filtros de cidade/cor/status na lista; detalhe com status quick e WhatsApp.
- Dashboard: cards básicos (placeholder para métricas reais).
- Relatórios: placeholder para KPIs e gráficos.

## Pontos a evoluir
- Consolidar/limpar módulos legados (blog/seo/etc.) ou reencaixar em Conteúdo.
- Enriquecer UX de feedback (toasts) nas ações rápidas, busca global, paginação.
- RBAC: aplicar checagem de role/permissão em todas as APIs de admin.
- Relatórios: implementar agregações reais (Supabase) e gráficos.
