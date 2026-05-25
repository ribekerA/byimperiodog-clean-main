import { supabaseAdmin } from "@/lib/supabaseAdmin";

type LeadRow = {
  id: string;
  created_at: string;
  cor_preferida?: string | null;
  sexo_preferido?: string | null;
  cidade?: string | null;
  estado?: string | null;
  status?: string | null;
  utm_source?: string | null;
};

type PuppyRow = {
  id: string;
  name?: string | null;
  color?: string | null;
  status?: string | null;
  price_cents?: number | null;
  created_at?: string | null;
};

type InteractionRow = {
  lead_id: string;
  created_at: string;
  response_time_minutes?: number | null;
  messages_sent?: number | null;
};

export type DeepInsight = {
  title: string;
  detail: string;
};

export type DeepInsightsReport = {
  periodLabel: string;
  summary: string;
  weeklyHighlights: DeepInsight[];
  dailyInsights: DeepInsight[];
  risks: DeepInsight[];
  opportunities: DeepInsight[];
};

function toDateKey(dateStr: string) {
  return new Date(dateStr).toISOString().slice(0, 10);
}

async function fetchLeads(days: number): Promise<LeadRow[]> {
  const sb = supabaseAdmin();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data } = await sb
    .from("leads")
    .select("id,created_at,cor_preferida,sexo_preferido,cidade,estado,status,utm_source")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false });
  return (data ?? []) as LeadRow[];
}

async function fetchPuppies(): Promise<PuppyRow[]> {
  const sb = supabaseAdmin();
  const { data } = await sb.from("puppies").select("id,name,color,status,price_cents,created_at");
  return (data ?? []) as PuppyRow[];
}

async function fetchInteractions(days: number): Promise<InteractionRow[]> {
  const sb = supabaseAdmin();
  const since = new Date();
  since.setDate(since.getDate() - days);
  try {
    const { data } = await sb
      .from("lead_interactions")
      .select("lead_id,created_at,response_time_minutes,messages_sent")
      .gte("created_at", since.toISOString());
    return (data ?? []) as InteractionRow[];
  } catch {
    return [] as InteractionRow[];
  }
}

export async function generateDeepInsights(): Promise<DeepInsightsReport> {
  const [leads, puppies, interactions] = await Promise.all([fetchLeads(90), fetchPuppies(), fetchInteractions(90)]);

  const leadsByDay = new Map<string, number>();
  leads.forEach((l) => leadsByDay.set(toDateKey(l.created_at), (leadsByDay.get(toDateKey(l.created_at)) ?? 0) + 1));

  const leadsByColor = new Map<string, number>();
  leads.forEach((l) => {
    const c = (l.cor_preferida || "desconhecida").toLowerCase();
    leadsByColor.set(c, (leadsByColor.get(c) ?? 0) + 1);
  });

  const leadsByCity = new Map<string, number>();
  leads.forEach((l) => {
    const c = l.cidade || "desconhecida";
    leadsByCity.set(c, (leadsByCity.get(c) ?? 0) + 1);
  });

  const leadsByHour = new Map<number, number>();
  leads.forEach((l) => {
    const h = new Date(l.created_at).getHours();
    leadsByHour.set(h, (leadsByHour.get(h) ?? 0) + 1);
  });

  const soldOrReserved = puppies.filter((p) => p.status === "sold" || p.status === "reserved");
  const slowToSell = soldOrReserved.filter((p) => {
    if (!p.created_at) return false;
    const days = (Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24);
    return days > 45;
  });

  const priceArray = soldOrReserved.map((p) => p.price_cents || 0).filter(Boolean);
  priceArray.sort((a, b) => a - b);
  const medianPrice = priceArray[Math.floor(priceArray.length / 2)] || 0;

  const weeklyHighlights: DeepInsight[] = [];
  const dailyInsights: DeepInsight[] = [];
  const risks: DeepInsight[] = [];
  const opportunities: DeepInsight[] = [];

  // Crescimento/queda
  const last7 = leads.filter((l) => new Date(l.created_at) > new Date(Date.now() - 7 * 86400 * 1000)).length;
  const prev7 = leads.filter(
    (l) => new Date(l.created_at) <= new Date(Date.now() - 7 * 86400 * 1000) && new Date(l.created_at) > new Date(Date.now() - 14 * 86400 * 1000),
  ).length;
  if (prev7 > 0) {
    const delta = ((last7 - prev7) / prev7) * 100;
    weeklyHighlights.push({
      title: "Variação de leads",
      detail: delta >= 0 ? `Leads +${delta.toFixed(1)}% vs 7d anteriores.` : `Leads ${delta.toFixed(1)}% abaixo da semana anterior.`,
    });
  }

  // Cores que mais vendem (pelo interesse)
  const topColor = Array.from(leadsByColor.entries()).sort((a, b) => b[1] - a[1])[0];
  if (topColor) {
    weeklyHighlights.push({ title: "Cor em alta", detail: `Maior interesse em ${topColor[0]} nos últimos 90d.` });
  }

  // Cidades
  const topCity = Array.from(leadsByCity.entries()).sort((a, b) => b[1] - a[1])[0];
  if (topCity) {
    weeklyHighlights.push({ title: "Cidade que mais converte", detail: `${topCity[0]} lidera em volume de leads.` });
  }

  // Horário
  const bestHour = Array.from(leadsByHour.entries()).sort((a, b) => b[1] - a[1])[0];
  if (bestHour) {
    dailyInsights.push({
      title: "Horário de melhor conversão",
      detail: `Maior volume de leads às ${bestHour[0]}h; alinhe disparos de mídia/WhatsApp.`,
    });
  }

  // Lentos para vender
  if (slowToSell.length > 0) {
    risks.push({
      title: "Filhotes lentos para vender",
      detail: `${slowToSell.length} filhotes com mais de 45 dias no estoque. Ajuste preço/fotos ou destaque no catálogo.`,
    });
  }

  // Preço x conversão
  const highPrice = puppies.filter((p) => (p.price_cents ?? 0) > medianPrice * 1.2).length;
  if (highPrice > 0) {
    risks.push({
      title: "Preço pode reduzir conversão",
      detail: `${highPrice} filhotes estão acima da mediana em >20%. Avalie ajuste de preço ou incluir benefícios adicionais.`,
    });
  }

  // Interações de WhatsApp (se houver)
  if (interactions.length > 0) {
    const avgResponse =
      interactions.reduce((sum, i) => sum + (i.response_time_minutes ?? 0), 0) / Math.max(interactions.length, 1);
    opportunities.push({
      title: "Comportamento no WhatsApp",
      detail: `Tempo médio de resposta de ${Math.round(avgResponse)} min. Respostas <10min tendem a aumentar fechamento.`,
    });
  }

  // Upsell de cor rara (menor disponibilidade)
  const colorCounts = new Map<string, number>();
  puppies.forEach((p) => {
    const c = (p.color || "desconhecida").toLowerCase();
    colorCounts.set(c, (colorCounts.get(c) ?? 0) + 1);
  });
  const rareColor = Array.from(colorCounts.entries()).sort((a, b) => a[1] - b[1])[0];
  if (rareColor) {
    opportunities.push({
      title: "Oportunidade de upsell",
      detail: `Cor rara (${rareColor[0]}) tem menor estoque. Posicione como premium para aumentar ticket.`,
    });
  }

  const summary = `Relatório automático baseado em leads (90d), estoque e interações. Mediana de preço: R$ ${(
    (medianPrice || 0) / 100
  ).toFixed(2)}.`;

  return {
    periodLabel: "90 dias",
    summary,
    weeklyHighlights,
    dailyInsights,
    risks,
    opportunities,
  };
}
