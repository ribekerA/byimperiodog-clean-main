# ⚡ Guia Rápido: Proteção de /admin com middleware.ts

## 📦 O que foi implementado

✅ **middleware.ts atualizado** com proteção de `/admin/*` usando cookie `admin_session`

---

## 🚀 Implementação Rápida (5 minutos)

### Passo 1: Verificar middleware.ts
```bash
cat middleware.ts | grep -A 5 "admin_session"
```
Deve mostrar a validação do cookie.

### Passo 2: Crear rota de login (ou verificar existente)
Arquivo: `app/api/admin/login/route.ts`

**Responsabilidade:** Após validar credenciais, definir o cookie `admin_session`

```typescript
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  // TODO: Validar contra DB/Supabase
  // TODO: Gerar sessionToken (JWT recommended)
  
  const response = NextResponse.json({ ok: true });
  
  // Definir cookie
  response.cookies.set("admin_session", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  });

  return response;
}
```

### Passo 3: Criar rota de logout (opcional)
Arquivo: `app/api/admin/logout/route.ts`

```typescript
import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("admin_session");
  return response;
}
```

### Passo 4: Testar
```bash
# Teste 1: Sem cookie (deve redirecionar)
curl http://localhost:3000/admin/dashboard
# Esperado: 302 Redirect → /admin/login

# Teste 2: Com cookie (deve passar)
curl -b "admin_session=test" http://localhost:3000/admin/dashboard
# Esperado: 200 OK
```

---

## 📋 Checklist

- [ ] `middleware.ts` está em `/workspaces/byimperiodog-clean/middleware.ts`
- [ ] Middleware tem proteção de `/admin/*` com `admin_session`
- [ ] Rota de login existe e define o cookie
- [ ] Cookie tem `httpOnly: true`
- [ ] Cookie tem `sameSite: "lax"`
- [ ] Testou sem cookie (redireciona)
- [ ] Testou com cookie (passa)
- [ ] Logout remove o cookie

---

## 🔗 Documentação Completa

Veja: [MIDDLEWARE_ADMIN_PROTECTION.md](MIDDLEWARE_ADMIN_PROTECTION.md)

---

## 💡 Variáveis de Ambiente (.env.local)

```bash
# Forçar www em produção
NEXT_PUBLIC_SITE_URL=https://www.byimperiodog.com

# Senha alternativa (header x-admin-pass)
ADMIN_PASS=sua_senha_aqui
```

---

## 🎯 Fluxo Visual

```
User acessa /admin/dashboard
         ↓
    [middleware.ts]
         ↓
    Tem admin_session? ─┬─ SIM → 200 OK (renderiza página)
                       │
                       └─ NÃO → 302 /admin/login
```

