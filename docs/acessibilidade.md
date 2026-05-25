# Acessibilidade aplicada (primeira rodada)

- **Hierarquia semântica**: home e catálogo mantêm `<main>` com `role="main"` e `<h1>` único (HeroSection). Seções secundárias usam `<section>` e `<article>` coerentes.
- **Foco e teclado**: botões e links mantêm foco visível; filtros e CTAs ganharam `focus-visible` consistente e rótulos explícitos para inputs/selects.
- **ARIA/labels**: filtros de filhotes agora possuem `aria-label`, texto descritivo em chips e mensagens de estado com `aria-live`.
- **Conteúdo legível**: textos corrigidos (sem caracteres quebrados) para leitura e SEO; descrições e CTAs revisadas em Hero e filtros.
- **Feedback ao usuário**: região viva para contagem de resultados em `PuppiesGrid` e mensagens de erro carregam papel de status.

Próximos passos recomendados:
- Revisar páginas de cor/cidade/blog/admin para garantir um único `<h1>` e landmarks (`<nav>`, `<aside>`).
- Adicionar `aria-live` nos toasts/modais e verificar contraste com tokens do design system.
- Validar no Lighthouse/axe para cobrir possíveis lacunas restantes. 
