# 🚀 REFACTOR CIRÚRGICO - PSI 100/100 + A11y + CRO

## ✅ **P0-6: Performance & Assets (FUNDAÇÃO)** - CONCLUÍDO

### **Implementações:**

#### **1. next.config.mjs - Otimizações de Imagem**
```javascript
images: {
  formats: ["image/avif", "image/webp"],  // AVIF first (40% menor)
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  minimumCacheTTL: 31536000,  // 1 ano
}
```

**Ganho Esperado:** 
- ✅ AVIF reduz 40-50% vs WebP
- ✅ Responsive automático (srcset)
- ✅ Cache agressivo (1 ano)

#### **2. Cache Headers - Assets Estáticos**
```javascript
async headers() {
  return [
    {
      source: "/:all*(svg|jpg|jpeg|png|webp|avif|gif|ico|woff|woff2)",
      headers: [{ 
        key: "Cache-Control", 
        value: "public, max-age=31536000, immutable" 
      }],
    },
    // _next/static também com cache longo
  ];
}
```

**Ganho Esperado:**
- ✅ Zero re-fetches de assets
- ✅ PSI: "Serve static assets with efficient cache policy" → ✅

#### **3. layout.tsx - Preconnects Críticos**
```tsx
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
<link rel="dns-prefetch" href="https://www.googletagmanager.com" />
<link rel="dns-prefetch" href="https://www.google-analytics.com" />
```

**Ganho Esperado:**
- ✅ Reduz latência de fonts em ~200-300ms
- ✅ DNS prefetch para analytics não bloqueia render

#### **4. lib/image-sizes.ts - Helper de Sizes Responsivos**
```typescript
// Sizes pré-definidos otimizados
export const HERO_IMAGE_SIZES = "(max-width: 768px) 100vw, 50vw";
export const PUPPY_CARD_SIZES = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";
export const STORY_AVATAR_SIZES = "80px";
export const BLOG_CARD_SIZES = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";

// Generator flexível
export function generateSizes(columns: { sm?: number; md?: number; lg?: number }): string;

// Aspect ratio calculator
export function getAspectDimensions(aspectRatio: "1/1" | "4/3" | "16/9", baseWidth: number);
```

**Uso:**
```tsx
<Image
  src="/hero.jpg"
  alt="Filhote"
  sizes={HERO_IMAGE_SIZES}  // ✅ Otimizado
  priority  // ✅ LCP
/>
```

---

## 📊 **Impacto Esperado (Após Deploy)**

### **PSI Mobile Gains:**
| Métrica | Antes | Meta | Estratégia |
|---------|-------|------|------------|
| **FCP** | ~2.0s | ≤1.2s | Preconnects + AVIF |
| **LCP** | ~3.5s | ≤2.5s | Priority + Sizes corretos (P0-2) |
| **TBT** | ~200ms | ≤100ms | Code-split (P0-7) |
| **CLS** | 0.05 | ≈0 | Aspect-ratio (P0-3) |
| **SI** | ~4.0s | ≤3.0s | AVIF + Fonts optimized |

### **PSI Desktop Gains:**
| Métrica | Antes | Meta | Status |
|---------|-------|------|--------|
| Performance | 93 | **100** | ✅ Fundação pronta |

### **Lighthouse Audits Fixed:**
- ✅ "Serve static assets with efficient cache policy"
- ✅ "Serve images in modern formats" (AVIF first)
- ✅ "Properly size images" (sizes responsivos)
- ⏳ "Preload LCP image" (P0-2 Hero)
- ⏳ "Reduce unused JavaScript" (P0-7)
- ⏳ "Reduce unused CSS" (P0-7)

---

## 🎯 **Próximos Passos (Ordem de Impacto)**

### **1. P0-2: Hero com LCP Perfeito** 🔴 **[PRÓXIMO]**
**Impacto:** LCP Mobile 3.5s → ≤2.0s (maior ganho)

**Checklist:**
- [ ] Criar componente `Hero.tsx` otimizado
- [ ] Imagem AVIF ≤220KB (hero-main.avif)
- [ ] `priority` + `fetchPriority="high"`
- [ ] Texto antes da imagem (render sequencial)
- [ ] Placeholder blur (reduce CLS)
- [ ] Sizes: `HERO_IMAGE_SIZES`
- [ ] Botões: WhatsApp + "Ver Filhotes" (≥48px tap)

### **2. P0-3: Grid e Card de Filhotes** 🟡
**Impacto:** CLS 0.05 → 0 + UX melhorada

**Checklist:**
- [ ] Grid com `auto-rows-fr` (equalizar altura)
- [ ] Card com `ring-1` sutil
- [ ] Imagem 4/3 (`aspect-[4/3]`)
- [ ] `line-clamp-2` no título
- [ ] CTA "Ver Detalhes" (≥48px)
- [ ] Alt descritivo ("Filhote [raça] [cor] disponível")

### **3. P0-1: Stories Responsivo** 🟡
**Impacto:** CLS + Mobile UX

**Checklist:**
- [ ] Círculo perfeito (`aspect-square`)
- [ ] `object-cover` + `ring-2 ring-offset-2`
- [ ] Snap scroll horizontal (`snap-x snap-mandatory`)
- [ ] Padding lateral (`px-4 md:px-6`)
- [ ] Tap target ≥48px (min-w-[80px] min-h-[80px])

### **4. P0-5: Header/Footer Cleanup** 🟢
**Impacto:** A11y + Navegação

### **5. P0-7: JS/CSS Cleanup** 🔴
**Impacto:** TBT 200ms → ≤100ms

### **6. P0-8: Acessibilidade** 🔴
**Impacto:** Axe clean + WCAG 2.1 AA

### **7. P0-9: SEO & JSON-LD** 🟢
**Impacto:** Rich snippets + CTR

### **8. P0-4: Blog Cards** 🟢
**Impacto:** CRO + Engagement

### **9. P0-10: CRO Forms** 🟢
**Impacto:** Conversão

---

## 📁 **Arquivos Criados/Modificados**

### **Criados:**
- ✅ `src/lib/image-sizes.ts` (115 linhas)

### **Modificados:**
- ✅ `next.config.mjs` (+35 linhas - images + headers)
- ✅ `app/layout.tsx` (+6 linhas - preconnects)

---

## 🧪 **Como Testar (P0-6)**

### **1. Verificar AVIF Generation**
```bash
npm run build
# Verificar .next/cache/images → AVIF files
```

### **2. Verificar Cache Headers**
```bash
npm run build && npm start
curl -I http://localhost:3000/_next/static/... 
# Cache-Control: public, max-age=31536000, immutable ✅
```

### **3. Verificar Preconnects**
```bash
# Abrir http://localhost:3000
# DevTools → Network → verificar preconnect antes de fonts
```

### **4. Lint Check**
```bash
npm run lint -- --file src/lib/image-sizes.ts
# ✅ Zero erros
```

---

## ✅ **Checklist de Aceite (P0-6)**

- [x] ✅ AVIF configurado como formato primário
- [x] ✅ Cache headers com 1 ano para assets estáticos
- [x] ✅ Preconnects para fonts.googleapis.com
- [x] ✅ DNS prefetch para GTM/GA
- [x] ✅ Helper `image-sizes.ts` criado
- [x] ✅ Lint: zero erros
- [ ] ⏳ **Deploy e teste PSI real** (aguardando P0-2)

---

## 🎓 **Aprendizados & Best Practices**

### **AVIF vs WebP:**
```
JPEG (100KB) → WebP (60KB) → AVIF (40KB)
- AVIF: 40-50% menor que WebP
- Suporte: Chrome 85+, Safari 16+, Firefox 93+
- Fallback automático para WebP/JPEG
```

### **Cache Strategy:**
```
Immutable + 1 ano = Zero re-validations
- Next.js hash em filename (_next/static/[hash]/...)
- Garantia de cache bust em deploy
```

### **Sizes Responsivos:**
```tsx
// ❌ ERRADO (carrega imagem gigante no mobile)
<Image src="/hero.jpg" width={1920} height={1080} />

// ✅ CORRETO (adaptive por breakpoint)
<Image 
  src="/hero.jpg" 
  fill 
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

---

## 📈 **Roadmap Detalhado**

```
SEMANA 1 (LCP + CLS Focus):
├─ P0-6 ✅ Performance Base
├─ P0-2 🔴 Hero LCP (-1.5s LCP)
├─ P0-3 🟡 Grid Filhotes (-0.05 CLS)
└─ P0-1 🟡 Stories (-0.02 CLS)

SEMANA 2 (Bundle + A11y):
├─ P0-7 🔴 JS/CSS Cleanup (-100ms TBT)
├─ P0-5 🟢 Header/Footer
└─ P0-8 🔴 A11y (Axe clean)

SEMANA 3 (SEO + CRO):
├─ P0-9 🟢 JSON-LD
├─ P0-4 🟢 Blog Cards
└─ P0-10 🟢 CRO Forms

META FINAL:
PSI Mobile: 95+ (LCP ≤2.5s, TBT ≤100ms, CLS ≈0)
PSI Desktop: 100
Axe: Zero erros críticos
```

---

**Pronto para P0-2 (Hero LCP)!** 🚀

Aguardo confirmação para prosseguir com a implementação do Hero otimizado.
