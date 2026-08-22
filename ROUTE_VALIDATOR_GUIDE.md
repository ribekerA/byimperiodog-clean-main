# 🔍 Route Validator - Guia Completo

**Data:** 5 de fevereiro de 2026  
**Status:** ✅ Implementado  
**Script:** `scripts/route-validator.ts`  
**Relatório:** `reports/route-validation.json`

---

## 📌 O QUE FAZ

Script Node que valida todas as rotas públicas do site:

### 1️⃣ **Varre Estrutura de Pastas**
- Lê `app/` recursivamente
- Encontra arquivos `page.tsx` (rotas públicas)
- Identifica rotas dinâmicas (`[slug]`, etc)

### 2️⃣ **Faz Fetch em Rotas Críticas**
- Testa 15+ rotas públicas principais
- Testa 3+ rotas admin (verificando proteção)
- Coleta: status HTTP, `<title>`, tempo de resposta

### 3️⃣ **Verifica**
- ❌ Rotas com 404
- ❌ Títulos faltando ou inválidos
- ❌ Rotas `/admin` acessíveis sem autenticação
- 🌐 Títulos em idiomas não-português (PT-BR detection)
- ⏱️ Rotas com resposta lenta (>2s)

### 4️⃣ **Gera Relatório**
- Arquivo JSON: `reports/route-validation.json`
- Resumo no terminal com cores e emojis
- Exit code apropriado para CI/CD

---

## 🚀 COMO USAR

### Pré-requisitos

- Node.js 18+ (com `fetch` nativo)
- Servidor Next.js rodando em `http://localhost:3000`
- `tsx` instalado (já no projeto)

### Instalação

Nada! Script já está criado em `scripts/route-validator.ts`

### Executar

#### **Local (http://localhost:3000)**

```bash
# npm
npm run route:validate

# pnpm
pnpm route:validate

# yarn
yarn route:validate
```

#### **Produção (https://byimperiodog.com.br)**

```bash
npm run route:validate:prod
```

#### **Outro ambiente (staging, preview do Netlify)**

Não existe host de staging fixo. Aponte o validador para a URL que quiser:

```bash
npx cross-env ROUTE_VALIDATOR_URL=https://<preview>.netlify.app npm run route:validate
```

#### **Custom URL**

```bash
ROUTE_VALIDATOR_URL=https://seu-dominio.com tsx scripts/route-validator.ts
```

---

## 📊 EXEMPLO DE OUTPUT

### No Terminal

```
╔════════════════════════════════════════════════════════════════════════════╗
║                      🔍 Route Validator - Iniciando                         ║
╚════════════════════════════════════════════════════════════════════════════╝

📍 Base URL: http://localhost:3000
📂 Testando 15 rotas públicas
🔐 Testando 3 rotas admin

Aguarde enquanto fazemos o fetch das rotas...

📄 Testando rotas públicas...
  ├─ /                             ✅ 200 - Spitz Alemão Anão | By Imperio Dog
  ├─ /filhotes                     ✅ 200 - Filhotes Disponíveis - Spitz Alemão
  ├─ /blog                         ✅ 200 - Blog | By Imperio Dog
  ├─ /sobre                        ✅ 200 - Sobre | By Imperio Dog
  ├─ /contato                      ✅ 200 - Contato | By Imperio Dog
  ├─ /comprar-spitz-anao          ✅ 200 - Comprar Spitz Alemão
  ├─ /reserve-seu-filhote         ✅ 200 - Reserve Seu Filhote
  ├─ /preco-spitz-anao            ✅ 200 - Preço Spitz Alemão
  ├─ /politica-de-privacidade     ✅ 200 - Política de Privacidade
  ├─ /politica-editorial          ✅ 200 - Política Editorial
  ├─ /termos-de-uso               ✅ 200 - Termos de Uso
  ├─ /faq-do-tutor                ✅ 200 - FAQ do Tutor
  ├─ /criador-spitz-confiavel     ✅ 200 - Criador Spitz Confiável

🔐 Testando rotas admin...
  ├─ /admin                        ✅ 307 - Redirect (auth required)
  ├─ /admin/login                  ✅ 200 - Login Page (or Redirect)
  ├─ /admin/dashboard              ✅ 307 - Redirect (auth required)

╔════════════════════════════════════════════════════════════════════════════╗
║                        📊 RESULTADO DA VALIDAÇÃO                           ║
╚════════════════════════════════════════════════════════════════════════════╝

📈 Resumo:
  ✅ Sucesso:    15 rotas
  ❌ Erros:      0 rotas
  ⚠️  Avisos:    0 rotas
  📊 Total:      18 rotas

🎉 Todas as rotas estão OK!

📄 Relatório completo: reports/route-validation.json
⏰ Gerado em: 2026-02-05T10:30:45.123Z
```

---

## 📋 ARQUIVO DE RELATÓRIO

### Estrutura: `reports/route-validation.json`

```json
{
  "timestamp": "2026-02-05T10:30:45.123Z",
  "baseUrl": "http://localhost:3000",
  "summary": {
    "totalRoutesTested": 18,
    "successCount": 15,
    "errorCount": 2,
    "warningCount": 1
  },
  "errors": {
    "route404": [
      {
        "route": "/rota-inexistente",
        "statusCode": 404,
        "statusText": "Not Found",
        "title": null,
        "titleLanguage": null,
        "contentLength": 1234,
        "responseTime": 245
      }
    ],
    "adminAccessible": [
      {
        "route": "/admin/dashboard",
        "statusCode": 200,
        "statusText": "OK",
        "title": "Admin Dashboard",
        "titleLanguage": "unknown",
        "contentLength": 5678,
        "responseTime": 156
      }
    ],
    "titleMissing": []
  },
  "warnings": {
    "titleNotPt": [
      {
        "route": "/blog/artigo-hu",
        "statusCode": 200,
        "statusText": "OK",
        "title": "Pomerániai (német törpe spicc)",
        "titleLanguage": "hu",
        "contentLength": 9012,
        "responseTime": 189
      }
    ],
    "slowResponse": []
  },
  "rawData": [
    {
      "route": "/",
      "statusCode": 200,
      "statusText": "OK",
      "title": "Spitz Alemão Anão | By Imperio Dog",
      "titleLanguage": "pt-BR",
      "contentLength": 45678,
      "responseTime": 289
    }
  ]
}
```

---

## 🔴 COMO LER ERROS

### ### ❌ **Error: Route 404**

```json
"route404": [
  {
    "route": "/rota-inexistente",
    "statusCode": 404,
    "title": null
  }
]
```

**Ação:**
- Verificar se página existe em `app/`
- Se deletada, adicionar redirect em `netlify.toml`
- Se nunca existiu, remover menção no sitemap

### ❌ **Error: Admin Accessible**

```json
"adminAccessible": [
  {
    "route": "/admin/dashboard",
    "statusCode": 200,
    "title": "Admin Dashboard"
  }
]
```

**Ação:**
- Editar `middleware.ts` para proteger rota
- Verificar se bloqueio de autenticação está funcionando

### 🌐 **Warning: Title Not Portuguese**

```json
"titleNotPt": [
  {
    "route": "/blog/artigo-hu",
    "title": "Pomerániai (német törpe spicc)",
    "titleLanguage": "hu"
  }
]
```

**Ação:**
- Verificar se é redirecionado via `netlify.toml` (401)
- Se for post de blog, verificar metadata em `buildBlogMetadata()`
- Considerar exclusão ou tradução do conteúdo

---

## 🤖 INTEGRAR COM CI/CD

### GitHub Actions

```yaml
# .github/workflows/route-validation.yml
name: Route Validation

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 0 * * *'  # Daily

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Start server
        run: npm start &
        env:
          NEXT_PUBLIC_SITE_URL: http://localhost:3000
      
      - name: Wait for server
        run: npx wait-on http://localhost:3000 --timeout 30000
      
      - name: Validate routes
        run: npm run route:validate
      
      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: route-validation-report
          path: reports/route-validation.json
```

### Vercel Deploy Hooks

```bash
# Após deploy, rodar validação
curl -X POST https://api.vercel.com/v1/deployments \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "by-imperio-dog",
    "project": "by-imperio-dog",
    "env": ["ROUTE_VALIDATOR_URL=https://byimperiodog.com.br"]
  }' \
  && npm run route:validate:prod
```

---

## 🧪 TESTES LOCAIS

### Teste 1: Verificar Servidor Rodando

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run route:validate
```

### Teste 2: Simular Erro 404

Deletar uma página temporariamente e rodar:

```bash
rm app/filhotes/page.tsx
npm run route:validate  # Deve reportar 404

git checkout app/filhotes/page.tsx  # Restaurar
```

### Teste 3: Title Não-PT

Editar `app/sobre/page.tsx` e mudar title para:

```tsx
export const metadata = {
  title: 'About Us',  // ❌ English, not PT-BR
};
```

Rodar validator:

```bash
npm run route:validate  # Deve avisar "titleNotPt"
```

### Teste 4: Admin Desprotegido

Remover auth check de `/admin`:

```tsx
// ❌ Remover este código de middleware.ts
if (pathname.startsWith('/admin')) {
  const session = request.cookies.get('auth')?...// Remover

npm run route:validate  # Deve reportar "adminAccessible"
```

---

## 🎯 ROTAS TESTADAS POR PADRÃO

### Rotas Públicas

Editar em `scripts/route-validator.ts` - array `PUBLIC_ROUTES_TO_TEST`:

```typescript
const PUBLIC_ROUTES_TO_TEST = [
  '/',
  '/filhotes',
  '/blog',
  '/sobre',
  '/contato',
  '/comprar-spitz-anao',
  '/reserve-seu-filhote',
  '/preco-spitz-anao',
  '/politica-de-privacidade',
  '/politica-editorial',
  '/termos-de-uso',
  '/faq-do-tutor',
  '/criador-spitz-confiavel',
];
```

### Rotas Admin

Editar em `scripts/route-validator.ts` - array `ADMIN_ROUTES`:

```typescript
const ADMIN_ROUTES = [
  '/admin',
  '/admin/login',
  '/admin/dashboard',
];
```

---

## 🔍 DETECÇÃO DE IDIOMA

O script detecta idioma via palavras-chave no `<title>`:

### Português (PT-BR)
```
filhote, spitz, alemão, imperio, dog, pomerânia, comprar, preço, reserv, cuidado
```

### Húngaro (HU) ⚠️
```
pomerániai, kölyökkutyák, élhető, prémium, kolyok
```

### Inglês (EN)
```
puppy, puppies, breeder, dog, price, contact, about
```

### Espanhol (ES)
```
cachorro, criador, perro, precio, contacto
```

### Alemão (DE)
```
welpe, züchter, hund, preis, kontakt
```

**Nota:** Se título não contiver palavras conhecidas, retorna `"unknown"`

---

## ⚙️ OPÇÕES AVANÇADAS

### Custom Timeout

```bash
# Aumentar timeout para 10s
TIMEOUT=10000 npm run route:validate
```

### Custom Routes

Editar `scripts/route-validator.ts` e adicionar mais rotas:

```typescript
const PUBLIC_ROUTES_TO_TEST = [
  // ... existentes
  '/nova-rota',
  '/outra-rota',
];
```

### Debug Mode

```bash
NODE_DEBUG=fetch npm run route:validate 2>&1 | grep "fetch"
```

---

## 📞 TROUBLESHOOTING

### Erro: "ECONNREFUSED 127.0.0.1:3000"

**Solução:**
```bash
# Terminal 1
npm run dev

# Aguardar "ready - started server on..."
# Terminal 2
npm run route:validate
```

### Erro: "Invalid URL"

**Verificar:**
- URL em `ROUTE_VALIDATOR_URL` é válida
- Exemplo: `http://localhost:3000` (sem barra final)

### Timeout em Rotas Lentas

**Aumentar timeout:**
```bash
TIMEOUT=15000 npm run route:validate
```

### Títulos Detectados Como "Unknown"

**Editar `detectTitleLanguage()`:**
```typescript
// Adicionar palavras-chave no array correto
const ptKeywords = [..., 'sua-palavra'];
```

---

## 📈 INTEGRAÇÃO COM MONITORAMENTO

### Salvar histórico de validações

```bash
# Criar backup de relatório
cp reports/route-validation.json reports/route-validation-$(date +%Y%m%d-%H%M%S).json
```

### Comparar relatórios

```bash
# Buscar mudanças entre execuções
diff reports/route-validation-20260205-101234.json reports/route-validation-20260205-110934.json
```

### Alertas Automáticos

```bash
# Verificar se houve 404s
jq '.errors.route404 | length' reports/route-validation.json
# Se > 0, enviar alerta Slack
```

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ Script criado e funcionando
2. 🔄 Adicionar ao CI/CD (GitHub Actions)
3. 🔄 Monitorar rotas diariamente
4. 🔄 Criar dashboard com histórico
5. 🔄 Integrar alertas Slack/Email

---

**Pronto para validar rotas! 🎉**
