/**
 * ConversionAnalyzerAI
 * Analisa leads + filhotes + tempos de resposta para identificar gargalos e recomendar melhorias.
 */

type Lead = {
  id: string;
  status?: string | null; // novo, em_contato, fechado, perdido
  created_at?: string | null;
  cor_preferida?: string | null;
  sexo_preferido?: string | null;
  page_slug?: string | null;
  utm_source?: string | null;
};

type Puppy = {
  id: string;
  status?: string | null; // available/reserved/sold/coming_soon
  price_cents?: number | null;
  color?: string | null;
};

type Interaction = {
  lead_id: string;
  response_time_minutes?: number | null; // tempo para responder
  messages_sent?: number | null;
};

export type ConversionInsight = {
  bottlenecks: string[];
  losses: string[];
  recommendations: string[];
  summary: string;
};

export function analyzeConversion(leads: Lead[], puppies: Puppy[], interactions: Interaction[] = []): ConversionInsight {
  const bottlenecks: string[] = [];
  const losses: string[] = [];
  const recommendations: string[] = [];

  const totalLeads = leads.length || 1;
  const closed = leads.filter((l) => l.status === "fechado").length;
  const lost = leads.filter((l) => l.status === "perdido").length;
  const inContact = leads.filter((l) => l.status === "em_contato").length;

  const closeRate = (closed / totalLeads) * 100;
  const lostRate = (lost / totalLeads) * 100;

  // Tempo de resposta médio
  const respSamples = interactions.filter((i) => i.response_time_minutes != null);
  const avgResponse =
    respSamples.reduce((acc, i) => acc + (i.response_time_minutes ?? 0), 0) /
    Math.max(1, respSamples.length || 1);

  if (respSamples.length > 0 && avgResponse > 60) bottlenecks.push(`Tempo médio de resposta alto (${Math.round(avgResponse)} min).`);
  if (closeRate < 20) bottlenecks.push(`Taxa de fechamento baixa (${closeRate.toFixed(1)}%).`);
  if (lostRate > 30) losses.push(`Muitos leads marcados como perdidos (${lostRate.toFixed(1)}%).`);

  // Cores com alto abandono
  const colorLossMap = new Map<string, { total: number; lost: number }>();
  leads.forEach((l) => {
    const color = (l.cor_preferida || "indefinida").toLowerCase();
    const entry = colorLossMap.get(color) || { total: 0, lost: 0 };
    entry.total += 1;
    if (l.status === "perdido") entry.lost += 1;
    colorLossMap.set(color, entry);
  });
  const colorLosses = Array.from(colorLossMap.entries())
    .map(([color, v]) => ({ color, rate: (v.lost / Math.max(1, v.total)) * 100 }))
    .filter((c) => c.rate > 40);
  colorLosses.forEach((c) => losses.push(`Cor ${c.color} tem abandono alto (${c.rate.toFixed(1)}%).`));

  // Faixa de preço com baixa conversão
  const availablePuppies = puppies.filter((p) => (p.status ?? "available") === "available");
  const avgPrice =
    availablePuppies.reduce((acc, p) => acc + (p.price_cents ?? 0), 0) / Math.max(1, availablePuppies.length);
  if (avgPrice > 0 && closeRate < 20) {
    recommendations.push("Revisar precificação/condições; aplicar condições promocionais para acelerar conversão.");
  }

  // Interações (mensagens enviadas)
  const avgMsgs =
    interactions.reduce((acc, i) => acc + (i.messages_sent ?? 0), 0) /
    Math.max(1, interactions.filter((i) => i.messages_sent != null).length);
  if (avgMsgs < 2 && closeRate < 25) recommendations.push("Aumentar toques de follow-up (mín. 2-3 mensagens por lead).");

  if (respSamples.length > 0 && avgResponse > 60) recommendations.push("Implementar alerta de SLA: responder em <30 min.");
  if (lostRate > 30) recommendations.push("Revisar script inicial e objeções mais comuns; usar IA para sugerir respostas rápidas.");

  const summary =
    `Fechamento: ${closeRate.toFixed(1)}% | Perdidos: ${lostRate.toFixed(1)}% | Tempo resp médio: ${Math.round(avgResponse)} min. ` +
    (bottlenecks[0] || "");

  return { bottlenecks, losses, recommendations, summary };
}
