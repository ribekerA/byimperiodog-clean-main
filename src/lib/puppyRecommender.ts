import {
  type StockPuppy,
  STOCK_PUPPY_SELECT,
  rowsToStockPuppies,
  sameCity,
  sameColor,
  sameSex,
  stockStatusValues,
} from "@/lib/admin/puppyStock";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type PuppyRecommendation = {
  puppyIdIdeal: string | null;
  top3Matches: { id: string; name: string; score: number; reason: string }[];
  reasoningText: string;
  score: number;
  upsellOpportunity: boolean;
};

export type RecommendationPrefs = {
  color?: string | null;
  sex?: string | null;
  city?: string | null;
  /** Orcamento em reais. */
  budget?: number | null;
};

export function parseBudget(budget?: string | null): number | null {
  if (!budget) return null;
  const match = budget.match(/(\d{1,6})/);
  if (!match) return null;
  const value = Number(match[1]) * (/mil/i.test(budget) ? 1000 : 1);
  return value >= 100 ? value : null;
}

/** Regra fixa: soma pontos por cor, sexo, cidade, disponibilidade e preco perto do orcamento. */
export function scoreStockPuppy(puppy: StockPuppy, prefs: RecommendationPrefs): { score: number; reason: string } {
  let score = 0;
  const reasons: string[] = [];

  if (sameColor(prefs.color, puppy.color)) {
    score += 30;
    reasons.push("cor desejada");
  }
  if (sameSex(prefs.sex, puppy.sex)) {
    score += 20;
    reasons.push("sexo desejado");
  }
  if (sameCity(prefs.city, puppy.city)) {
    score += 15;
    reasons.push("mesma cidade");
  }
  if (puppy.status === "available") {
    score += 10;
    reasons.push("disponível");
  }
  if (prefs.budget && puppy.priceCents) {
    const price = puppy.priceCents / 100;
    const diff = Math.abs(price - prefs.budget);
    if (diff <= prefs.budget * 0.1) {
      score += 15;
      reasons.push("preço perto do orçamento");
    } else if (price > prefs.budget && diff <= prefs.budget * 0.2) {
      score += 5;
      reasons.push("preço até 20% acima do orçamento");
    }
  }

  return { score, reason: reasons.length ? reasons.join(", ") : "sem ponto em comum com o pedido" };
}

export function rankStockPuppies(puppies: readonly StockPuppy[], prefs: RecommendationPrefs): PuppyRecommendation {
  const scored = puppies
    .map((puppy) => ({ puppy, ...scoreStockPuppy(puppy, prefs) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const top = scored[0];
  const reasoningText = top
    ? `"${top.puppy.name}" teve a maior nota: ${top.reason}.`
    : "Não há filhote disponível no estoque para comparar com este pedido.";

  const upsellOpportunity = Boolean(
    prefs.budget && top?.puppy.priceCents && top.puppy.priceCents / 100 > prefs.budget * 1.1,
  );

  return {
    puppyIdIdeal: top?.puppy.id ?? null,
    top3Matches: scored.map((entry) => ({
      id: entry.puppy.id,
      name: entry.puppy.name,
      score: entry.score,
      reason: entry.reason,
    })),
    reasoningText,
    score: top?.score ?? 0,
    upsellOpportunity,
  };
}

export async function recommendPuppiesForLead(leadId: string): Promise<PuppyRecommendation> {
  const sb = supabaseAdmin();

  const [leadResult, insightResult] = await Promise.all([
    sb.from("leads").select("id,cidade,cor_preferida,sexo_preferido").eq("id", leadId).maybeSingle(),
    sb
      .from("lead_ai_insights")
      .select("desired_color,desired_sex,desired_city,budget_inferred")
      .eq("lead_id", leadId)
      .maybeSingle(),
  ]);

  if (leadResult.error) throw new Error("O banco recusou a leitura do lead.");
  const lead = leadResult.data;
  if (!lead) throw new Error("Lead não encontrado.");
  const insight = insightResult.data;

  const prefs: RecommendationPrefs = {
    color: insight?.desired_color || lead.cor_preferida || null,
    sex: insight?.desired_sex || lead.sexo_preferido || null,
    city: insight?.desired_city || lead.cidade || null,
    budget: parseBudget(insight?.budget_inferred),
  };

  const { data: rows, error } = await sb
    .from("puppies")
    .select(STOCK_PUPPY_SELECT)
    .in("status", stockStatusValues(["available"]))
    .limit(100);

  if (error) throw new Error("O banco recusou a leitura dos filhotes.");

  return rankStockPuppies(rowsToStockPuppies(rows), prefs);
}
