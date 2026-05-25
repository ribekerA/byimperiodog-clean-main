import { supabaseAdmin } from "@/lib/supabaseAdmin";

type LeadRecord = {
  id: string;
  nome?: string | null;
  telefone?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cor_preferida?: string | null;
  sexo_preferido?: string | null;
  mensagem?: string | null;
};

type InsightRecord = {
  desired_color?: string | null;
  desired_sex?: string | null;
  desired_city?: string | null;
  budget_inferred?: string | null;
};

type PuppyRecord = {
  id: string;
  name: string;
  color?: string | null;
  sex?: string | null;
  price_cents?: number | null;
  city?: string | null;
  state?: string | null;
  status?: string | null;
};

export type PuppyRecommendation = {
  puppyIdIdeal: string | null;
  top3Matches: { id: string; name: string; score: number; reason: string }[];
  reasoningText: string;
  score: number;
  upsellOpportunity: boolean;
};

function normalize(value?: string | null) {
  return (value ?? "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").trim();
}

function parseBudget(budget?: string | null) {
  if (!budget) return null;
  const match = budget.match(/(\d{3,6})/);
  if (!match) return null;
  return Number(match[1]) * (budget.includes("mil") ? 1000 : 1);
}

function scorePuppy(p: PuppyRecord, prefs: { color?: string; sex?: string; city?: string; budget?: number | null }) {
  let score = 0;
  const reasons: string[] = [];

  if (prefs.color && normalize(p.color).includes(normalize(prefs.color))) {
    score += 30;
    reasons.push("Cor desejada");
  }
  if (prefs.sex && normalize(p.sex) === normalize(prefs.sex)) {
    score += 20;
    reasons.push("Sexo desejado");
  }
  if (prefs.city && normalize(p.city) && normalize(p.city) === normalize(prefs.city)) {
    score += 15;
    reasons.push("Cidade próxima");
  }
  if ((p.status ?? "available") === "available") {
    score += 10;
    reasons.push("Disponível");
  }
  if (prefs.budget && p.price_cents) {
    const price = p.price_cents / 100;
    const diff = Math.abs(price - prefs.budget);
    if (diff <= prefs.budget * 0.1) {
      score += 15;
      reasons.push("Preço alinhado");
    } else if (price > prefs.budget && diff <= prefs.budget * 0.2) {
      score += 5;
      reasons.push("Upsell possível");
    }
  }

  if (reasons.length === 0) reasons.push("Compatibilidade geral");
  return { score, reason: reasons.join(", ") };
}

export async function recommendPuppiesForLead(leadId: string): Promise<PuppyRecommendation> {
  const sb = supabaseAdmin();

  const [{ data: lead }, { data: insight }] = await Promise.all([
    sb
      .from("leads")
      .select("id,nome,telefone,cidade,estado,cor_preferida,sexo_preferido,mensagem")
      .eq("id", leadId)
      .maybeSingle(),
    sb.from("lead_ai_insights").select("desired_color,desired_sex,desired_city,budget_inferred,score").eq("lead_id", leadId).maybeSingle(),
  ]);

  if (!lead) {
    throw new Error("Lead não encontrado");
  }

  const prefs = {
    color: insight?.desired_color || lead.cor_preferida || undefined,
    sex: insight?.desired_sex || lead.sexo_preferido || undefined,
    city: insight?.desired_city || lead.cidade || undefined,
    budget: parseBudget(insight?.budget_inferred),
  };

  const { data: puppies } = await sb
    .from("puppies")
    .select("id,name,color,sex,price_cents,city,state,status")
    .or("status.is.null,status.eq.available")
    .limit(100);

  const scored =
    puppies
      ?.map((p: any) => {
        const { score, reason } = scorePuppy(p as PuppyRecord, prefs);
        return { ...p, score, reason };
      })
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 3) ?? [];

  const top = scored[0];

  const reasoningText = top
    ? `Recomendado "${top.name}" pela combinação de ${top.reason}.`
    : "Nenhum filhote ideal encontrado, sugira opções amplas.";

  const upsellOpportunity = Boolean(prefs.budget && top?.price_cents && top.price_cents / 100 > (prefs.budget ?? 0) * 1.1);

  return {
    puppyIdIdeal: top?.id ?? null,
    top3Matches: scored.map((s: any) => ({ id: s.id, name: s.name, score: s.score, reason: s.reason })),
    reasoningText,
    score: top?.score ?? 0,
    upsellOpportunity,
  };
}
