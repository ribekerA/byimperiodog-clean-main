import { supabaseAdmin } from "@/lib/supabaseAdmin";

type LeadRow = {
  id: string;
  created_at: string;
  cor_preferida?: string | null;
  status?: string | null;
};

type PuppyRow = {
  id: string;
  name?: string | null;
  status?: string | null;
  price_cents?: number | null;
  created_at?: string | null;
};

export type Decision = {
  title: string;
  action: string;
  reason: string;
  severity: "info" | "warning" | "critical";
};

async function fetchLeads(days: number): Promise<LeadRow[]> {
  const sb = supabaseAdmin();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data } = await sb
    .from("leads")
    .select("id,created_at,cor_preferida,status")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false });
  return (data ?? []) as LeadRow[];
}

async function fetchPuppies(): Promise<PuppyRow[]> {
  const sb = supabaseAdmin();
  const { data } = await sb.from("puppies").select("id,name,status,price_cents,created_at");
  return (data ?? []) as PuppyRow[];
}

export async function generateDecisions(): Promise<Decision[]> {
  const [leads, puppies] = await Promise.all([fetchLeads(60), fetchPuppies()]);

  const last7 = leads.filter((l) => new Date(l.created_at) >= new Date(Date.now() - 7 * 86400 * 1000)).length;
  const prev7 = leads.filter(
    (l) =>
      new Date(l.created_at) < new Date(Date.now() - 7 * 86400 * 1000) &&
      new Date(l.created_at) >= new Date(Date.now() - 14 * 86400 * 1000),
  ).length;

  const priceArray = puppies.map((p) => p.price_cents || 0).filter(Boolean).sort((a, b) => a - b);
  const medianPrice = priceArray[Math.floor(priceArray.length / 2)] || 0;

  const available = puppies.filter((p) => p.status === "available");
  const longStock = available.filter((p) => {
    if (!p.created_at) return false;
    const days = (Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24);
    return days > 45;
  });

  const decisions: Decision[] = [];

  if (prev7 > 0 && last7 < prev7 * 0.8) {
    decisions.push({
      title: "Alerta: baixa demanda",
      action: "Planejar promo leve ou empurrar conteúdo/SEO para recuperar volume.",
      reason: `Leads caíram ${(((last7 - prev7) / prev7) * 100).toFixed(1)}% vs semana anterior.`,
      severity: "warning",
    });
  }

  if (longStock.length > 0) {
    decisions.push({
      title: "Filhotes há muito tempo no estoque",
      action: "Rever preço/fotos e priorizar destaque no catálogo ou redes.",
      reason: `${longStock.length} filhotes disponíveis há >45 dias.`,
      severity: "critical",
    });
  }

  const premiumCount = available.filter((p) => (p.price_cents ?? 0) > medianPrice * 1.2).length;
  if (premiumCount > 0 && last7 < prev7) {
    decisions.push({
      title: "Avaliar ajuste de preço",
      action: "Testar redução ou bônus (brinde/entrega) nos premium para destravar conversão.",
      reason: `${premiumCount} itens estão >20% acima da mediana e demanda caiu.`,
      severity: "warning",
    });
  }

  const colorMap = new Map<string, number>();
  leads.forEach((l) => {
    const c = (l.cor_preferida || "desconhecida").toLowerCase();
    colorMap.set(c, (colorMap.get(c) ?? 0) + 1);
  });
  const topColor = Array.from(colorMap.entries()).sort((a, b) => b[1] - a[1])[0];
  if (topColor) {
    decisions.push({
      title: "Ativar seguidores/conteúdo de blog",
      action: `Produzir/impulsionar conteúdo para cor ${topColor[0]} e capturar emails/WhatsApp.`,
      reason: `Cor mais buscada nos últimos 60 dias: ${topColor[0]}.`,
      severity: "info",
    });
  }

  if (last7 === 0 && available.length > 0) {
    decisions.push({
      title: "Nenhum lead na semana",
      action: "Ligar campanhas pontuais ou revisar tracking/pixels.",
      reason: "Sem leads nos últimos 7 dias com estoque disponível.",
      severity: "critical",
    });
  }

  return decisions;
}

export async function logDecisions(decisions: Decision[]) {
  const sb = supabaseAdmin();
  try {
    await sb.from("admin_actions").insert({
      action: "decision_engine",
      details: decisions,
      created_at: new Date().toISOString(),
    });
  } catch {
    // tabela opcional
  }
}
