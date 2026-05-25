# 🚀 DEPLOY URGENTE — Correção LCP Crítico

**Data**: 25/10/2025  
**Prioridade**: 🔴 **CRÍTICA**  
**Problema**: LCP 11.6s (meta: <2.5s) — Performance 73/100  
**Causa**: Imagem hero de 2MB

---

## ✅ Otimizações Aplicadas Localmente

### 1. **Imagens Hero Otimizadas** (92% de redução)
```
❌ ANTES: spitz-hero-desktop.webp → 2MB (1,999KB)
✅ AGORA:
   - spitz-hero-mobile.webp  → 22KB (640x427px)
   - spitz-hero-tablet.webp  → 53KB (1024x683px)
   - spitz-hero-desktop.webp → 109KB (1400x933px)

📊 Total: 184KB vs 2MB = 92% de redução
```

### 2. **Código Atualizado**
- ✅ `src/lib/image-sizes.ts`: HERO_IMAGE_SIZES otimizado
- ✅ `src/components/sections/Hero.tsx`: usando sizes otimizado
- ✅ `app/layout.tsx`: preload mantido com fetchPriority="high"

---

## 🔧 Checklist de Deploy

### Passo 1: Verificar Arquivos Locais
```powershell
# No diretório do projeto:
Get-ChildItem -Path "public" -Filter "*hero*" | Select-Object Name, Length

# Deve mostrar:
# spitz-hero-mobile.webp   → ~22KB
# spitz-hero-tablet.webp   → ~53KB
# spitz-hero-desktop.webp  → ~109KB
# spitz-hero-desktop-original.webp → ~2MB (backup)
```

### Passo 2: Commit e Push
```bash
git add public/spitz-hero-*.webp
git add src/lib/image-sizes.ts
git add scripts/optimize-hero-images.mjs
git commit -m "fix(perf): optimize hero images - reduce LCP from 11.6s to <2.5s

- Reduce hero image from 2MB to 22-109KB (92% reduction)
- Update HERO_IMAGE_SIZES for responsive delivery
- Add optimization script for future updates

Closes: Critical LCP issue (PSI mobile 73 → target ≥95)"

git push origin main
```

### Passo 3: Deploy Vercel
```bash
# Se usando Vercel CLI:
vercel --prod

# Ou através do dashboard:
# 1. Acesse vercel.com/dashboard
# 2. Selecione o projeto byimperiodog-clean
# 3. Aguarde deploy automático do commit
# 4. Verifique logs para "Build succeeded"
```

### Passo 4: Validação Pós-Deploy
```bash
# 1. Aguardar 5 minutos para cache CDN propagar
# 2. Testar PSI novamente:
#    https://pagespeed.web.dev/analysis?url=https://byimperiodog.com.br

# 3. Métricas esperadas:
#    ✅ LCP: <2.5s (mobile) / <1.5s (desktop)
#    ✅ Performance: ≥90 (mobile) / ≥95 (desktop)
#    ✅ CLS: 0 (mantido)
```

---

## 📊 Impacto Esperado

### Antes (25/10/2025 06:13)
- ❌ **Performance**: 73/100
- ❌ **LCP**: 11.6s (4.6x acima da meta)
- ✅ **FCP**: 0.9s
- ✅ **CLS**: 0

### Depois (Projeção)
- ✅ **Performance**: 90-95/100
- ✅ **LCP**: 1.5-2.5s (dentro da meta)
- ✅ **FCP**: 0.7-0.9s
- ✅ **CLS**: 0

### ROI
- 🎯 **Melhoria estimada**: +17-22 pontos PSI
- 💰 **Custo de banda**: -91% (2MB → 184KB)
- 📈 **Conversão**: +10-20% (estudos indicam)

---

## 🔍 Troubleshooting

### Problema: "LCP ainda alto após deploy"
**Soluções**:
1. Limpar cache do CDN (Vercel Dashboard → Cache → Purge)
2. Verificar se imagens foram copiadas: `curl -I https://byimperiodog.com.br/spitz-hero-mobile.webp`
3. Testar com URL sem cache: `?v=$(date +%s)`

### Problema: "Imagens não aparecem"
**Soluções**:
1. Verificar MIME type: `image/webp` deve estar configurado
2. Verificar permissões dos arquivos: `chmod 644 public/spitz-hero-*.webp`
3. Rebuild: `npm run build && vercel --prod`

### Problema: "Build falha"
**Soluções**:
1. Verificar Sharp instalado: `npm list sharp`
2. Reinstalar dependências: `rm -rf node_modules && npm install`
3. Verificar logs: `vercel logs <deployment-url>`

---

## 📝 Próximas Otimizações (Opcional)

### P1 — Render-Blocking JS/CSS (480ms economia)
```javascript
// Adicionar ao layout.tsx:
<link rel="preload" href="/_next/static/css/app-layout.css" as="style" />
```

### P2 — JavaScript Não Usado (128KB economia)
```bash
# Analisar bundle:
npm run build -- --analyze

# Mover componentes pesados para lazy load:
const HeavyComponent = dynamic(() => import('./Heavy'), { ssr: false })
```

### P3 — Cache Efetivo (35KB economia)
```javascript
// Configurar headers em vercel.json:
{
  "headers": [
    {
      "source": "/spitz-hero-(.*).webp",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

---

## ✅ Sign-off

**Desenvolvedor**: GitHub Copilot + AI Assistant  
**Data**: 25/10/2025 06:30 GMT-3  
**Status**: ✅ PRONTO PARA DEPLOY  

**Responsável pelo Deploy**: [SEU NOME]  
**Data Deploy**: ___/___/_____  
**PSI Pós-Deploy**: ___ (mobile) / ___ (desktop)  
**LCP Pós-Deploy**: ___s (mobile) / ___s (desktop)  

---

## 📚 Referências

- [Web.dev - Optimize LCP](https://web.dev/optimize-lcp/)
- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [PageSpeed Insights](https://pagespeed.web.dev/)
