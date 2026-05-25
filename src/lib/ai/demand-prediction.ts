import { supabaseAdmin } from "@/lib/supabaseAdmin";

type LeadRow = {
  id: string;
  created_at: string;
  cor_preferida?: string | null;
  sexo_preferido?: string | null;
};

type TrafficRow = {
  date: string;
  pageviews: number;
};

type DemandOutput = {
  color: string;
  sex: string;
  week_start_date: string;
  week_end_date: string;
  predicted_leads: number;
  predicted_shortage: boolean;
  recommendation: string;
  risk_alert: string;
  features: Record<string, unknown>;
};

const COLORS = ["branco", "creme", "preto", "laranja", "particolor", "sable"];
const SEX = ["macho", "femea", "indiferente"];

function normalize(text?: string | null) {
  return (text ?? "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function weeksAhead(weeks: number) {
  const start = new Date();
  start.setDate(start.getDate() + weeks * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { start: iso(start), end: iso(end) };
}

function seasonalFactor(date: Date) {
  const month = date.getMonth() + 1;
  // Ajuste simples: fim/início de ano +5%
  if ([11, 12, 1].includes(month)) return 1.05;
  return 1;
}

function temperatureFactor() {
  // Placeholder: sem dados reais de temperatura, neutro
  return 1;
}

function averageTraffic(traffic: TrafficRow[]) {
  if (!traffic.length) return 1;
  const avg = traffic.reduce((a, t) => a + t.pageviews, 0) / traffic.length;
  return Math.max(avg, 1);
}

function predictForColorSex(
  color: string,
  sex: string,
  leads: LeadRow[],
  traffic: TrafficRow[],
): DemandOutput[] {
  const normColor = normalize(color);
  const normSex = normalize(sex);
  const filtered = leads.filter((l) => {
    const lc = normalize(l.cor_preferida);
    const ls = normalize(l.sexo_preferido);
    const colorMatch = !normColor || lc.includes(normColor);
    const sexMatch = !normSex || ls.includes(normSex) || (!ls && normSex === "indiferente");
    return colorMatch && sexMatch;
  });

  const baseVolume = filtered.length;
  const trafficFactor = averageTraffic(traffic) / 100; // escala básica
  const season = seasonalFactor(new Date());
  const temp = temperatureFactor();
  const weekly = Math.max(1, baseVolume * 0.25); // heurística: 25% do volume recente vira previsão semanal
  const adjusted = weekly * trafficFactor * season * temp;

  const outputs: DemandOutput[] = [];
  for (let w = 0; w < 4; w++) {
    const { start, end } = weeksAhead(w);
    const predicted_leads = Math.max(1, Math.round(adjusted * (1 + 0.05 * w))); // leve crescimento
    const predicted_shortage = predicted_leads > 3; // heurística: se prever >3 leads, risco de falta sem reposição
    const recommendation = predicted_shortage
      ? `Planejar estoque para ${predicted_leads} leads (cor ${color}, sexo ${sex}).`
      : `Demanda moderada para ${color}/${sex}.`;
    const risk_alert = predicted_shortage ? "Risco de falta: aumentar captação ou repor estoque." : "";
    outputs.push({
      color,
      sex,
      week_start_date: start,
      week_end_date: end,
      predicted_leads,
      predicted_shortage,
      recommendation,
      risk_alert,
      features: {
        baseVolume,
        trafficFactor,
        season,
        temp,
      },
    });
  }
  return outputs;
}

export async function recalcDemandPredictions() {
  const sb = supabaseAdmin();
  const sinceIso = new Date();
  sinceIso.setDate(sinceIso.getDate() - 60); // últimos 60 dias

  const [{ data: leads }, { data: traffic }] = await Promise.all([
    sb
      .from("leads")
      .select("id,created_at,cor_preferida,sexo_preferido")
      .gte("created_at", sinceIso.toISOString()),
    // Se existir tabela de analytics própria, ajustar aqui; caso não exista, usa lista vazia
    sb.from("site_traffic").select("date,pageviews").order("date", { ascending: false }).limit(60),
  ]);

  const allTraffic = (traffic ?? []) as TrafficRow[];

  const outputs: DemandOutput[] = [];
  COLORS.forEach((c) => {
    SEX.forEach((s) => {
      outputs.push(...predictForColorSex(c, s, (leads ?? []) as LeadRow[], allTraffic));
    });
  });

  const payload = outputs.map((o) => ({
    color: o.color,
    sex: o.sex,
    week_start_date: o.week_start_date,
    week_end_date: o.week_end_date,
    predicted_leads: o.predicted_leads,
    predicted_shortage: o.predicted_shortage,
    recommendation: o.recommendation,
    risk_alert: o.risk_alert,
    features: o.features,
  }));

  await sb.from("demand_predictions").upsert(payload, { onConflict: "color,sex,week_start_date" });
  return outputs;
}
