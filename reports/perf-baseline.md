# Performance Baseline (Fase 4)

Data: 2025-09-15

## Objetivos Alvo (Inicial)
- LCP (home): < 2.4s em desktop simulado / < 3.0s mobile mid-tier
- CLS: < 0.1
- INP: < 200ms (mediana em interação simples – clique CTA)
- TTFB (edge/local dev não confiável): < 400ms produção (meta futura)
- JS inicial (main + framework + route): reduzir remoção de libs não usadas e adiar partículas/charts

## Prioridades Desta Iteração
1. Adiar carregamento de partículas (hero) até Intersection + idle.
2. Confirmar se charts estão realmente em uso; se não, postergar dynamic import (ou remover stack duplicada depois).
3. Adiar qualquer carousel pesado (Embla) via dynamic import (se usado).
4. Inserir preconnect condicional quando métricas reais forem medidas (ex: fonts externas / analytics). Sem fontes externas, pular.

## Checklist (Antes)
- Partículas: carregadas via dynamic padrão (pacote `tsparticles-slim` importado no bundle principal).
- Charts: componentes presentes mas não consumidos diretamente (grep sem uso).
- Carousel (Embla): a validar.

## Plano Ação
| Item | Ação | Métrica Impacto Esperado |
|------|------|--------------------------|
| Hero Particles | Intersection + idle import interno | -20-40KB JS inicial + menor CPU no start |
| Charts | Marcar como lazy só quando realmente usados | Evitar chunk ocioso |
| Embla | Dynamic import sob demanda | -8-15KB se presente |
| Preconnect | Adiar até confirmação de hosts críticos | Redução DNS/TLS futura |

## Medição Recomendada
Executar (local prod build):
```
npm run build
npx lighthouse http://localhost:3000 --preset=desktop --output=json --output-path=./reports/lh-desktop.json
```
(Em ambiente CI futuro: script automatizado com budgets.)

## Próxima Atualização
Adicionar seção "After" comparando peso de chunks (usar `next build` output) quando otimizações aplicadas.

---
### Atualização 1 (Hero Particles) – 15/09/2025
- Substituído dynamic default por lazy manual (IntersectionObserver + requestIdleCallback + import sob demanda + cache de módulo).
- Removido import imediato de `react-tsparticles` do bundle inicial.
- Esperado: Redução do tempo de parse/exec JS inicial e menor pressão de CPU antes do primeiro paint significativo.

---
### Atualização 2 (Charts Pruning + LazyChart Stub) – 15/09/2025
Resumo:
- Removido stack Chart.js (`chart.js`, `react-chartjs-2`).
- `LeadChart` convertido em stub e isolado (remoção de imports pesados) para garantir ausência de referências.
- Introduzido `LazyChart` baseado em Recharts com:
	- IntersectionObserver (+ rootMargin 200px) para adiar carregamento.
	- requestIdleCallback fallback para evitar competir com LCP.
	- Cache único de dynamic import (evita múltiplos downloads ao ter vários gráficos).
- `ChartCard` atualizado para usar `LazyChart` com LineChart/BarChart mínimos (sem dependências extras).
- Preconnect condicional para GTM / GA4 (apenas se variáveis presentes) reduz tempo DNS quando analytics realmente ativos sem penalizar ambientes sem tags.

Build (após otimização) – rota home `/`:
- First Load JS: 224 kB (conforme output Next). Mantido dentro da faixa planejada pré-carousels.
- Shared chunks: ~87 kB (framework + shared). Sem Chart.js (~70–90 kB economia potencial vs stack completa + adaptadores).

Observações Técnicas:
- Recharts permanece lazy por componente; sem render inicial não aumenta JS crítico.
- Próximo ganho possível: extrair partes não usadas de Recharts (tree-shaking adicional ou migrar para lib mais leve caso gráficos cresçam).
- Warnings de build apontam ausência de `meilisearch` (dependência opcional) — avaliar remoção ou adicionar stub/tiny client deferred para evitar ruído.

Próximos Passos Propostos:
1. Orquestrar auditoria de Recharts usage real antes de adicionar novos tipos.
2. Medir LCP real após deploy com e sem primeira dobra contendo gráfico (cenário AB futuro).
3. Avaliar remoção de pacotes Embla se continuar não utilizado (ver grep antes).
4. Introduzir script automatizado de diff de tamanhos (salvar JSON comparando builds) para rastreio incremental.

Indicadores a Monitorar Próxima Iteração:
- LCP após remoção Chart.js.
- INP em vistas admin com múltiplos gráficos (deverá permanecer estável devido ao lazy). 
- TTFB não afetado (alterações puramente de front bundle). 

---
### Budgets Definidos (Inicial) – 15/09/2025
Arquivo: `lighthouserc.json`
- LCP <= 3000ms (desktop preset simulado)
- CLS <= 0.1
- TTI (interactive) <= 4500ms
- Total Blocking Time <= 400ms
- Script total rota `/` <= 250kB (transfer)
- Peso total <= 600kB (transfer)
- Unused JS alerta se > 180kB

Racional:
- Valores levemente abaixo dos limites recomendados para criar margem antes de regressões.
- Ajustar thresholds após primeira coleta real em ambiente de produção.

