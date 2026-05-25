# Testes

## Unit (Vitest)
- Config: `vitest.config.ts`
- Local dos testes: `tests/unit/*.test.ts`
- Rodar:
```bash
npm install
npx vitest run
```

## E2E (Playwright – planejamento)
- Instalar navegadores: `npx playwright install`
- Estrutura sugerida: `tests/e2e/*.spec.ts`
- Script futuro: `"test:e2e": "playwright test"`

## Mock Supabase
Para isolar ranking em `relatedPosts`, usamos função pura `scoreRelatedPost` além de mock simplificado de `supabasePublic`.

## Próximos passos
- Adicionar setup global de teste para variáveis de ambiente básicas.
- Introduzir cobertura (`--coverage`) quando maturar.
- E2E smoke: home, /blog, /blog/{slug}, /autores/{slug} retornam 200 e elementos principais presentes.
