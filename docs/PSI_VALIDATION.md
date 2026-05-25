# PSI Validation Checklist — Otimização Final

## ✅ Pré-Deploy Checklist

### Build & Performance
- [x] Build production passa sem erros: `npm run build`
- [x] TypeScript check limpo
- [x] 111 páginas estáticas geradas
- [x] Next/font configurado (DM Sans + Inter)
- [x] Google Fonts preconnects removidos
- [x] Framer Motion removido (CSS animations only)
- [x] Hero image preload ativo

### SEO Isolation
- [x] Admin metadata com `robots: { index: false }`
- [x] Middleware adiciona `X-Robots-Tag: noindex` para `/admin` e `/api/admin`
- [x] Sitemaps NÃO incluem rotas admin
- [x] Admin layout com `dynamic="force-dynamic"`

### Admin Refactor Completo
- [x] P0-1: Layout + Sidebar + Topbar + SkipLink
- [x] P0-2: DataTable Virtualizado (TanStack + React Virtual)
- [x] P0-3: Wizard Gamificado (RHF+Zod, autosave, confetti)
- [x] P0-4: Form Components com A11y completo
- [x] P0-5: UX States (skeletons, empty, errors, toasts, tooltips)

---

## 🚀 Deploy Steps

### 1. Commit & Push
```powershell
git add .
git commit -m "feat: complete admin refactor + performance optimization (P0-1 to P0-5)"
git push origin main
```

### 2. Verificar GitHub Actions
- Workflow: `.github/workflows/deploy-vercel.yml`
- Aguardar build & deploy automático
- Confirmar deployment URL no Vercel dashboard

### 3. Verificar Environment Variables
No Vercel Dashboard → Settings → Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY` (se necessário)
- Analytics pixels (GA4, GTM, Meta, etc.)

---

## 🎯 PageSpeed Insights Targets

### URLs para Testar
1. **Home**: `https://[seu-dominio].vercel.app/`
2. **Blog Index**: `https://[seu-dominio].vercel.app/blog`
3. **Filhotes**: `https://[seu-dominio].vercel.app/filhotes`
4. **Sobre**: `https://[seu-dominio].vercel.app/sobre`
5. **Admin (verificar noindex)**: `https://[seu-dominio].vercel.app/admin`

### Performance Targets
- **Mobile Score**: ≥ 95
- **Desktop Score**: 100
- **LCP (Largest Contentful Paint)**: < 2.5s
- **CLS (Cumulative Layout Shift)**: < 0.1
- **FID/INP (Interação)**: < 100ms

### SEO Targets
- **SEO Score**: 100
- **Accessibility**: 100
- **Best Practices**: ≥ 95

### Admin Validation
- [ ] `/admin` retorna `X-Robots-Tag: noindex` no header
- [ ] `/admin` NÃO aparece em sitemaps
- [ ] Google Search Console: `site:[seu-dominio] /admin` → 0 resultados

---

## 🧪 Post-Deploy Validation Script

Após deploy, execute:

```powershell
node scripts/psi-validation.mjs
```

Este script irá:
1. Testar todas as URLs principais no PSI
2. Gerar relatório JSON com scores
3. Validar headers de SEO isolation
4. Comparar com baseline `reports/perf-baseline.md`

---

## 📊 Expected Results

### Otimizações Implementadas
1. **Fonts**: next/font com display=swap (DM Sans + Inter)
2. **Hero**: Preload LCP image
3. **Animations**: CSS-only (sem Framer Motion)
4. **Resource Hints**: Conditional dns-prefetch/preconnect para analytics
5. **JSON-LD**: Schema.org structured data
6. **Metadata**: Otimizado com Metadata API
7. **Dual CTAs**: WhatsApp + Form na hero
8. **StickyCTA**: Sticky footer com WhatsApp

### Build Size (Expected)
- **Home**: ~224 kB First Load JS
- **Blog pages**: ~103-109 kB
- **Middleware**: 27.2 kB
- **Admin Wizard**: 118 kB (isolado do público)

---

## ⚠️ Troubleshooting

### Se Mobile Score < 95:
1. Verificar se hero preload está ativo
2. Checar se fonts carregam com display=swap
3. Validar que analytics pixels não bloqueiam render
4. Inspecionar CLS (layout shifts) com DevTools

### Se Desktop Score < 100:
1. Verificar Total Blocking Time (TBT)
2. Checar se há JavaScript não utilizado
3. Validar compression (gzip/brotli) no Vercel

### Se Admin aparece em SEO:
1. Verificar middleware.ts está deployado
2. Confirmar headers `X-Robots-Tag` com DevTools Network
3. Checar sitemap.xml generation (route handlers)

---

## ✅ Success Criteria

Deploy considerado **bem-sucedido** quando:

- ✅ Todas as 4 URLs públicas: Mobile ≥ 95, Desktop = 100
- ✅ LCP < 2.5s em todas as páginas
- ✅ CLS < 0.1 em todas as páginas
- ✅ SEO Score = 100
- ✅ Accessibility = 100
- ✅ `/admin` com `noindex` header confirmado
- ✅ Zero regressões vs. baseline
- ✅ Admin features funcionais (wizard, table, form components)

---

## 📝 Notes

- **Contentlayer warning** (Clipanion exitCode): conhecido e suprimido no wrapper
- **Edge runtime warning**: esperado para algumas rotas API
- **Build time**: ~2-3 min no GitHub Actions com Node 20

**Status**: ⏳ Aguardando deploy para execução dos testes PSI
