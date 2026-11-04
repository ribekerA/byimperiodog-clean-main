# Reposicionamento das avaliações — validação local

Branch: `codex/avaliacoes-posicionamento-main`.
Base: `origin/main` atualizado por fetch, SHA `629f2c2de378a964e74c41314b180e7d62b07a26`.
O checkout anterior foi preservado. Nenhum push, deploy ou publicação foi realizado.

## Resultado

- Resumo compacto do componente existente após os CTAs do hero.
- Apresentação e diferenciais existentes, seguidos pela seção completa de avaliações, antes da vitrine.
- Uma avaliação por vez em 390 px, duas em 768 px e três em 1440/1920 px. Navegação por deslize, setas e teclado.
- Mesmos dados e link de conferência: 4,9/5, 35 avaliações; snapshot manual conferido em 03/11/2026. Não foi adicionada sincronização automática.
- Uma única lista: 33 avaliações Google transcritas, 14 depoimentos existentes e uma foto de família. As origens continuam identificadas; não são 48 avaliações Google.
- Componentes anteriormente desenvolvidos reaproveitados no checkout da main. Sem widget externo, novas dependências ou chamada adicional para obter avaliações. Resumo compacto renderizado no servidor.
- Preços, catálogo, WhatsApp, metadados, schema e textos comerciais preservados. A imagem e o restante do hero seguem a main; alterações antigas do outro checkout não foram incorporadas.

## Arquivos de implementação

1. `app/(public)/page.tsx`: ordem das seções e uso do resumo.
2. `src/components/sections/VideoHero.tsx`: slot opcional para o resumo.
3. `src/components/sections/TextTestimonials.tsx`: seção existente reaproveitada, Google primeiro, contenção do carrossel.
4. `src/components/reviews/GoogleReviewsSection.tsx`: resumo completo e variante compacta.
5. `src/components/reviews/GoogleReviewCards.tsx`: cartões existentes.
6. `src/components/reviews/ReviewCarousel.tsx`: carrossel existente com larguras responsivas.
7. `src/components/reviews/ReviewComment.tsx`: expansão de comentários existente.
8. `content/google-reviews.ts`: dados reais existentes.
9. `public/reviews/emily-pompom.jpg`: foto já fornecida; fora da pasta descoberta automaticamente pelo álbum.
10. `scripts/reviews-position-check.mjs`: verificação de posicionamento e regressões no navegador.

## Verificações

- Build Next.js de produção concluído; ambiente local usa o fallback existente de site_settings quando a consulta não está disponível.
- ESLint dos arquivos alterados.
- Vitest: 3 arquivos, 41 testes aprovados (pricing-guard, price-format-guard, seo-schema).
- Chromium/Playwright sobre build de produção, em 390, 768, 1440 e 1920 px.
- Zero overflow horizontal nas quatro larguras; uma instância do resumo compacto e uma da seção completa.
- Deslize por eventos de toque em 390 px; setas, teclado e expansão de comentários testados.
- Axe: zero violações WCAG A/AA detectadas no resumo e na seção de avaliações. Não constitui auditoria completa de acessibilidade do site.
- Comparação byte a byte com a base dos arquivos de preços, catálogo, WhatsApp, SEO, schema e FAQ; preços publicados de R$ 7.500 e R$ 9.500 também verificados no navegador.
- No celular, a seção completa termina aproximadamente em 20,6% da altura da homepage, antes da vitrine.
- Requisições externas e eventos de analytics foram bloqueados durante os testes. Não foi realizada medição de desempenho de campo; a validação confirma ausência de duplicação do widget/lista, sem afirmar ganhos de LCP.

Resultados detalhados: `browser-validation.json`. Logs locais: `build-final.log`, `lint.log`, `regressions.log`, `browser.log`.

## Evidências

- `position-1440.png` e `position-390.png`: sequência do início da página até a entrada da vitrine.
- `hero-1440.png` e `hero-390.png`: resumo junto aos CTAs.
- `reviews-1440.png` e `reviews-390.png`: seção completa.

Prévia local: http://localhost:3104. Publicação em produção depende de aprovação separada.
