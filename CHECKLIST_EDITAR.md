# ✅ CHECKLIST DE ARQUIVOS PARA EDITAR

## 🎯 RESUMO EXECUTIVO

Seu projeto **NÃO tem i18n configurado**, mas tem uma rota `/api/admin/blog/translate` que pode gerar páginas traduzidas para qualquer idioma (ex: húngaro). Se isso tiver sido usado, há risco de 404s. Além disso, ícones PWA estão faltando causando 404s confirmados.

---

## 📌 ROTAS IDENTIFICADAS

### Admin
```
✅ /admin/login                  → app/(admin)/admin/(auth)/login/page.tsx
✅ /admin/dashboard              → app/(admin)/admin/(protected)/dashboard/page.tsx  
✅ /admin/filhotes              → app/(admin)/admin/(protected)/puppies/
✅ Outras: blog, settings, leads, etc.
```

### Blog e Filhotes
```
✅ /blog/[slug]                 → app/blog/[slug]/page.tsx (busca em blog_posts, NÃO localizations)
✅ /filhotes/[slug]             → app/filhotes/[slug]/page.tsx
✅ /filhotes/[estado]/          → app/filhotes/sao-paulo/, minas-gerais/, etc.
```

---

## 🚨 PROBLEMAS ENCONTRADOS

### 1️⃣ **TRANSLATE ROUTE PODE GERAR 404s** ⚠️
```
POST /api/admin/blog/translate
Body: { post_id, target_lang: "hu", ... }
→ Cria entrada em blog_post_localizations
→ Slug gerado: "guia-tutor-spitz-alemao-anao-hu"
→ Mas /blog/guia-tutor-spitz-alemao-anao-hu = 404 ❌
```
**Por quê?** `app/blog/[slug]/page.tsx` só busca em `blog_posts`, não em `blog_post_localizations`

### 2️⃣ **ÍCONES PWA 404** ✋
```
manifest.ts referencia:
  → /icons/icon-192.png  (NÃO EXISTE)
  → /icons/icon-512.png  (NÃO EXISTE)
```

### 3️⃣ **i18n**: ✅ Não há configuração (correto)
- next.config.mjs: Sem `i18n: { locales, defaultLocale }`
- middleware.ts: Sem processamento de locale
- Config: Apenas português (correto)

---

## 📋 ARQUIVOS EXATOS PARA EDITAR (Prioridade)

### 🔴 PRIORIDADE 1: Corrigir Tradução Blog

**Arquivo:** `app/api/admin/blog/translate/route.ts`
```
📍 Localização: /workspaces/byimperiodog-clean/app/api/admin/blog/translate/route.ts
⚡ Ação: DESABILITAR ou VALIDAR idiomas suportados
```

**OPÇÃO A - Desabilitar (Recomendado):**
```typescript
// Linha 14 (após body parsing)
if (!["pt", "pt-BR"].includes(lang)) {
  return NextResponse.json({ 
    ok: false, 
    error: `Idioma '${lang}' não suportado. Use 'pt' ou 'pt-BR'.` 
  }, { status: 400 });
}
```

**OPÇÃO B - Implementar Suporte:**
Requer também editar `app/blog/[slug]/page.tsx` para buscar em `blog_post_localizations`

---

### 🔴 PRIORIDADE 2: Corrigir Ícones PWA

**Arquivo:** `app/manifest.ts`
```
📍 Localização: /workspaces/byimperiodog-clean/app/manifest.ts
⚡ Ação: REMOVER referências aos ícones que não existem
```

Remover ou comentar:
```typescript
// Linha ~XX
icons: [
  // { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
  // { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }
]
```

---

### 🟡 PRIORIDADE 3: Validar Admin Routes

**Arquivo:** `middleware.ts`
```
📍 Localização: /workspaces/byimperiodog-clean/middleware.ts
✅ Status: JÁ CORRETO
⚠️ Ação: Apenas REVISAR lógica de auth
```

Verificar:
- ✅ Linhas 12-30: Redireciona `/admin/*` para `/admin/login` se não autenticado
- ✅ Linhas 32-36: Redireciona `/admin/login` para `/admin/dashboard` se autenticado
- ✅ Linhas 38-45: Remove X-Robots-Tag para admin routes

---

### 🟡 PRIORIDADE 4: Validar Configuração Next.js

**Arquivo:** `next.config.mjs`
```
📍 Localização: /workspaces/byimperiodog-clean/next.config.mjs
✅ Status: JÁ CORRETO (SEM i18n)
⚠️ Ação: Apenas CONFIRMAR
```

Verificar:
- ✅ Sem `i18n: { locales, defaultLocale }`
- ✅ Sem middleware de locale
- ✅ Headers e redirects para cache/segurança OK

---

### 🟢 PRIORIDADE 5: Blog Dinâmica (SE MANTER TRADUÇÃO)

**Arquivo:** `app/blog/[slug]/page.tsx`
```
📍 Localização: /workspaces/byimperiodog-clean/app/blog/[slug]/page.tsx
❌ Status: REQUER EDIÇÃO se tradução for mantida
⚡ Ação: Adicionar suporte a blog_post_localizations
```

Se decidir MANTER traduções, modificar `fetchPuppyBySlug()`:
```typescript
async function fetchPost(slug: string, opts: { preview: boolean }): Promise<Post | null> {
  try {
    const sb = supabaseAnon();
    
    // Tentar blog_posts primeiro
    const { data, error } = await sb
      .from("blog_posts")
      .select("id,slug,title,...")
      .eq("slug", slug)
      .maybeSingle();
    
    if (data) return data;
    
    // Se não encontrou, tenta blog_post_localizations
    const { data: locData } = await sb
      .from("blog_post_localizations")
      .select("id,post_id,slug,title,...")
      .eq("slug", slug)
      .maybeSingle();
    
    if (locData) return { ...locData, id: locData.post_id };
    
    return null;
  } catch { return null; }
}
```

---

## 🎯 RESUMO FINAL

| Arquivo | Status | Ação |
|---------|--------|------|
| `app/api/admin/blog/translate/route.ts` | 🔴 Crítico | Desabilitar ou validar `target_lang` |
| `app/manifest.ts` | 🔴 Crítico | Remover ícones que não existem |
| `middleware.ts` | 🟢 OK | Apenas revisar |
| `next.config.mjs` | 🟢 OK | Sem i18n (correto) |
| `app/blog/[slug]/page.tsx` | 🟡 Condicional | Só se manter tradução |
| `netlify.toml` | 🟢 OK | Sem mudanças |

---

## 🔗 ROTAS E SEUS ESTADOS

### ✅ Funcionando
```
GET /admin/login                 → 200 (público)
GET /admin/dashboard             → 302 (sem auth) → /admin/login
GET /admin/filhotes              → 302 (sem auth) → /admin/login
GET /blog/guia-tutor-spitz       → 200 (exists em blog_posts)
GET /filhotes/fixo-teste-azul    → 200 (puppies index)
```

### ❌ 404 Confirmados
```
GET /icons/icon-192.png          → 404 (arquivo não existe)
GET /icons/icon-512.png          → 404 (arquivo não existe)
GET /blog/guia-tutor-spitz-hu    → 404 (IF tradução foi criada - não está em blog_posts)
```

### ⚠️ Hipotético (se alguém usar translate route com "hu")
```
POST /api/admin/blog/translate with lang="hu"
→ Cria: blog_post_localizations { slug: "...-hu", lang: "hu", ... }
→ Mas GET /blog/...-hu AINDA É 404 (porque [slug] não busca em localizations)
```

---

## 📞 PRÓXIMOS PASSOS

1. **Imediato:** Editar `app/api/admin/blog/translate/route.ts` → Desabilitar línguas não-PT
2. **Imediato:** Editar `app/manifest.ts` → Remover ícones que não existem  
3. **Revisão:** Validar `middleware.ts` está correto
4. **Confirmação:** Confirmar que `/admin/*` rotas funcionam como esperado
5. **Opcional:** Se tradução for necessária, implementar suporte em `app/blog/[slug]/page.tsx`

