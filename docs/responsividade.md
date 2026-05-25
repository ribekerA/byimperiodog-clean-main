# Responsividade adotada

- **Mobile first**: componentes e seções principais usam classes utilitárias com colunas únicas no mobile e expansão gradual em breakpoints (`sm`, `md`, `lg`). Grids que eram 3 colunas fixas agora empilham no mobile (ex.: CTAs dos cards de filhotes).
- **Tap targets**: botões e CTAs críticos têm altura mínima ≥44–48px e espaçamento interno adequado para toque.
- **Imagens**: uso de `aspect-[4/3]` nos cards e `sizes` adequados; hero e cards mantêm `object-cover` e placeholders para evitar CLS. Dimensões e preload principais continuam definidos no layout.
- **Tipografia**: fontes base em 14–16px no mobile; headings mantêm hierarquia e legibilidade sem estourar largura.
- **Contêineres**: paddings horizontais (`px-4/5/6`) e `max-w` consistentes para evitar overflow; seções largas usam `max-w-7xl/6xl`.
- **A11y em mobile**: foco visível, aria-label/aria-live e labels acima dos campos em formulários, garantindo leitura em telas pequenas.

Próximos passos: validar páginas de cor/cidade/blog/admin em dispositivos reais e ajustar eventuais quebras específicas de conteúdo. 
