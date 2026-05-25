/**
 * Módulo de inteligência de comportamento para o admin.
 * Coleta eventos de navegação e ação, sumariza padrões e gera recomendações de layout/atalhos.
 *
 * Entrada: array de eventos [{ userId, route, action, durationMs, timestamp }]
 * Saída: recomendações de reordenação de menus, atalhos e widgets.
 */

type BehaviorEvent = {
  userId: string;
  route: string; // ex.: /admin/puppies
  action?: string; // ex.: "create_puppy", "status_change"
  durationMs?: number;
  timestamp: number;
};

export type BehaviorRecommendation = {
  reorderNav: { href: string; score: number }[]; // itens mais usados primeiro
  quickShortcuts: { href: string; label: string; reason: string }[];
  highlightWidgets: { id: string; reason: string }[];
  slowZones: { route: string; avgDuration: number; hint: string }[];
};

function topK<T extends { score: number }>(arr: T[], k: number) {
  return [...arr].sort((a, b) => b.score - a.score).slice(0, k);
}

export function generateBehaviorRecommendations(events: BehaviorEvent[]): BehaviorRecommendation {
  // Frequência por rota
  const routeFreq = new Map<string, number>();
  // Frequência por ação
  const actionFreq = new Map<string, number>();
  // Duração média por rota
  const routeDuration: Record<string, { total: number; count: number }> = {};

  events.forEach((ev) => {
    routeFreq.set(ev.route, (routeFreq.get(ev.route) ?? 0) + 1);
    if (ev.action) actionFreq.set(ev.action, (actionFreq.get(ev.action) ?? 0) + 1);
    if (ev.durationMs) {
      routeDuration[ev.route] = routeDuration[ev.route] || { total: 0, count: 0 };
      routeDuration[ev.route].total += ev.durationMs;
      routeDuration[ev.route].count += 1;
    }
  });

  // Reordenar nav: rotas mais acessadas primeiro
  const reorderNav = topK(
    Array.from(routeFreq.entries()).map(([href, score]) => ({ href, score })),
    6,
  );

  // Atalhos rápidos: ações mais frequentes
  const quickShortcuts = topK(
    Array.from(actionFreq.entries()).map(([action, score]) => ({
      href: mapActionToHref(action),
      label: mapActionToLabel(action),
      reason: `Ação recorrente (${score}x)`,
      score, // add dummy score for topK
    })),
    4,
  )
    .filter((item) => item.href)
    .map(({ score, ...rest }) => rest); // remove score after filtering

  // Zonas lentas: rotas com maior tempo médio
  const slowZones = Object.entries(routeDuration)
    .map(([route, v]) => ({ route, avgDuration: v.total / Math.max(1, v.count) }))
    .sort((a, b) => b.avgDuration - a.avgDuration)
    .slice(0, 3)
    .map((z) => ({
      ...z,
      hint: z.avgDuration > 120000 ? "Considerar simplificar formulário ou pré-preencher dados." : "Avaliar UX desta página.",
    }));

  // Destaque de widgets: inferido de rotas/ações (heurística simples)
  const highlightWidgets = quickShortcuts.map((q) => ({
    id: q.href,
    reason: q.reason,
  }));

  return { reorderNav, quickShortcuts, highlightWidgets, slowZones };
}

function mapActionToHref(action: string): string {
  if (action.includes("puppy")) return "/admin/puppies";
  if (action.includes("lead")) return "/admin/leads";
  if (action.includes("analytics")) return "/admin/analytics";
  return "";
}

function mapActionToLabel(action: string): string {
  if (action === "create_puppy") return "Novo filhote";
  if (action === "status_change") return "Atualizar status";
  if (action === "lead_followup") return "Follow-up lead";
  return action;
}
