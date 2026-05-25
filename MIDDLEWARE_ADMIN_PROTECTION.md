# 🔒 Proteção de Rotas /admin com Middleware

## 📋 Visão Geral

O `middleware.ts` implementa proteção de todas as rotas que começam com `/admin` usando um cookie de sessão chamado `admin_session`.

---

## 🎯 Regras Implementadas

### 1. Proteção de `/admin/*`
```typescript
// Se rota começa com /admin e NÃO é /admin/login
// E NÃO tem cookie "admin_session" válido
// → Redireciona automaticamente para /admin/login
```

### 2. Cookie `admin_session`
- **Nome:** `admin_session`
- **Tipo:** Session cookie (HTTP-only recomendado)
- **Validação:** Apenas verifica se existe (não está vazio)
- **Duração:** Configurável (recomendado 7 dias)

### 3. Rotas Permitidas sem Cookie
- `GET /admin/login` — Página de login (acesso livre)
- `POST /api/admin/login` — Endpoint de login (acesso livre)

### 4. Proteção de `/api/admin/*`
- Requer `admin_session` OU header `x-admin-pass`
- Retorna `401 Unauthorized` se não autenticado

### 5. SEO para `/admin`
- Adiciona `X-Robots-Tag: noindex, nofollow` automaticamente
- Impede indexação pelo Google/Bing

---

## 🔧 Matcher (onde middleware é executado)

### Configuração Atual
```typescript
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|assets/|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map)).*)",
  ],
};
```

### O que o Matcher Faz
Captura **TODAS as rotas EXCETO**:
| Padrão | O que exclui |
|--------|-------------|
| `_next/static` | Chunk estático do Next.js |
| `_next/image` | Imagens otimizadas |
| `favicon.ico` | Favicon |
| `robots.txt` | Arquivo de robots |
| `sitemap.xml` | Sitemap |
| `assets/` | Pasta de assets |
| `.*\\.(?:png\|jpg\|...)` | Arquivos de imagem/audio |

### Resultado
✅ **O middleware SERÁ executado para:**
```
✅ /admin/login          → Processa (redireción se já com sessão)
✅ /admin/dashboard      → Processa (valida sessão)
✅ /admin/filhotes       → Processa (valida sessão)
✅ /api/admin/login      → Processa (sem validação)
✅ /api/admin/users      → Processa (valida sessão)
✅ /blog                 → Processa (passa direto)
✅ /filhotes             → Processa (passa direto)
```

❌ **O middleware NÃO será executado para:**
```
❌ /_next/static/...     → Assets estáticos
❌ /public/image.png     → Imagens
❌ /favicon.ico          → Favicon
❌ /robots.txt           → Robots
```

---

## 📍 Fluxo de Autenticação

### Sem Sessão
```
User → GET /admin/dashboard
         ↓
    [middleware.ts verifica]
    Não tem "admin_session"? ✗
         ↓
    302 Redirect → /admin/login
```

### Com Sessão Válida
```
User → GET /admin/dashboard (com Cookie: admin_session=abc123)
         ↓
    [middleware.ts verifica]
    Tem "admin_session"? ✓
         ↓
    200 OK → renderiza página
```

### Na Página de Login
```
User → GET /admin/login (sem cookie)
         ↓
    [middleware.ts]
    É /admin/login sem sessão? ✓
         ↓
    200 OK → renderiza formulário
```

### Login Com Sucesso
```
User enviar credenciais → POST /api/admin/login
                           ↓
              [Valida credenciais]
              ✓ Corretas
                           ↓
         Response com: Set-Cookie: admin_session=...
                           ↓
User → GET /admin/dashboard (com novo cookie)
         ↓
    [middleware.ts]
    Tem "admin_session"? ✓
         ↓
    200 OK → renderiza dashboard
```

---

## 🔐 Como Definir o Cookie de Login

Na sua rota de login (`app/api/admin/login/route.ts`), após validar credenciais:

```typescript
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // Validar credenciais contra banco de dados
    const user = await validateCredentials(email, password);
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    // Gerar token de sessão (recomendado usar JWT ou similar)
    const sessionToken = await generateSessionToken(user.id);

    // Criar response
    const response = NextResponse.json(
      { ok: true, redirectTo: "/admin/dashboard" },
      { status: 200 }
    );

    // Definir cookie com proteções
    response.cookies.set("admin_session", sessionToken, {
      httpOnly: true,              // Não acessível via JavaScript
      secure: process.env.NODE_ENV === "production", // HTTPS apenas em produção
      sameSite: "lax",             // Proteção contra CSRF
      path: "/",                   // Cookie em todo site
      maxAge: 60 * 60 * 24 * 7,    // 7 dias
    });

    return response;
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "Erro no servidor" },
      { status: 500 }
    );
  }
}
```

---

## 🚪 Como Fazer Logout

Crie uma rota de logout que limpa o cookie:

```typescript
// app/api/admin/logout/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json(
    { ok: true, message: "Deslogado com sucesso" },
    { status: 200 }
  );

  // Limpar cookie
  response.cookies.delete("admin_session");

  return response;
}
```

Na página/componente:
```typescript
async function handleLogout() {
  await fetch("/api/admin/logout", { method: "POST" });
  router.push("/admin/login");
}
```

---

## 🧪 Testando a Proteção

### Teste 1: Sem Cookie
```bash
curl http://localhost:3000/admin/dashboard
# Resultado: 302 Redirect → /admin/login
```

### Teste 2: Com Cookie Inválido
```bash
curl -b "admin_session=invalid" http://localhost:3000/admin/dashboard
# Resultado: 302 Redirect → /admin/login (cookie vazio não é válido)
```

### Teste 3: Com Cookie Válido
```bash
curl -b "admin_session=abc123xyz" http://localhost:3000/admin/dashboard
# Resultado: 200 OK (renderiza dashboard se sessão for válida)
```

### Teste 4: Página de Login
```bash
curl http://localhost:3000/admin/login
# Resultado: 200 OK (acesso permitido)
```

### Teste 5: API Admin Protegida
```bash
curl -X POST http://localhost:3000/api/admin/users
# Resultado: 401 Unauthorized (sem cookie/header)

curl -b "admin_session=abc123" -X POST http://localhost:3000/api/admin/users
# Resultado: 200 OK (com cookie válido)
```

---

## 📊 Fluxograma

```
Requisição HTTP
    ↓
[middleware.ts executa]
    ↓
├─ É assets estático? → Passa direto (200)
│
├─ É /admin* ?
│  ├─ É /admin/login?
│  │  ├─ Tem sessionário? → Redireciona /admin/dashboard
│  │  └─ Sem sessão? → 200 OK (renderiza login)
│  │
│  └─ Não é /admin/login?
│     ├─ Tem session? → Passa direto (200)
│     └─ Sem session? → 302 Redirect /admin/login
│
├─ É /api/admin/*?
│  ├─ Tem session OU x-admin-pass? → Passa direto
│  └─ Sem auth? → 401 Unauthorized
│
├─ Add X-Robots-Tag (noindex) se /admin
│
└─ Passar para next handler
```

---

## 🔍 Variáveis de Ambiente

Configure em `.env.local`:

```bash
# URL do site (para force www)
NEXT_PUBLIC_SITE_URL=https://www.byimperiodog.com

# Senha para header x-admin-pass (opcional, para APIs)
ADMIN_PASS=sua_senha_super_secreta_aqui

# NODE_ENV detectado automaticamente (development/production)
NODE_ENV=development
```

---

## ⚠️ Problemas Comuns

### Problema: Redirectloop entre /admin/login e /admin/dashboard
**Causa:** Cookie sendo definido errado ou não sendo lido.
**Solução:** Verifique:
1. Cookie está sendo definido com `httpOnly: true`?
2. Nome do cookie é exatamente `admin_session`?
3. Path é `/`?

### Problema: Middleware não está sendo executado
**Causa:** Rota não está no matcher.
**Solução:** Verifique se a rota não está na lista de exclusão do matcher.

### Problema: 401 em /api/admin/* mesmo com cookie
**Causa:** Middleware valida session mas API endpoint também pode validar.
**Solução:** Você pode pular validação no endpoint se já passou no middleware, OU adicionar camada de validação duplicada.

---

## ✅ Checklist de Implementação

- [ ] `middleware.ts` atualizado com proteção de /admin
- [ ] Rota `/api/admin/login` define cookie `admin_session`
- [ ] Rota `/api/admin/logout` limpa o cookie
- [ ] Cookie tem `httpOnly: true` em produção
- [ ] Cookie tem `sameSite: "lax"` para proteção CSRF
- [ ] Matcher está configurado (já está por padrão)
- [ ] Testou fluxo sem cookie (redireciona)
- [ ] Testou fluxo com cookie (passa)
- [ ] Testou logout (remove cookie)
- [ ] Testou API com header x-admin-pass (opção alternativa)

