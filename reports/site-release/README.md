# Consolidação das melhorias autorizadas

Base remota conferida em 04/11/2026: `629f2c2de378a964e74c41314b180e7d62b07a26`.
O usuário autorizou recuperar a hero e as melhorias já desenvolvidas, publicar e fazer push.

## Reconciliação

- Mantido o reposicionamento das avaliações do commit `a39e78d`: resumo no hero, seção após diferenciais e antes da vitrine, 1–3 cartões responsivos.
- Recuperada a hero com o grupo de Spitz, enquadramento, gradientes e sombra de texto aprovados no checkout anterior.
- Recuperada a busca local por cor, sexo, orçamento, localização, documentos e reserva, com estados acessíveis e limpeza dos filtros. Sem API paga ou afirmação de estoque.
- Mantido o CTA atual da main no catálogo e a prioridade de imagem da primeira ficha; aproveitados dimensionamento responsivo e correção do nome acessível do CTA.
- Recuperado o link de compra para a página de reserva.
- Depoimentos e foto de Emily/PomPom continuam incluídos na seção existente.
- Navegação editorial, metadados, preços individuais, catálogo, consentimento, segurança e atualizações de dependências da main preservados. Os seis links educativos da versão antiga foram conciliados com a navegação editorial mais abrangente já presente na main, sem substituí-la.
- Não foram aplicadas propostas comerciais ainda não implementadas nem restauradas versões antigas de preços ou arquivos de segurança do checkout anterior.

## Validação

ESLint dos arquivos de aplicação e testes alterados: aprovado.
Vitest: 55 testes aprovados em 4 arquivos; a primeira rodada teve dois timeouts de leitura de arquivos (5 s), resolvidos com um worker e limite de 20 s, sem alterar as asserções.
Build e evidências do navegador são registrados nesta pasta. Requisições de contato/analytics e serviços externos bloqueadas durante os testes locais.

Next.js compilou, verificou TypeScript e gerou as 148 páginas. O empacotamento local de Edge Functions da Netlify falhou por resolução de caminho Windows (`C:/` duplicado e módulo Turbopack não encontrado); a publicação será construída na infraestrutura Linux da Netlify a partir do commit enviado ao GitHub.

Navegador no build de produção: homepage em 390/768/1440/1920 px e catálogo em 390/1280 px aprovados. Hero confirmada, resumo e seção únicos, navegação por toque/teclado/setas, busca e links preservados. Zero overflow e zero violações axe detectadas nas seções testadas. Evidências: `browser-validation.json`, `catalog-browser.json`, `hero-1440.png`, `hero-390.png`.

## Arquivos desta consolidação

- `src/components/sections/VideoHero.tsx`
- `src/components/catalog/StaticCatalog.tsx`
- `src/components/catalog/StaticPuppyCard.tsx`
- `src/lib/catalog-query.ts`
- `tests/unit/catalog-query.test.ts`
- `app/(public)/comprar-spitz-anao/page.tsx`
- `scripts/site-release-check.mjs`
- `scripts/site-release-catalog-check.mjs`

As alterações de avaliações e seus arquivos estão documentados em `../reviews-position/README.md`.
