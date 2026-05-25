# Arquitetura de Tracking & Pixels (By Império Dog)

## 1. Tabelas (Supabase)

### tracking_settings
- `id uuid pk`
- `environment text` (production, staging, preview…)
- `is_gtm_enabled boolean`
- `gtm_container_id text`
- `is_ga4_enabled boolean`
- `ga_measurement_id text`
- `is_facebook_enabled boolean`
- `facebook_pixel_id text`
- `is_tiktok_enabled boolean`
- `tiktok_pixel_id text`
- `meta_domain_verification text`
- `google_site_verification text`
- `updated_at timestamptz`
- `updated_by uuid (admin_users.id)`
- unique(environment)

### tracking_audit_log (opcional)
- `id uuid pk`
- `admin_id uuid (admin_users.id)`
- `environment text`
- `before jsonb`
- `after jsonb`
- `created_at timestamptz`

## 2. Fluxo de leitura (SSR)
1) `getTrackingConfig(env)` (server) lê `tracking_settings` pelo `environment`.
2) Se não houver registro, faz **fallback para env vars** (`GTM_ID`, `GA4_ID`, `FACEBOOK_PIXEL_ID`, `TIKTOK_PIXEL_ID`, `META_VERIFY`, `GOOGLE_VERIFY`).
3) `RootLayout` recebe `{ isGTMEnabled, gtmContainerId, isGAEnabled, gaMeasurementId, isFacebookEnabled, facebookPixelId, isTikTokEnabled, tiktokPixelId, metaDomainVerification, googleSiteVerification }` e injeta via componentes seguros (`Pixels`, `TrackingScripts`, `<Script>`). **Nunca** injeta HTML/JS do banco, só IDs e flags.

## 3. Fluxo de escrita (Admin)
1) Form em `/admin/tracking` envia payload para `updateTrackingConfig(env, payload, adminUserId)`.
2) Valida apenas IDs/flags (sem scripts).
3) Upsert em `tracking_settings` (chave `environment`).
4) Registra diff em `tracking_audit_log` (before/after/admin_id/environment).

## 4. Governança
- Apenas IDs e flags; **proibido script custom**.
- Ambientes separados por `environment` (production/staging/preview).
- Log de mudanças em `tracking_audit_log` para auditoria.
- Fallback seguro para env vars garante operação mesmo sem registro.

## 5. Integração com RootLayout
- Substituir leitura ad-hoc por `getTrackingConfig()` no SSR.
- Mapear para as variáveis já usadas no layout (GTM_ID, GA4_ID, FACEBOOK_PIXEL_ID, TIKTOK_PIXEL_ID, META_VERIFY, GOOGLE_VERIFY).
- Injeção continua via templates existentes; sem `dangerouslySetInnerHTML` vindo do banco.
