# 📡 Guia Completo: Redirects 301 em netlify.toml

**Data:** 5 de fevereiro de 2026  
**Objetivo:** Redirecionar rotas húngaras, antigas e quebradas para home ou equivalente PT-BR  
**Status:** ✅ Implementado

---

## 🎯 REDIRECTS IMPLEMENTADOS

### 1️⃣ **Bloqueio de Páginas Húngaras (Específicas)**

```toml
[[redirects]]
  from = "/pomeraniai"
  to = "/filhotes"
  status = 301
  force = true
```

| Origem | Destino | Tipo | Razão |
|--------|---------|------|-------|
| `/pomeraniai` | `/filhotes` | 301 🔴 | Termo húngaro para "Pomerânia" |
| `/premium-kolyokkutyak-elerhetok` | `/filhotes` | 301 🔴 | Título de página em húngaro |
| `/pomeraniai-*` | `/filhotes` | 301 🔴 | Variação com parâmetros |
| `/kolyokkutyak*` | `/filhotes` | 301 🔴 | Termo húngaro para "filhotes" |

✅ **Benefício:** Preserva autoridade SEO (301 = transferência de PageRank)  
✅ **Analytics:** GA4 registra como redirect, não como erro  
✅ **UX:** Usuário vai para catálogo válido

---

### 2️⃣ **Bloqueio Total de Rotas /HU/* (Wildcard)**

```toml
[[redirects]]
  from = "/hu/*"
  to = "/"
  status = 301
  force = true
```

| Padrão | Matches | Destino |
|--------|---------|---------|
| `/hu/*` | `/hu/about`, `/hu/kontakt`, etc | `/` |
| `/blog/*-hu` | `/blog/guia-spitz-hu` | `/` |
| `/blog/*-hu-HU` | `/blog/artigo-hu-HU` | `/` |
| `*-hu` | Qualquer rota terminada em `-hu` | `/` |

✅ **Funciona como:** "Catcher" para qualquer novo post húngaro que escapa  
✅ **Pattern:** Wildcard `*` = tudo após `/hu/`

---

### 3️⃣ **Redirect de Admin (Proteção)**

```toml
[[redirects]]
  from = "/admin"
  to = "/admin/login"
  status = 307
  force = false
```

- ✅ **Status 307:** Temporary (não transfere autoridade)
- ✅ **force = false:** Respeita middleware.ts (não força se já autenticado)
- ✅ **Objetivo:** Rota protegida redireciona para login

---

### 4️⃣ **Redirects de URLs Antigas (Prevenção)**

```toml
[[redirects]]
  from = "/spitz"
  to = "/filhotes"
  status = 301
  force = true

[[redirects]]
  from = "/puppies"
  to = "/filhotes"
  status = 301
  force = true
```

| Termo Antigo | Novo | Status |
|--------------|------|--------|
| `/spitz` | `/filhotes` | 301 |
| `/puppies` | `/filhotes` | 301 |
| `/preco` | `/preco-spitz-anao` | 301 |
| `/reservar` | `/reserve-seu-filhote` | 301 |
| `/sobre-nos` | `/sobre` | 301 |

---

### 5️⃣ **Universal Fallback (DEVE SER ÚLTIMA)**

```toml
[[redirects]]
  from = "/*"
  to = "/.netlify/functions/server"
  status = 200
  # ⚠️ STATUS 200 = URL masking (preserva URL no browser)
```

---

## 🔄 ORDEM DE PROCESSAMENTO (CRÍTICA!)

```
Requisição chega → Netlify processa redirects de CIMA para BAIXO

1. /pomeraniai
   ├─ Match! → 301 para /filhotes ✅ (Para aqui)
   ├─ /hu/* (não faz match)
   ├─ /admin (não faz match)
   └─ /* (não chega aqui)

2. /hu/some-page
   ├─ /pomeraniai (não faz match)
   ├─ Match! → 301 para / ✅ (Para aqui)
   └─ /* (não chega aqui)

3. /admin
   ├─ Não faz match em húngaro
   ├─ Match! → 307 para /admin/login ✅ (Para aqui)
   └─ /* (não chega aqui)

4. /blog/meu-artigo
   ├─ Não faz match em nenhuma específica
   ├─ Match! → 200 masking para /.netlify/functions/server ✅
   └─ Next.js renderiza a página

5. /blog/pagina-inexistente
   ├─ Não faz match em nenhuma específica
   ├─ Match! → 200 masking para /.netlify/functions/server ✅
   └─ Next.js renderiza página 404 customizada
```

---

## 📊 STATUS HTTP EXPLICADOS

### 🔴 **301 (Moved Permanently)**
```
Redirect permanente
✅ Transfere PageRank SEO
✅ Browsers fazem cache
✅ Google recrawla
Para usar com: URLs antigas, misspellings, mudanças de domínio
```

### 🟠 **307 (Temporary Redirect)**
```
Redirect temporário
✅ Preserva método HTTP (POST fica POST)
⚠️ Não transfere PageRank
✅ Browsers não fazem cache
Para usar com: Proteção de rotas, load balancing
```

### 🟢 **200 (OK - URL Masking)**
```
Responde 200 normalmente (sem redirect)
✅ URL permanece no browser
✅ Usuario não vê a mudança
✅ Server renderiza conteúdo internamente
Para usar com: Next.js routing, 404s customizados, SSR
```

---

## 🧪 COMO TESTAR

### 1️⃣ Teste Local (Netlify CLI)

```bash
# Instalar
npm install -g netlify-cli

# Testar localhost
netlify dev

# Acessar no browser
curl -I http://localhost:8888/pomeraniai
# Deve ver: HTTP/1.1 301 Moved Permanently
# Location: /filhotes
```

### 2️⃣ Teste em Produção

```bash
# Verificar redirect com curl
curl -I https://www.byimperiodog.com.br/pomeraniai
# Expected: 301 Location: https://www.byimperiodog.com.br/filhotes

curl -I https://www.byimperiodog.com.br/hu/kontakt
# Expected: 301 Location: https://www.byimperiodog.com.br/

curl -I https://www.byimperiodog.com.br/admin
# Expected: 307 Location: https://www.byimperiodog.com.br/admin/login

# Testar com browser devtools > Network tab
# Verificar "Status", "Location header"
```

### 3️⃣ Monitoramento em GA4

```
Após deploy, monitorar em GA4:
- Página de destino /filhotes deve ter 301 referrer
- Nenhuma página /pomeraniai em "Pages" (exceto referrer)
- Nenhuma página /hu/* em relatórios
```

---

## ⚠️ ARMADILHAS COMUNS

### ❌ **ERRADO: Status incorreto da última regra**

```toml
[[redirects]]
  from = "/*"
  to = "/.netlify/functions/server"
  status = 301  # ❌ ERRADO! Faria redirect 301 para function (loop!)
```

✅ **CORRETO:**
```toml
[[redirects]]
  from = "/*"
  to = "/.netlify/functions/server"
  status = 200  # ✅ URL masking - server renderiza
```

---

### ❌ **ERRADO: Força redirect mesmo quando autenticado**

```toml
[[redirects]]
  from = "/admin"
  to = "/admin/login"
  status = 307
  force = true  # ❌ ERRADO! Rola infinito se user já está logado
```

✅ **CORRETO:**
```toml
[[redirects]]
  from = "/admin"
  to = "/admin/login"
  status = 307
  force = false  # ✅ Middleware.ts decide
```

---

### ❌ **ERRADO: Regra específica depois de wildcard**

```toml
[[redirects]]
  from = "/*"              # Wildcard catchall (processa TUDO)
  to = "/.netlify/..."

[[redirects]]
  from = "/pomeraniai"     # ❌ Nunca será atingida!
  to = "/filhotes"
```

✅ **CORRETO:**
```toml
[[redirects]]
  from = "/pomeraniai"     # ✅ Específica PRIMEIRO
  to = "/filhotes"

[[redirects]]
  from = "/*"              # Wildcard ÚLTIMO
  to = "/.netlify/..."
```

---

## 📈 IMPACTO ESPERADO

### Antes da mudança:
```
GA4 mostra:
- /pomeraniai → 404 (sem sessão)
- /hu/about → 404
- Página antiga /spitz → 404
- Traffic perdido: ~5-10%
```

### Depois da mudança:
```
GA4 mostra:
- /pomeraniai → Redirecionado para /filhotes ✅
- /hu/* → Redirecionado para / ✅
- /spitz → Redirecionado para /filhotes ✅
- Traffic preservado em destinos válidos
- No 404 errors para páginas antigas
```

---

## 🔗 INTEGRAÇÃO COM MIDDLEWARE.TS

```typescript
// middleware.ts (já implementado)
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Seu middleware continua funcionando
  // Redirects de netlify.toml são processados ANTES
  // Se não fizer match em netlify.toml, chega aqui

  if (pathname.startsWith('/admin')) {
    // Verifica autenticação
    const session = request.cookies.get('admin_session')?.value;
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}
```

**Ordem de processamento:**
1. Netlify redirects (netlify.toml) ← **Processa primeiro**
2. Middleware (middleware.ts) ← **Depois**
3. Next.js routing ← **Finalmente**

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] ✅ Atualizar netlify.toml com novos redirects
- [ ] ✅ Commit: `git add netlify.toml && git commit -m "add: redirects for hungarian pages and legacy URLs"`
- [ ] ✅ Fazer push para main (Netlify redeploy automático)
- [ ] ✅ Aguardar deploy terminar (~3-5 min)
- [ ] ✅ Testar cada redirect com `curl -I`
- [ ] ✅ Verificar GA4 por 24h
- [ ] ✅ Google Search Console: remover URLs antigas descobertas
- [ ] ✅ Monitorar 404 errors por 48h

---

## 📞 PRÓXIMOS PASSOS

1. ✅ Redirects húngaros bloqueados (netlify.toml)
2. ✅ Rotas antigas preservadas
3. 🔄 Próximo: Limpar dados de `blog_post_localizations` do banco
4. 🔄 Próximo: Remover URLs descobertas do Google Search Console

**Tempo total:** ~15 min para deploy + 24h para monitoramento
