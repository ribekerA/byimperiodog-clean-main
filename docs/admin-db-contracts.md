# Contratos de dados do /admin (Supabase)

Este documento mapeia cada tela do admin para as tabelas/colunas do Supabase e o que falta para ficar 100% funcional. Tipos correspondentes estão em `lib/db/types.ts`.

## Dashboard (/admin/dashboard)
- **Tabelas**: `leads` (id, created_at, cor_preferida, sexo_preferido, status), `puppies` (status, price_cents, midia), `demand_predictions?` (via IA), `lead_interactions` (tempo resposta) e `catalog_ai_events` (para IA de catálogo).
- **Campos obrigatórios**: ids, status, price_cents, created_at. Para previsões, precisa de base histórica consistente.
- **Pendências**: garantir existência de `lead_interactions` e `catalog_ai_events` ou ajustar fallback; nenhum write.

## Filhotes (/admin/puppies e subrotas new/edit/view)
- **Tabela principal**: `puppies`.
- **Campos lidos/escritos**: id, slug, name, gender, status, color, price_cents, city/state, descricao/notes, birth_date, ready_for_adoption_date, image_url/video_url, midia (array), created_at/updated_at/published_at/sold_at/reserved_at/reservation_expires_at, vaccination_dates/next_vaccination_date.
- **Relacionamentos**: mídia pode vir de storage; lead counts ainda não ligados (falta relação Lead->puppy_id).
- **Pendências**: API `/api/admin/puppies/route.ts` precisa type guard para midia (string vs {url/src}). LeadCounts vazio → definir view ou join com leads.

## Leads (/admin/leads, /admin/leads/[id])
- **Tabela**: `leads`.
- **Campos**: id, nome, telefone, cidade/estado, cor_preferida, sexo_preferido, status, page/page_slug, utm_source/utm_medium/utm_campaign, referer, mensagem/notes, created_at/updated_at.
- **Relacionamentos**: opcional `lead_interactions` (response_time_minutes, messages_sent) por lead_id; potencial vínculo com `puppies` (não implementado).
- **Pendências**: IA cards usam estado local; se quiser persistir, criar tabela `lead_intel` ou colunas adicionais. `mock-data.ts` é legado.

## Analytics (/admin/analytics)
- **Tabelas**: `leads`, `lead_interactions`, `puppies`, `catalog_ai_events`.
- **Campos**: usa slices de tempo (created_at), CTR badges (ctr_before/ctr_after), badges/tipo de evento, response_time_minutes/messages_sent.
- **Pendências**: se tabelas estiverem vazias, gráficos ficam vazios; garantir migrações para `catalog_ai_events` e `lead_interactions`.

## Config (/admin/config)
- **Tabela**: `admin_config` (id = "default").
- **Campos**: brand_name, brand_tagline, contact_email/contact_phone, instagram/tiktok, whatsapp_message, templates de contato/followup, followup_rules, avg_response_minutes, seo_title_default, seo_description_default, seo_meta_tags, updated_at.
- **Pendências**: confirmar rota de persistência `/api/admin/settings` ou criar rota dedicada para `admin_config`.

## Tracking (/admin/config/tracking)
- **Tabela**: `tracking_settings` (id = "default").
- **Campos**: gtm_id, ga4_id, meta_pixel_id, tiktok_pixel_id, pinterest_tag_id, hotjar_id, clarity_id, custom_pixels (jsonb), updated_at.
- **Pendências**: `/api/admin/settings` deve aceitar/retornar esses campos; hoje input assume string → se `custom_pixels` vier array precisa de UI própria.

## Blog admin (analytics/comments/editor/preview/schedule)
- **Tabela**: `blog_posts` (id, slug, title, subtitle, excerpt, content_mdx, cover_url/alt, published_at/created_at/updated_at, status, author_id, seo_title/description, category, tags, lang). Autores em `blog_authors`.
- **Pendências**: páginas analytics/comments estão marcadas como TODO/mocks; decidir se serão ligadas ou removidas.

## Content/Media/Web-stories/Relatórios/Experiments
- **Status**: principalmente mock/placeholder. Não há ligação clara com tabelas; definir tabelas ou ocultar.

## Admin Users (/admin/login flows)
- **Tabela sugerida**: `admin_users` (id, email, role, name, active, last_login_at, created_at). Se usar Supabase Auth padrão, refletir claims/roles via tabela auxiliar.
- **Pendências**: confirmar existência; tipagem em `lib/db/types.ts`.

## Contratos mínimos por tela
- **Dashboard**: requires `leads` + `puppies` existentes; opcional `lead_interactions`, `catalog_ai_events`.
- **Puppies**: requer `puppies` com campos listados; uploads dependem de storage público.
- **Leads**: requer `leads`; opcional `lead_interactions`; vínculo com puppy ainda não usado.
- **Config/Tracking**: requer `admin_config` e `tracking_settings` com id "default".
- **Blog**: `blog_posts`, `blog_authors`; contentlayer pode continuar para MDX estático.
- **Analytics**: depende das tabelas acima estarem populadas.

## Ações recomendadas antes de aplicar nas páginas
1) Validar schema no Supabase: criar migrações para `tracking_settings`, `admin_config`, `catalog_ai_events`, `lead_interactions`, `admin_users` se faltarem; garantir colunas `slug` NOT NULL em `puppies`.
2) Padronizar nomes: usar snake_case no banco (e.g., `price_cents`, `birth_date`, `ready_for_adoption_date`) e mapear no app via tipos de `lib/db/types.ts`.
3) Atualizar chamadas:
   - `/api/admin/puppies/route.ts`: type guard de midia (string | {url|src}); mapear para `midia` jsonb.
   - `PuppiesPageClient`: usar `PuppyRow` e mapear datas string → Date apenas no cliente.
   - `LeadsCRM`: usar `LeadRow`, remover aliases antigos se banco já padronizado.
   - Config/Tracking forms: tipar payloads com `AdminConfigRow` e `TrackingSettingsRow`; garantir POST envia null para campos vazios.
4) Remover mocks/legado: `content/page.tsx`, `settings/page.tsx`, `leads/mock-data.ts`, `blog/page.old.tsx` se não usados.
5) Documentar relações: se lead puder referenciar puppy, adicionar `puppy_id` em `leads` e usar no admin (recomendações/filtragem).

Use este contrato como referência para alinhar os tipos TS nas páginas admin.
