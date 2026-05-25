# ⚡ Setup Rápido: Canonical Tags + SeoHead

**Tempo estimado:** 5 minutos

---

## 1️⃣ Definir Domínio Principal

### Usar `www.byimperiodog.com.br` (Domínio Principal)

**Vercel Dashboard:**
```
Settings → Environment Variables → Add New

NEXT_PUBLIC_CANONICAL_ORIGIN  = https://www.byimperiodog.com.br
NEXT_PUBLIC_SITE_URL          = https://www.byimperiodog.com.br
```

**Netlify:**
```
Site Settings → Build & deploy → Environment → Add a single variable

NEXT_PUBLIC_CANONICAL_ORIGIN = https://www.byimperiodog.com.br
NEXT_PUBLIC_SITE_URL = https://www.byimperiodog.com.br
```

**Local Development:**
```bash
# .env.local
NEXT_PUBLIC_CANONICAL_ORIGIN=https://www.byimperiodog.com.br
NEXT_PUBLIC_SITE_URL=https://www.byimperiodog.com.br
```

### Padrão (Sem Precisar Configurar)

Sem mudar nada, o sistema usa automaticamente:
```typescript
// Padrão em seo.core.ts
https://www.byimperiodog.com.br
```

---

## 2️⃣ Verificar Componentes Instalados

Estes arquivos já foram criados:

```bash
✅ src/components/SeoHead.tsx          # Client component
✅ src/components/SeoHeadServer.tsx    # Server component
✅ src/lib/seo.core.ts                 # Já atualizado
✅ app/layout.tsx                      # Já integrado
```

**Comando para verificar:**
```bash
ls -la src/components/SeoHead*
ls -la src/components/SeoHeadServer.tsx
```

---

## 3️⃣ Usar em Páginas

### Homepage & Páginas Estáticas

Já aplicado automaticamente via `layout.tsx`.

**Para cada página, use:**

```tsx
// app/sua-pagina/page.tsx
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  path: '/sua-pagina',
  title: 'Título da Página | By Imperio Dog',
  description: 'Descrição com 150 caracteres...',
  keywords: ['palavra', 'chave'],
});

export default function SuaPagina() {
  return <div>Conteúdo...</div>;
}
```

### Blog Posts (Dinâmicos)

```tsx
// app/blog/[slug]/page.tsx
import { buildBlogPostMetadata } from '@/lib/seo.core';

export async function generateMetadata({ params }) {
  return buildBlogPostMetadata({
    slug: params.slug,
    title: 'Como Cuidar de um Spitz',
    description: 'Guia prático e informações importantes...',
    image: '/blog-img.jpg',
    published: '2026-02-01',
  });
}

export default function BlogPage() {
  return <article>...</article>;
}
```

### Pages com SEO Dinâmico (Runtime)

```tsx
'use client';

import { SeoHead } from '@/components/SeoHead';
import { useEffect, useState } from 'react';

export default function DynamicPage() {
  const [canonical, setCanonical] = useState('');

  useEffect(() => {
    // Calcular canonical baseado em state/props
    setCanonical('https://www.canilspitzalemao.com.br/...');
  }, []);

  return (
    <>
      <SeoHead 
        canonical={canonical}
        title="Título Dinâmico"
        description="Descrição calculada"
      />
      <div>Conteúdo...</div>
    </>
  );
}
```

---

## 4️⃣ Testar

### Local

```bash
npm run dev

# Abrir: http://localhost:3000
# DevTools (F12) > Elements > <head>
# Procurar por: <link rel="canonical" ... />
```

### Produção

```bash
# Verificar canonical
curl -s https://www.canilspitzalemao.com.br/filhotes | grep canonical

# Esperado:
# <link rel="canonical" href="https://www.canilspitzalemao.com.br/filhotes" />
```

### SEO Audit

```bash
# Validação automática
npm run seo:audit
```

---

## 5️⃣ Deploy

1. Commit: `git add . && git commit -m "feat: implement canonical tags and SeoHead components"`
2. Push: `git push origin main`
3. Aguardar deploy automático
4. Monitorar Google Search Console por 24h

---

## ❓ FAQ

**P: Qual é a diferença entre SeoHead e SeoHeadServer?**
- `SeoHeadServer`: Renderiza no servidor (layout.tsx) - mais rápido SEO
- `SeoHead`: Renderiza no cliente - para dinâmico em runtime

**P: Preciso remover hreflang manualmente?**
- Não, foi removido do código. Se encontrar `<link rel="alternate" hreflang...`, delete.

**P: Por que dois arquivos de componente?**
- Redundância para flexibilidade. Layout usa Server, pages usam conforme necessário.

**P: E páginas /admin?**
- Sem canonical (noindex automático via adminNoIndexMetadata)

**P: Canonical precisa ser https?**
- Sim, sempre. Mesmo http:// redirecionará para https:// . Nunca use http.

---

## 📞 Suporte

Documentação completa: [Sistema_SEO_CANONICAL.md](./Sistema_SEO_CANONICAL.md)
