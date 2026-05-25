# ⚡ Route Validator - Quick Start

**Tempo:** 2 minutos para rodar

---

## 🚀 Usar Agora

### 1️⃣ Iniciar Servidor Next.js

```bash
npm run dev

# Aguardar:
# > ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

### 2️⃣ Em Novo Terminal - Validar Rotas

```bash
npm run route:validate
```

### 3️⃣ Verificar Relatório

```bash
# Ver resumo no terminal (já aparece)
# Ou abrir arquivo:
cat reports/route-validation.json | jq .

# Ou com jq (mais legível):
jq '.summary' reports/route-validation.json
```

---

## 📊 EXEMPLOS DE SAÍDA

### ✅ Tudo OK

```
✅ Sucesso:    15 rotas
❌ Erros:      0 rotas
⚠️  Avisos:    0 rotas

🎉 Todas as rotas estão OK!
```

### ⚠️ Com Erros

```
✅ Sucesso:    13 rotas
❌ Erros:      2 rotas
⚠️  Avisos:    1 rota

❌ ROTAS COM 404:
   • /rota-deletada - Status 404

🌐 ROTAS COM TITLE NÃO-PORTUGUÊS:
   • /blog/artigo-hu - Idioma: hu
```

---

## 🎯 3 VARIANTES

| Comando | Onde Testa | Uso |
|---------|-----------|-----|
| `npm run route:validate` | http://localhost:3000 | Desenvolvimento |
| `npm run route:validate:prod` | https://www.byimperiodog.com.br | Produção |
| `npm run route:validate:staging` | https://staging.byimperiodog.com.br | Staging |

---

## 📋 O QUE VALIDA

✅ Verifica:
- Status HTTP de 15 rotas públicas
- `<title>` de cada página
- Idioma do título (PT-BR expected)
- Proteção de rotas `/admin` (sem auth)
- Tempo de resposta

❌ Reporta:
- Páginas com 404
- Admin acessível sem senha
- Títulos faltando ou inválidos
- Títulos em outro idioma (ex: húngaro)
- Respostas lentas (>2s)

---

## 📁 Arquivo de Saída

`reports/route-validation.json` - Relatório completo em JSON

```bash
# Ver apenas erros
jq '.errors' reports/route-validation.json

# Ver apenas avisos
jq '.warnings' reports/route-validation.json

# Ver dados brutos
jq '.rawData[] | {route, statusCode, title}' reports/route-validation.json
```

---

## ❓ FAQ

**P: Preciso executar em produção?**  
Sim, rode `npm run route:validate:prod` para validar site ao vivo.

**P: Pode deletar arquivo relatório?**  
Sim, é regenerado sempre. Mas salve para comparar histórico.

**P: Como adicionar mais rotas?**  
Edite `scripts/route-validator.ts` - array `PUBLIC_ROUTES_TO_TEST`

**P: Qual é o exit code?**  
- 0 = Sucesso (sem erros)
- 1 = Erro encontrado (404, admin desprotegido, etc)

---

**Pronto! Execute: `npm run route:validate` 🎉**
