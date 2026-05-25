# Admin Dashboard Design System & UX

Este documento cataloga rapidamente os componentes e padrões introduzidos na refatoração UI premium.

## Tokens & Theming
- `design-system/tokens.css` define cores, espaçamentos, tipografia utilitária, radius, sombras e motion.
- `ThemeProvider` (`design-system/theme-provider.tsx`) injeta atributo `data-theme` e persiste escolha (light/dark).
- Convenção de variáveis: `--bg`, `--surface`, `--surface-2`, `--accent`, `--success`, `--error`, etc.

## Componentes Core
| Componente | Arquivo | Uso principal |
|------------|---------|--------------|
| AdminShell | `src/components/admin/AdminShell.tsx` | Layout, navegação, tema |
| MetricCard | `src/components/admin/MetricCard.tsx` | KPIs com trend opcional |
| Panel | `src/components/admin/Panel.tsx` | Agrupar seções com título & ações |
| Button | `src/components/ui/button.tsx` | Ações (variants: solid, outline, subtle, ghost, danger) |
| Input | `src/components/ui/input.tsx` | Campos texto base |
| Badge | `src/components/ui/badge.tsx` | Status / labels compactos |
| DataTable | `src/components/admin/DataTable.tsx` | Listagens tabulares acessíveis |
| Tooltip | `src/components/ui/tooltip.tsx` | Ajuda contextual leve |
| Skeleton | `src/components/admin/Skeleton.tsx` | Carregamento |
| EmptyState | `src/components/admin/EmptyState.tsx` | Sem dados |
| ErrorState | `src/components/admin/ErrorState.tsx` | Erros recuperáveis |

## Padrões de Acessibilidade
- Navegação por teclado: foco visível, `aria-sort` em colunas ordenáveis.
- Skip link para conteúdo principal.
- Tooltips fecham com `Esc`.
- Tabela: cabeçalho `th` sticky e contraste adequado.

## Estado de Carregamento
- DataTable imprime até 6 linhas skeleton.
- MetricCard tem placeholder shimmer leve.

## Checklist SEO Condensado
- Indicador em coluna "Título" mostra badge `!` com tooltip listando pendências (máx 6 itens).
- Evita poluição visual mantendo contexto rápido.

## Próximos Passos Sugeridos
1. Dialog modal padronizado (confirm / formulários rápidos) — acessar remoções em vez de `confirm()` nativo.
2. Componente `FiltersBar` reutilizável (chips + contagem + limpar) extraindo lógica do blog.
3. Serviço de métricas para calcular trends (comparar períodos). Expor hook `useMetricTrend(key, period)`.
4. Storybook para documentação viva (organizar em `Foundations/`, `Components/`, `Patterns/`).
5. Testes de acessibilidade automatizados (axe) em rotas críticas.

## Performance & Lighthouse (Planejado)
- Adiar gráficos pesados (dynamic import).
- Prefetch seletivo de rotas de edição somente ao focar botão "Editar".
- Reaproveitar resposta SEO batch entre páginas (cache em contexto).

## Convenções
- Evitar utilidades em linha repetidas — promover tokens/variantes conforme padrões emergem.
- Variáveis CSS são a fonte da verdade; Tailwind serve para layout e espaçamento rápido.

## Changelog Inicial
- v0.1: Tokens + Theme + Shell + Primitives (button, input, badge) + DataTable + Tooltip + README_DASHBOARD.

---
Qualquer evolução adicional deve manter: acessibilidade, consistência visual, mínima acoplagem a regras de negócio.
