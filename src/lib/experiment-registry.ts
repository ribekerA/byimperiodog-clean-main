/**
 * Registro central de experimentos A/B ativos.
 *
 * Cada experimento define:
 * - key: identificador único (usado no localStorage e GA4)
 * - hypothesis: por que acreditamos que a variante vai ganhar
 * - metric: o que mede sucesso/fracasso
 * - variants: variantes com pesos (total deve somar 100)
 * - minSamplePerVariant: número mínimo de exposições antes de analisar
 *
 * Como ver resultados:
 *   GA4 → Explorar → Funil ou Evento "experiment_view" / "experiment_conversion"
 *   Filtre por dimensão customizada "experiment" e "variant"
 */

export interface ExperimentVariant {
  key: string;
  label: string;
  weight: number;
}

export interface Experiment {
  key: string;
  name: string;
  hypothesis: string;
  metric: string;
  minSamplePerVariant: number;
  variants: ExperimentVariant[];
  active: boolean;
  startedAt?: string;
}

export const EXPERIMENTS: Experiment[] = [
  {
    key: "hero-cta-text",
    name: "CTA Hero — Texto do botão primário",
    hypothesis:
      "Mudar 'Falar com a criadora' para 'Ver filhotes disponíveis agora' aumentará o CTR do hero porque" +
      " evidencia o catálogo (intenção de browse) em vez de compromisso de contato direto.",
    metric: "lead_whatsapp (hero) — cliques rastreados no GA4",
    minSamplePerVariant: 500,
    active: true,
    startedAt: "2026-05-31",
    variants: [
      { key: "A", label: "Falar com a criadora (controle)", weight: 50 },
      { key: "B", label: "Ver filhotes disponíveis agora (variante)", weight: 50 },
    ],
  },
  {
    key: "form-cta-text",
    name: "CTA Formulário — Texto do botão de envio",
    hypothesis:
      "Mudar 'Quero conhecer os filhotes disponíveis' para 'Falar com a criadora agora' aumentará a taxa" +
      " de envio do formulário porque enfatiza acesso direto à pessoa, não ao produto.",
    metric: "lead_form_submit — eventos GA4",
    minSamplePerVariant: 300,
    active: false, // ativar após hero-cta-text concluir
    variants: [
      { key: "A", label: "Quero conhecer os filhotes disponíveis (controle)", weight: 50 },
      { key: "B", label: "Falar com a criadora agora (variante)", weight: 50 },
    ],
  },
  {
    key: "scarcity-badge",
    name: "Badge de Escassez no Hero — Mostrar contagem de filhotes",
    hypothesis:
      "Mostrar 'X filhotes disponíveis agora' no hero aumentará a taxa de clique em filhotes" +
      " porque cria FOMO e urgência baseada em dados reais.",
    metric: "lead_filhote — visualizações de página de filhote",
    minSamplePerVariant: 1000,
    active: true,
    startedAt: "2026-05-31",
    variants: [
      { key: "A", label: "Sem badge de escassez (controle)", weight: 50 },
      { key: "B", label: "Badge 'X filhotes disponíveis' (variante)", weight: 50 },
    ],
  },
];

export function getExperiment(key: string): Experiment | undefined {
  return EXPERIMENTS.find((e) => e.key === key && e.active);
}
