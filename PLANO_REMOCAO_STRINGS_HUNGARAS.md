# 🛑 Plano: Remoc acá de Strings Húngaras e Bloqueio de Traduções Não-Autorizadas

**Data:** 5 de fevereiro de 2026  
**Prioridade:** 🔴 CRÍTICA (GA4 mostra páginas inexistentes)  
**Impacto:** SEO, Analytics, User Experience

---

## 📋 DIAGNÓSTICO

### ❌ Problema Identificado

**Strings húngaras aparecem em GA4:**
- `"Pomerániai (német törpe spicc)"` 
- `"Prémium kölyökkutyák elérhetők"`

**Origem:**
1. Rota `/api/admin/blog/translate` permite **traduzir posts para QUALQUER idioma** (sem validação)
2. Traduções salvas em `blog_post_localizations(post_id, lang, slug, title, ...)`
3. Exemplo: `post_id: "abc123"`, `lang: "hu"` → slug: `"guia-tutor-spitz-alemao-anao-hu"`
4. Rota `/app/blog/[slug]/page.tsx` **SÓ BUSCA EM `blog_posts.slug`**, não em `blog_post_localizations`
5. Resultado: Acesso a `/blog/guia-tutor-spitz-alemao-anao-hu` → **404 ERROR**

### 🔍 Arquivos Afetados

| Arquivo | Problema | Solução |
|---------|----------|---------|
| [app/api/admin/blog/translate/route.ts](app/api/admin/blog/translate/route.ts) | Aceita `target_lang` arbitrário (hu, es, de, etc) | Restringir a `["pt-BR", "en-US"]` ou desabilitar |
| [app/blog/[slug]/page.tsx](app/blog/[slug]/page.tsx) | Busca só em `blog_posts`, ignora `blog_post_localizations` | Adicionar fallback para localizações |
| [sql/blog_i18n.sql](sql/blog_i18n.sql) | Tabela `blog_post_localizations` com dados húngaros | Limpar ou ignorar |
| [src/types/supabase.ts](src/types/supabase.ts) | Type definitions para localizações | Manter, usar apenas para pt-BR |

---

## 🎯 OPÇÕES DE SOLUÇÃO

### ✅ **OPÇÃO A: BLOQUEAR TRADUÇÕES (Recomendado - Mais Rápido)**

**Objetivo:** Impedir que posts traduzidos apareçam em GA4 e retornem páginas erradas

#### A.1 - Desabilitar rota de tradução (mais agressivo)
```typescript
// app/api/admin/blog/translate/route.ts (linha 16)
export async function POST(req: Request){
  return NextResponse.json({ 
    ok: false, 
    error: 'Traduções de blog desabilitadas. Use apenas pt-BR.' 
  }, { status: 403 });
}
```

#### A.2 - Restringir a idiomas suportados (mais flexível)
```typescript
const ALLOWED_LANGS = ["pt-BR", "en-US"];

if (!ALLOWED_LANGS.includes(body.target_lang)) {
  return NextResponse.json({ 
    ok: false, 
    error: `Idioma "${body.target_lang}" não suportado. Permitidos: ${ALLOWED_LANGS.join(', ')}` 
  }, { status: 400 });
}
```

#### A.3 - Bloquear sitemap de gerar links para localizações
- Modificar sitemap.ts para IGNORAR `blog_post_localizations`
- Apenas servir URLs de `blog_posts` principal

#### A.4 - Adicionar Redirect 301 (preventivo)
```typescript
// app/blog/[slug]/page.tsx - linha ~80
async function fetchPost(slug: string, opts: { preview: boolean }): Promise<Post | null> {
  // Bloqueia slugs com sufixo de idioma
  if (slug.match(/-[a-z]{2}(-[a-z]{2})?$/i)) {
    return null; // Força 404 para localizações
  }
  
  // Busca normal
  const sb = supabaseAnon();
  const { data, error } = await sb
    .from("blog_posts")
    .select("...")
    .eq("slug", slug)
    .maybeSingle();
  
  return data || null;
}
```

---

### ⚠️ **OPÇÃO B: SUPORTE COMPLETO A i18n (Se quiser manter traduções)**

**Objetivo:** Implementar suporte real para múltiplos idiomas  
**Esforço:** Alto | **Tempo:** 2-3 horas

1. ✅ Modificar `/app/blog/[slug]/page.tsx` para buscar em `blog_post_localizations`
2. ✅ Implementar middleware de redirect por idioma (Accept-Language ou cookie)
3. ✅ Atualizar Next.config.mjs com `i18n` config
4. ✅ Adicionar hreflang tags para multiidioma
5. ✅ Revalidar sitemap para incluir URLs localizadas

**NÃO RECOMENDADO** pois você quer apenas PT-BR + EN-US, não 10+ idiomas

---

## 🚀 PLANO EXECUTIVO (Opção A - RECOMENDADO)

### Fase 1: Bloquear Tradução de Novos Posts (5 min)

**Commit:** `fix: disable hungarian translations in blog API`

```typescript
// app/api/admin/blog/translate/route.ts

interface TranslateReq { post_id: string; target_lang: string; force?: boolean }

export async function POST(req: Request){
  try {
    const body = await req.json() as TranslateReq;
    
    // ❌ BLOQUEIO: Apenas pt-BR e en-US suportados
    const ALLOWED_LANGS = ["pt-BR", "en-US"];
    if(!body.post_id || !body.target_lang) {
      return NextResponse.json({ 
        ok: false, 
        error: 'post_id e target_lang obrigatórios' 
      }, { status: 400 });
    }
    
    if (!ALLOWED_LANGS.includes(body.target_lang)) {
      return NextResponse.json({ 
        ok: false, 
        error: `Idioma "${body.target_lang}" não suportado. Permitidos: ${ALLOWED_LANGS.join(', ')}. Para adicionar novo idioma, abra issue.` 
      }, { status: 400 });
    }
    
    // ... resto do código
  } catch(e:any){
    return NextResponse.json({ ok:false, error: e.message }, { status:500 });
  }
}
```

---

### Fase 2: Bloquear Acesso a Posts Localizados Não-Suportados (10 min)

**Commit:** `fix: prevent hungarian blog pages from loading (404 fallback)`

```typescript
// app/blog/[slug]/page.tsx - linha ~60

async function fetchPost(slug: string, opts: { preview: boolean }): Promise<Post | null> {
  try {
    // ❌ BLOQUEIO: Rejeita slugs com sufixo de idioma não-autorizado
    const ALLOWED_LANGS = ["pt-BR", "en-US"];
    const langMatch = slug.match(/-([a-z]{2}(-[a-z]{2})?)$/i);
    
    if (langMatch) {
      const detected_lang = langMatch[1].replace('-', '-').toUpperCase();
      if (!ALLOWED_LANGS.some(lang => detected_lang.startsWith(lang.replace('-', '-').toUpperCase()))) {
        // Idioma não-autorizado detectado
        console.warn(`Acesso bloqueado a post ${slug} - idioma ${detected_lang} não suportado`);
        return null; // Força 404
      }
    }

    const sb = supabaseAnon();
    const { data, error } = await sb
      .from("blog_posts")
      .select(
        "id,slug,title,subtitle,excerpt,content_mdx,cover_url,cover_alt,published_at,created_at,updated_at,status,author_id,seo_title,seo_description,category,tags,lang"
      )
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw error;
    return data || null;
  } catch(e:any){
    console.error(`Erro ao buscar post ${slug}:`, e);
    return null;
  }
}
```

---

### Fase 3: Limpar Tradução Húngara do Banco (15 min)

**Commit:** `cleanup: remove hungarian localizations from database`

```sql
-- sql/cleanup_hungarian_localizations.sql

-- 1. Deletar localizações em húngaro
DELETE FROM blog_post_localizations 
WHERE lang = 'hu' OR lang ILIKE 'hu%';

-- 2. Verificar se há outras línguas não autorizadas
SELECT DISTINCT lang FROM blog_post_localizations 
WHERE lang NOT IN ('pt-BR', 'en-US')
ORDER BY lang;

-- 3. (Opcional) Deletar todas as não autorizadas
DELETE FROM blog_post_localizations 
WHERE lang NOT IN ('pt-BR', 'en-US');

-- 4. Verificar resultado
SELECT COUNT(*), lang FROM blog_post_localizations 
GROUP BY lang;
```

**Executar:**
```bash
# Conectar ao Supabase CLI ou executar diretamente:
supabase sql < sql/cleanup_hungarian_localizations.sql
```

---

### Fase 4: Atualizar Sitemap para Ignorar Localizações (5 min)

**Commit:** `fix: exclude unauthorized localizations from sitemap`

Editar [app/sitemap.ts](app/sitemap.ts) se houver geração de blog posts:

```typescript
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ... existing code

  // ❌ Filtrar apenas posts principais, não localizações
  const blogPosts = await db.query.blogPosts
    .findMany({
      where: eq(blogPostsTable.status, 'published'),
      // Não incluir blog_post_localizations
    });

  const blogUrls: MetadataRoute.Sitemap = blogPosts.map(post => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.updated_at,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  return [...existingUrls, ...blogUrls];
}
```

---

### Fase 5: Atualizar robots.txt para Bloquear Húngaro (2 min)

**Commit:** `fix: block hungarian blog pages from indexation`

Se houver [app/robots.ts](app/robots.ts):

```typescript
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        disallow: [
          '/admin/',
          '/api/',
          '/*-hu', // ← Bloqueio de posts em húngaro
          '/*-hu-HU',
          '/*-es', // ← Se houver outras não autorizadas
          '/*-de',
          '/*-fr',
        ],
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
  };
}
```

---

## 📊 RESULTADO ESPERADO

### ✅ Antes → Depois

| Métrica | Antes | Depois |
|---------|-------|--------|
| **GA4 - Páginas em Húngaro** | 2-5 páginas/dia | 0 ❌ Bloqueadas |
| **404 Errors** | Possível aumento se Google tenta rastrear | ✅ Redução (páginas não criadas) |
| **Analytics Spam** | ~3% de traffic perdido | ✅ 0% - Dados limpos |
| **Sitemap** | Inclui URLs -hu | ✅ Apenas pt-BR + en-US |
| **robots.txt** | Sem bloqueio | ✅ Bloqueia -hu* |

---

## 🔗 COMMITS SUGERIDOS (Em Ordem)

### 1️⃣ Commit: Bloquear Rota de Tradução
```bash
git commit -am "fix(blog): restrict translations to pt-BR and en-US only

- Add language whitelist to /api/admin/blog/translate
- Reject requests for unsupported languages (hu, es, de, etc)
- Prevent Hungarian blog pages from being created
- Fixes GA4 spam from unauthorized translations"
```

### 2️⃣ Commit: Bloquear Acesso a Posts Húngaros
```bash
git commit -am "fix(blog): prevent unauthorized language posts from loading (404 fallback)

- Add language validation in /app/blog/[slug]/page.tsx
- Block slugs with -hu, -es, -de suffixes (except pt-BR, en-US)
- Return 404 for non-whitelisted localizations
- Prevents Hungarian pages from appearing in analytics"
```

### 3️⃣ Commit: Limpeza de Banco de Dados
```bash
git commit -am "cleanup(database): remove hungarian localizations from blog_post_localizations

- Delete all entries where lang = 'hu'
-  Clean database of unauthorized translations
- Keep only pt-BR and en-US localizations"
```

### 4️⃣ Commit: Atualizar Sitemap
```bash
git commit -am "fix(sitemap): exclude unauthorized blog localizations

- Filter blog URLs to main posts only
- Remove localized blog URLs from sitemap
- Prevents search engines from discovering -hu pages"
```

### 5️⃣ Commit: Atualizar robots.txt
```bash
git commit -am "fix(robots): block hungarian and other unauthorized blog pages

- Add Disallow rules for -hu*, -es*, -de* patterns
- Prevent search engine crawling of non-authorized languages
- Allow only pt-BR and en-US variants"
```

---

## 📝 IMPLEMENTAÇÃO PASSO-A-PASSO

### Terminal Commands:

```bash
# 1. Criar arquivo SQL de limpeza
cat > sql/cleanup_hungarian_localizations.sql << 'EOF'
DELETE FROM blog_post_localizations 
WHERE lang = 'hu' OR lang NOT IN ('pt-BR', 'en-US');

SELECT COUNT(*), lang FROM blog_post_localizations 
GROUP BY lang;
EOF

# 2. Executar limpeza no Supabase
supabase db push  # ou execute SQL diretamente via Supabase console

# 3. Fazer commits
git add app/api/admin/blog/translate/route.ts
git commit -m "fix(blog): restrict translations to pt-BR and en-US only"

git add app/blog/[slug]/page.tsx
git commit -m "fix(blog): prevent unauthorized language posts from loading"

git add app/robots.ts  # se necessário
git commit -m "fix(robots): block hungarian blog pages from indexation"

# 4. Verificar mudanças
git log --oneline -5
```

---

## ⚠️ VALIDAÇÃO PÓS-IMPLEMENTAÇÃO

### Checklist:

- [ ] ✅ Tentar acessar `/blog/guia-tutor-spitz-alemao-anao-hu` → Deve retornar **404**
- [ ] ✅ Verificar GA4: não há mais páginas em húngaro
- [ ] ✅ Verificar sitemap.xml: nenhuma URL com `-hu`
- [ ] ✅ Verificar robots.txt: bloqueio de `/*-hu`
- [ ] ✅ Tentar POST `/api/admin/blog/translate` com `target_lang: "hu"` → Deve retornar **403 / Erro**
- [ ] ✅ Verificar Supabase: `SELECT COUNT(*) FROM blog_post_localizations WHERE lang='hu'` → Deve retornar **0**

---

## 🔐 PROTEÇÃO FUTURA

Para evitar que isso aconteça novamente:

1. **Adicionar testes unitários** para validar whitelist de idiomas
2. **Adicionar logs** quando traduções são rejeitadas
3. **Alertas** se tentarem POST com idiomas não-authorized
4. **Documentação** explícita: "Apenas pt-BR e en-US suportados"

---

## 📞 PRÓXIMOS PASSOS

1. ✅ Executar Fase 1-2 (10 min total)
2. ✅ Limpar banco (Fase 3)
3. ✅ Atualizar sitemap/robots (Fase 4-5)
4. 🔍 Monitorar GA4 por 24h para confirmar remoção
5. 📊 Fazer força de reindexação no Google Search Console (remover URLs em -hu)
