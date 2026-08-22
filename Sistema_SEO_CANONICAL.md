# 📖 Sistema SEO com Canonical Tags - Guia Completo

**Data:** 5 de fevereiro de 2026  
**Status:** ✅ Implementado  
**Domínio Canonical:** `https://www.byimperiodog.com.br`

---

## 🎯 O QUE FOI IMPLEMENTADO

### ✅ Canonical Tags Automáticas em Todas as Páginas

```html
<!-- Exemplo: página /filhotes -->
<link rel="canonical" href="https://byimperiodog.com.br/filhotes" />

<!-- Exemplo: página blog /blog/meu-artigo -->
<link rel="canonical" href="https://byimperiodog.com.br/blog/meu-artigo" />

<!-- Homepage -->
<link rel="canonical" href="https://byimperiodog.com.br/" />
```

### ✅ Componentes SEO Criados

#### 1️⃣ **SeoHeadServer** (Server Component)
- **Arquivo:** `src/components/SeoHeadServer.tsx`
- **Uso:** Renderizado no `layout.tsx` global
- **Benefício:** Renderiza canonical tags no servidor para melhor SEO
- **Aplicação:** Automática em todas as páginas públicas

```tsx
// Já aplicado no app/layout.tsx
<SeoHeadServer pathname={pathname} skipCanonical={isAdminRoute} />
```

#### 2️⃣ **SeoHead** (Client Component)
- **Arquivo:** `src/components/SeoHead.tsx`
- **Uso:** Para pages que precisam injetar SEO dinamicamente em runtime
- **Benefício:** Permite Override de tags via JavaScript
- **Aplicação:** Opcional, em páginas específicas

```tsx
'use client';

import { SeoHead } from '@/components/SeoHead';

export default function MyPage() {
  return (
    <>
      <SeoHead
        canonical="https://byimperiodog.com.br/seo/especial"
        title="Página Especial | By Imperio Dog"
        description="Descrição customizada"
        ogImage="/custom-og.jpg"
      />
      <div>Conteúdo...</div>
    </>
  );
}
```

---

## 🔧 CONFIGURAÇÃO DO DOMÍNIO CANONICAL

### Prioridade de Resolução

```
1. NEXT_PUBLIC_CANONICAL_ORIGIN (novo - específico para canonical)
   ↓
2. NEXT_PUBLIC_SITE_URL (existente)
   ↓
3. Fallback padrão: https://www.byimperiodog.com.br
```

### Como Mudar o Domínio Principal

#### Option A: Via Variável de Ambiente (Recomendado)

**Vercel (Production):**
```bash
# Settings → Environment Variables
NEXT_PUBLIC_CANONICAL_ORIGIN=https://byimperiodog.com.br
```

**Local (.env.local):**
```bash
NEXT_PUBLIC_CANONICAL_ORIGIN=https://byimperiodog.com.br
NEXT_PUBLIC_SITE_URL=https://byimperiodog.com.br
```

**Netlify (netlify.toml):**
```toml
[build.environment]
  NEXT_PUBLIC_CANONICAL_ORIGIN = "https://byimperiodog.com.br"
  NEXT_PUBLIC_SITE_URL = "https://byimperiodog.com.br"
```

#### Option B: Código Direto

Editar `src/lib/seo.core.ts`:
```typescript
export const SITE_ORIGIN = 'https://byimperiodog.com.br'.replace(/\/$/, '');
```

---

## 📊 ONDE AS CANONICAL TAGS APARECEM

### 1️⃣ No Layout Global (Automático)

```tsx
// app/layout.tsx
export default async function RootLayout({ children }) {
  const pathname = resolvePathname();
  
  return (
    <html>
      <head>
        {/* ✅ Canonical renderizado aqui via SeoHeadServer */}
        <SeoHeadServer pathname={pathname} skipCanonical={isAdminRoute} />
        ...
      </head>
      <body>{children}</body>
    </html>
  );
}
```

**Resultado:** Toda página pública tem canonical automático.

### 2️⃣ Via Metadata de Página (Next.js App Router)

Cada página pode sobrescrever via `export const metadata`:

```tsx
// app/blog/[slug]/page.tsx
import { buildBlogPostMetadata } from '@/lib/seo.core';

export async function generateMetadata({ params }) {
  return buildBlogPostMetadata({
    slug: params.slug,
    title: 'Meu Artigo',
    description: 'Descrição...',
  });
  // Inclui: canonical, OpenGraph, Twitter Card
}

export default function BlogPage() {
  return <div>Conteúdo do artigo...</div>;
}
```

**Resultado:** Canonical específico para cada post.

### 3️⃣ Via Client Component (SeoHead)

Quando canonical precisa ser dinâmico em runtime:

```tsx
'use client';

import { SeoHead } from '@/components/SeoHead';
import { useEffect, useState } from 'react';

export default function DynamicPage() {
  const [finalUrl, setFinalUrl] = useState('');

  useEffect(() => {
    // Calcular URL canonicalbasedeem lógica complexa
    setFinalUrl(`https://byimperiodog.com.br/special/${computed}`);
  }, []);

  return (
    <>
      <SeoHead canonical={finalUrl} />
      <div>Conteúdo dinâmico...</div>
    </>
  );
}
```

---

## 🔗 ESTRUTURA DE TAGS SEO

### Canonical Tag em Cada Página

```html
<!-- Página pública: renderizada automaticamente -->
<link rel="canonical" href="https://byimperiodog.com.br/caminho" />

<!-- Página admin: OMITIDA (skipCanonical=true) -->
<!-- Não renderiza canonical em /admin/* -->

<!-- Página 404: usa canonical homepage -->
<link rel="canonical" href="https://byimperiodog.com.br/" />
```

### OpenGraph & Twitter Card

Gerados automaticamente via **metadata** de Next.js:

```html
<!-- auto-gerado em baseSiteMetadata() ou buildBlogPostMetadata() -->
<meta property="og:url" content="https://byimperiodog.com.br/..." />
<meta property="og:type" content="website|article" />
<meta property="og:title" content="..." />
<meta property="og:description" content="..." />
<meta property="og:image" content="..." />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="..." />
<meta name="twitter:description" content="..." />
<meta name="twitter:image" content="..." />
```

### hreflang - POR QUE FOI REMOVIDO

```html
<!-- ✅ NÃO INCLUÍDO porque: -->
<!-- 1. Não há i18n/multi-idioma implementado -->
<!-- 2. Páginas em outro idioma são bloqueadas (redirects) -->
<!-- 3. Incluir hreflang vazio prejudica SEO -->

<!-- SE IMPLEMENTAR I18N NO FUTURO, adicionar: -->
<link rel="alternate" hreflang="pt-BR" href="https://byimperiodog.com.br/" />
<link rel="alternate" hreflang="en" href="https://byimperiodog.com.br/en/" />
<link rel="alternate" hreflang="x-default" href="https://byimperiodog.com.br/" />
```

---

## 📝 EXEMPLOS DE USO

### Exemplo 1: Homepage

```tsx
// app/page.tsx
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  path: '/',
  title: 'Spitz Alemão Anão | By Imperio Dog',
  description: 'Filhotes legítimos com certificados...',
});

export default function Home() {
  return <div>Homepage...</div>;
}

// Renderizado:
// <link rel="canonical" href="https://byimperiodog.com.br/" />
```

### Exemplo 2: Página de Filhotes

```tsx
// app/filhotes/page.tsx
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  path: '/filhotes',
  title: 'Filhotes Disponíveis | By Imperio Dog',
  description: 'Confira todos os filhotes disponíveis',
  keywords: ['spitz', 'filhotes', 'comprar'],
});

export default function PuppiesPage() {
  return <div>Catálogo de filhotes...</div>;
}

// Renderizado:
// <link rel="canonical" href="https://byimperiodog.com.br/filhotes" />
```

### Exemplo 3: Blog Post Dinâmico

```tsx
// app/blog/[slug]/page.tsx
import { buildBlogPostMetadata } from '@/lib/seo.core';

export async function generateMetadata({ params }) {
  return buildBlogPostMetadata({
    slug: params.slug,
    title: 'Como Cuidar de um Spitz',
    description: 'Guia completo de cuidados...',
    image: '/blog-cover.jpg',
    published: '2026-02-01',
  });
}

export default function BlogPostPage({ params }) {
  return <article>Conteúdo do artigo...</article>;
}

// Renderizado:
// <link rel="canonical" href="https://byimperiodog.com.br/blog/como-cuidar-spitz" />
// <meta property="og:type" content="article" />
// <article:published_time>2026-02-01</article:published_time>
```

### Exemplo 4: Página Admin (SEM Canonical)

```tsx
// app/(admin)/admin/dashboard/page.tsx
import { adminNoIndexMetadata } from '@/lib/seo.core';

export const metadata = adminNoIndexMetadata;

export default function AdminDashboard() {
  return <div>Dashboard...</div>;
}

// Renderizado:
// <meta name="robots" content="noindex, nofollow" />
// /* SEM canonical tag - skipCanonical=true */
```

---

## 🧪 TESTE O CANONICAL

### 1️⃣ Verificar Localmente

```bash
npm run dev
```

Abrir DevTools (F12) > Elements:

```html
<!-- Verificar se existe no <head> -->
<link rel="canonical" href="https://byimperiodog.com.br/seu/caminho" />
```

### 2️⃣ Verificar em Produção

```bash
# Verificar canonical tag
curl -s https://byimperiodog.com.br/filhotes | grep canonical

# Esperado:
# <link rel="canonical" href="https://byimperiodog.com.br/filhotes" />
```

### 3️⃣ Verificar em Google Search Console

1. Acessar GSC
2. Ir para "Coverage"
3. Procurar por erros de canonical duplicado
4. Clicar em "Validation" para testar
5. Verificar "Core Web Vitals"

### 4️⃣ Usar Ferramentas SEO

- **Screaming Frog:** Verificar canonical duplicados
- **SEMrush:** Auditar SEO completo
- **Lighthouse:** `npm run lh:run`

---

## ⚙️ CONFIGURAÇÃO AVANÇADA

### Adicionar hreflang (Quando Implementar i18n)

Se no futuro adicionar suporte a múltiplos idiomas:

```typescript
// src/lib/seo.ts (novo)
export interface AlternateLanguage {
  hreflang: string; // 'pt-BR', 'en-US', 'x-default'
  href: string;
}

export function pageMetadataWithHrefLang(
  input: PageMetadataInput & { alternateLanguages?: AlternateLanguage[] }
): Metadata {
  return {
    ...pageMetadata(input),
    alternates: {
      canonical: buildCanonical(input.path ?? '/'),
      languages: input.alternateLanguages?.reduce(
        (acc, { hreflang, href }) => {
          acc[hreflang] = href;
          return acc;
        },
        {} as Record<string, string>
      ),
    },
  };
}
```

### Usar OG Tags Custom

```tsx
export const metadata = pageMetadata({
  path: '/meu-artigo',
  title: 'Artigo Especial',
  description: 'Descrição...',
  openGraph: {
    type: 'article',
    authors: ['João Silva'],
    publishedTime: '2026-02-01',
    modifiedTime: '2026-02-05',
    section: 'Cuidados',
    tags: ['spitz', 'adestramento'],
  },
  twitter: {
    creator: '@meuhandle',
  },
});
```

---

## 🚀 IMPLANTAÇÃO

### Production Checklist

- [ ] ✅ Definir `NEXT_PUBLIC_CANONICAL_ORIGIN` em Vercel/Netlify
- [ ] ✅ Fazer deploy da branch com componentes `SeoHead*`
- [ ] ✅ Verificar canonical tags em 5+ URLs diferentes
- [ ] ✅ Executar `npm run seo:audit` para validação
- [ ] ✅ Monitorar Google Search Console por 24h
- [ ] ✅ Verificar erros de "Duplicate without user-selected canonical"
- [ ] ✅ Validar com Lighthouse: `npm run lh:run`

### Monitorar Erros

**Google Search Console → Coverage:**
```
❌ Excluded → Duplicate (without user-selected canonical)
   Ação: Verificar se canonical está correto em seo.core.ts

❌ Excluded → Crawled as Google
   Normal, não é erro

✅ Valid with warnings
   OK se warnings forem sobre structured data
```

---

## 📞 TROUBLESHOOTING

### Problema: Canonical Tag Não Aparece

**Solução:**
1. Verificar se `skipCanonical={true}` (apenas em admin)
2. Rodar `npm run dev` e recarregar CTRL+SHIFT+R
3. Verificar valor de `pathname` em runtime

```tsx
// Debug no layout.tsx
console.log('🔗 Canonical pathname:', pathname);
console.log('🚫 Skip canonical?', isAdminRoute);
```

### Problema: Canonical Apontando para URL Errada

**Solução:**
1. Verificar `SITE_ORIGIN` em `seo.core.ts`
2. Confirmar var. env em Vercel/Netlify:
   ```bash
   echo $NEXT_PUBLIC_CANONICAL_ORIGIN
   ```
3. Limpar cache: `git clean -fd`

### Problema: Multiple Canonical Tags

**Solução:**
1. Verificar se não há duplicata no `layout.tsx`
2. Remover manual `<link rel="canonical"` se houver
3. Usar apenas via `metadata` ou `SeoHeadServer`

```tsx
// ❌ ERRADO: duas canonical tags
export const metadata = { alternates: { canonical: '...' } };
export default function Page() {
  return <link rel="canonical" href="..." />; // ❌
}

// ✅ CORRETO: apenas via metadata
export const metadata = { alternates: { canonical: '...' } };
export default function Page() {
  return <div>...</div>;
}
```

---

## 📚 REFERÊNCIAS

- [Next.js Metadata API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Google: Rel Canonical](https://developers.google.com/search/docs/beginner/rel-canonical)
- [Google: hreflang](https://developers.google.com/search/docs/advanced/crawling/localized-versions)
- [Schema.org: Structured Data](https://schema.org/)
- [Open Graph Protocol](https://ogp.me/)

---

## 📝 CHANGELOG

| Data | Alteração | Status |
|------|-----------|--------|
| 2026-02-05 | Criar componentes SeoHead e SeoHeadServer | ✅ |
| 2026-02-05 | Adicionar canonical automático em layout.tsx | ✅ |
| 2026-02-05 | Remover hreflang (não implementado) | ✅ |
| 2026-02-05 | Suportar NEXT_PUBLIC_CANONICAL_ORIGIN | ✅ |
| Future | Implementar i18n + hreflang | 🔄 |
| Future | Structured data avançado (FAQPage, JobPosting) | 🔄 |
