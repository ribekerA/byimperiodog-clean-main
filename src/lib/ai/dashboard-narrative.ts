import { supabaseAdmin } from "@/lib/supabaseAdmin";

type Metrics = {
  leads7d: number;
  leadsPrev7: number;
  sold?: number;
  reserved?: number;
  available?: number;
  responseAvg?: number;
};

type LeadAgg = {
  cor_preferida?: string | null;
  sexo_preferido?: string | null;
};

type Narrative = {
  summary: string;
  opportunities: string[];
  risks: string[];
  recommendations: string[];
};

async function fetchLeadsAgg(days: number): Promise<LeadAgg[]> {
  const sb = supabaseAdmin();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data } = await sb
    .from("leads")
    .select("cor_preferida,sexo_preferido")
    .gte("created_at", since.toISOString());
  return (data ?? []) as LeadAgg[];
}

async function fetchResponseAvg(days: number): Promise<number | null> {
  const sb = supabaseAdmin();
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const { data } = await sb
      .from("lead_interactions")
      .select("response_time_minutes")
      .gte("created_at", since.toISOString());
    const arr = (data ?? []).map((d: any) => d.response_time_minutes ?? 0).filter((n: number) => n > 0);
    if (arr.length === 0) return null;
    return arr.reduce((a: number, b: number) => a + b, 0) / arr.length;
  } catch {
    return null;
  }
}

export async function generateDashboardNarrative(): Promise<Narrative> {
  const sb = supabaseAdmin();

  const since7 = new Date();
  since7.setDate(since7.getDate() - 7);
  const sincePrev7 = new Date();
  sincePrev7.setDate(sincePrev7.getDate() - 14);

  const [{ count: leads7d }, { count: leadsPrev7 }, { data: puppies }] = await Promise.all([
    sb.from("leads").select("*", { count: "exact", head: true }).gte("created_at", since7.toISOString()),
    sb
      .from("leads")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sincePrev7.toISOString())
      .lt("created_at", since7.toISOString()),
    sb.from("puppies").select("status"),
  ]);

  const leadsAgg = await fetchLeadsAgg(30);
  const responseAvg = await fetchResponseAvg(30);

  const available = (puppies ?? []).filter((p: any) => p.status === "available").length;
  const reserved = (puppies ?? []).filter((p: any) => p.status === "reserved").length;
  const sold = (puppies ?? []).filter((p: any) => p.status === "sold").length;

  const metrics: Metrics = {
    leads7d: leads7d ?? 0,
    leadsPrev7: leadsPrev7 ?? 0,
    available,
    reserved,
    sold,
    responseAvg: responseAvg ?? undefined,
  };

  const summaryParts = [];
  const delta = metrics.leadsPrev7 ? ((metrics.leads7d - metrics.leadsPrev7) / metrics.leadsPrev7) * 100 : 0;
  summaryParts.push(
    `Leads na semana: ${metrics.leads7d} (${delta >= 0 ? "+" : ""}${delta.toFixed(1)}% vs semana anterior). Estoque disponível: ${
      metrics.available
    } (reservados ${metrics.reserved}, vendidos ${metrics.sold}).`
  );
  if (metrics.responseAvg) summaryParts.push(`Tempo médio de resposta: ${Math.round(metrics.responseAvg)} min.`);

  const colorDemand = new Map<string, number>();
  const sexDemand = new Map<string, number>();
  leadsAgg.forEach((l) => {
    if (l.cor_preferida) colorDemand.set(l.cor_preferida, (colorDemand.get(l.cor_preferida) ?? 0) + 1);
    if (l.sexo_preferido) sexDemand.set(l.sexo_preferido, (sexDemand.get(l.sexo_preferido) ?? 0) + 1);
  });
  const topColor = Array.from(colorDemand.entries()).sort((a, b) => b[1] - a[1])[0];
  const topSex = Array.from(sexDemand.entries()).sort((a, b) => b[1] - a[1])[0];

  const opportunities: string[] = [];
  const risks: string[] = [];
  const recommendations: string[] = [];

  if (topColor) opportunities.push(`Cor em alta: ${topColor[0]}. Destaque no catálogo e blog.`);
  if (topSex) opportunities.push(`Preferência de sexo: ${topSex[0]}. Ajuste copy e filtros.`);

  if (metrics.available && metrics.available > 0 && metrics.leads7d === 0) {
    risks.push("Estoque disponível sem leads na semana. Verificar pixels/tracking e campanhas.");
  }
  if (metrics.responseAvg && metrics.responseAvg > 30) {
    risks.push("Tempo de resposta alto. Risco de perda de leads quentes.");
    recommendations.push("Configurar follow-up automático e alertas de SLA < 10 min.");
  }

  if (delta < -10) {
    recommendations.push("Rodar promo leve ou reforçar tráfego orgânico/paid para recuperar volume.");
  } else if (delta > 10) {
    opportunities.push("Crescimento semanal forte: priorizar upsell e captura de depoimentos.");
  }

  const summary = summaryParts.join(" ");

  return { summary, opportunities, risks, recommendations };
}
