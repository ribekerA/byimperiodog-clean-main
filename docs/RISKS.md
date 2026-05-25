# RISCOS — P0 / P1 / P2

Atualizado em: 2025-10-26

## P0 (críticos)
- Injeção de HTML arbitrário para pixels custom (resolvido): blocos removidos de `app/layout.tsx`. Apenas modelos oficiais por IDs sanitizados via `<Pixels />`.
- Consentimento: Garantir que pixels de marketing/analytics só disparem após aceite — coberto por `PixelsByConsent.tsx` e configurações do Admin.
- Admin no índice: `noindex, nofollow` e `X-Robots-Tag` já aplicados no layout do Admin; manter exclusão do `/admin` do sitemap.

## P1 (importantes)
- Divergência de origem dos IDs (site_settings vs pixels_settings): público deve usar `pixels_settings` como fonte única. Verificar migração completa e desativar campos legados em `site_settings`.
- Build Windows + Contentlayer: wrapper já mitiga erro de exitCode; monitorar upgrades.
- CSP: considerar nonce para scripts se futuro endurecimento de política for necessário.
- Dados de contato/PII em conteúdo: validar com `content-guard.mjs` e revisão editorial.

## P2 (observações)
- Robustez do TOC: conferir headings dinâmicos de MDX com anchors gerados.
- Imagens das histórias: garantir tamanhos adequados em origem para evitar downscale em runtime.
- Métricas RUM: Speed Insights ativo; complementar com endpoint interno opcional de Web Vitals, se necessário.

## Planos de mitigação
- Testes: unit (seo/schema/guard), integração (páginas públicas + stories + pixels form) e E2E (fluxos principais) — ver `tests/`.
- Monitoração: usar Speed Insights + verificação periódica de consent rate e firing de pixels.
- Deploy: Vercel com builds reproduzíveis; manter `prebuild` com content-guard para evitar regressões de conteúdo.
