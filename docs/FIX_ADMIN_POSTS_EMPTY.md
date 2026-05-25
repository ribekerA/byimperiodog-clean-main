# Fix: Lista de Posts Vazia no Admin

## 🐛 Problema Identificado

A página `/admin/blog` mostrava "0 posts ao todo" mesmo com posts existentes no banco de dados.

![image](https://github.com/user-attachments/assets/...)

## 🔍 Diagnóstico

### Sintomas
- ✅ Posts existem no banco (confirmado via script de teste)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` está no `.env.local`
- ✅ Queries diretas ao Supabase funcionam
- ❌ `blogRepo.listSummaries()` retorna array vazio no Next.js

### Causa Raiz

**Next.js não estava carregando o arquivo `.env.local` corretamente no runtime do servidor.**

Quando `process.env.SUPABASE_SERVICE_ROLE_KEY` está `undefined`, a função `supabaseAdmin()` retorna um **stub** que sempre retorna `{ data: [], error: null }`:

```typescript
// src/lib/supabaseAdmin.ts (linhas 38-48)
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY; // ❌ undefined

  if (!url || !key) {
    console.warn("[supabaseAdmin] Credenciais ausentes; retornando stub");
    return { 
      from: (_: string) => makeStubBuilder({ data: [], error: null }) // ⚠️ Sempre retorna []
    } as any;
  }
  // ...
}
```

## ✅ Solução Implementada

### 1. Script PowerShell com Carregamento Explícito

Criado `scripts/run-dev-with-env.ps1` que:
- Lê `.env.local` manualmente
- Seta cada variável via `[Environment]::SetEnvironmentVariable()`
- Inicia `npm run dev` com variáveis carregadas

**Uso:**
```powershell
.\scripts\run-dev-with-env.ps1
```

### 2. Validação com Endpoint de Debug

Criado `app/api/debug/blog-posts/route.ts` para verificar:
- Se `SUPABASE_SERVICE_ROLE_KEY` está disponível
- Quantos posts `blogRepo.listSummaries()` retorna
- Dados do primeiro post

**Teste:**
```bash
curl http://localhost:3000/api/debug/blog-posts
```

**Resposta esperada:**
```json
{
  "success": true,
  "hasServiceKey": true,
  "hasUrl": true,
  "itemsCount": 2,
  "total": 2,
  "firstItem": {
    "id": "...",
    "slug": "saude-preventiva-do-spitz-alemao...",
    "title": "Saúde Preventiva do Spitz Alemão..."
  }
}
```

### 3. Scripts de Diagnóstico

**`scripts/test-admin-access.mjs`** - Testa conexão admin:
```bash
node scripts/test-admin-access.mjs
```

**`scripts/test-blog-query.mjs`** - Testa query pública:
```bash
node scripts/test-blog-query.mjs
```

## 🎯 Resultados

### Antes
- ❌ Admin mostrando "0 posts ao todo"
- ❌ `blogRepo.listSummaries()` → `[]`
- ❌ `supabaseAdmin()` retornando stub

### Depois
- ✅ Admin mostrando "2 posts"  
- ✅ `blogRepo.listSummaries()` → `[post1, post2]`
- ✅ `supabaseAdmin()` com client real

## 📝 Lições Aprendidas

### Por que Next.js não carregou `.env.local`?

Possíveis causas (em investigação):
1. **Encoding do arquivo** - `.env.local` pode ter BOM ou encoding errado
2. **Cache do Next.js** - Variáveis podem ter sido cacheadas antes do arquivo existir
3. **Ordem de carregamento** - Algumas variáveis podem não estar disponíveis em tempo de build
4. **Windows vs Unix** - Line endings (CRLF vs LF) podem causar problemas

### Solução Robusta

O script `run-dev-with-env.ps1` garante que:
- ✅ Variáveis são sempre carregadas
- ✅ Funciona independente de cache
- ✅ Feedback visual de quais variáveis foram carregadas
- ✅ Mascaramento de secrets (mostra apenas primeiros 20 chars)

## 🔧 Comandos Úteis

### Verificar variáveis carregadas
```powershell
Get-Content .env.local | Select-String "SUPABASE"
```

### Testar conexão admin
```powershell
node scripts/test-admin-access.mjs
```

### Limpar cache Next.js
```powershell
Remove-Item -Recurse -Force .next
```

### Iniciar dev com variáveis explícitas
```powershell
.\scripts\run-dev-with-env.ps1
```

## 📊 Validação

- ✅ Posts carregando corretamente em `/admin/blog`
- ✅ `blogRepo.listSummaries()` retornando 2 posts
- ✅ Debug endpoint confirmando variáveis carregadas
- ✅ Scripts de teste funcionando

---

**Status:** ✅ **RESOLVIDO**

**Data:** 2025-10-27  
**Versão:** 1.0.0
