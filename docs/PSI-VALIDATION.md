# PSI validation guide

Este guia mostra como validar (produção) os itens pendentes da sua otimização de performance:

- PSI-7: Headers de cache/CDN corretos
- PSI-8: Lighthouse CI (já configurado, uso opcional)
- PSI-9: Vercel Speed Insights (RUM)

---

## PSI-7 — Validar headers de cache em produção

Pré-requisito: site publicado em produção (Vercel).

1) Validação automática (recomendado)

```powershell
npm run cache:verify -- --url=https://SEU-DOMINIO.vercel.app
```

Saída esperada (OK por item):
- `/spitz-hero-desktop.webp` → `Cache-Control: public, max-age>=31536000, immutable`
- `/_next/image?url=/spitz-hero-desktop.webp&w=1080&q=75` → `Cache-Control: public, max-age>=604800`

2) Validação manual (DevTools)
- Abra a home em produção → aba Network
- Selecione:
  - `spitz-hero-desktop.webp` (direto do public)
  - qualquer `/_next/image?...`
- Confirme os headers conforme acima

Se qualquer item falhar, abra `next.config.mjs` e verifique a função `headers()`; por padrão, este projeto já define:
- `public, max-age=31536000, immutable` para `/:all*(svg|jpg|jpeg|png|webp|avif|gif|ico|woff|woff2)` e `/_next/static/*`
- `public, max-age=604800, stale-while-revalidate=86400` para `/_next/image*`

---

## PSI-8 — Rodar Lighthouse CI local (opcional)

1) Build de produção e autorun do LHCI (usa `lighthouserc.json`):
```powershell
npm run lh:ci
```

2) Executar apenas a home e salvar JSON:
```powershell
npm run lh:run
```

Metas (mobile) configuradas em `lighthouserc.json`:
- LCP ≤ 1200 ms
- TBT ≤ 50 ms
- CLS = 0
- Script ≤ 70 KB; Total ≤ 180 KB

Se algum item estourar, o LHCI mostra `warn`/`fail` no console e gera relatórios em `reports/`.

---

## PSI-9 — Vercel Speed Insights (RUM)

1) Confirmar integração
- `app/layout.tsx` já importa `@vercel/speed-insights/next` e renderiza `<SpeedInsights />`

2) Validar no painel
- Vá ao projeto no Vercel → Speed Insights
- Verifique se eventos estão chegando (LCP, INP, CLS reais de usuários)
- Compare com as metas: LCP p95 ≤ 2.5s / CLS p95 ~0

3) Dicas
- Acompanhe picos de TBT/TBT em páginas específicas
- Cruce com o Web Vitals do GA4 (se habilitado)

---

## Troubleshooting

- `fetch failed` ao validar headers localmente: use a URL de produção (loopback no Windows pode bloquear)
- `lh:ci` falha no start: rode `npm run build` e `npm run start` em outro terminal e depois `npm run lh:run`
- Diferença entre Lighthouse e Speed Insights: Lighthouse é laboratório (simulado); Speed Insights é RUM (usuários reais)
