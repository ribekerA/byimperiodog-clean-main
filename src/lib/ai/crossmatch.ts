import {
  type StockPuppy,
  STOCK_PUPPY_SELECT,
  medianPriceCents,
  rowsToStockPuppies,
  sameColor,
  sameSex,
  stockStatusValues,
} from "@/lib/admin/puppyStock";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type CrossMatchPrefs = {
  color?: string | null;
  sex?: string | null;
};

export type CrossMatchSuggestion = {
  /** match: combina com o pedido; upsell: combina e custa bem acima da mediana; fallback: nada combinou de verdade. */
  suggestion_type: "match" | "upsell" | "fallback";
  puppyId: string | null;
  puppyName?: string | null;
  reasoning: string;
  /** Nota da regra, de 0 a 100. O nome do campo e antigo: nao e probabilidade medida. */
  probability_of_acceptance: number;
  alternatives: { id: string; name: string | null; score: number }[];
};

const EMPTY: CrossMatchSuggestion = {
  suggestion_type: "fallback",
  puppyId: null,
  reasoning: "Não há filhote disponível ou reservado para comparar.",
  probability_of_acceptance: 0,
  alternatives: [],
};

/** Regra fixa: 50 pontos pela cor, 30 pelo sexo e 20 por estar disponivel (e nao apenas reservado). */
export function scoreCrossMatch(prefs: CrossMatchPrefs, puppy: StockPuppy): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  if (sameColor(prefs.color, puppy.color)) {
    score += 50;
    reasons.push("cor desejada");
  }
  if (sameSex(prefs.sex, puppy.sex)) {
    score += 30;
    reasons.push("sexo desejado");
  }
  if (puppy.status === "available") {
    score += 20;
    reasons.push("disponível agora");
  }
  return { score, reasons };
}

export function crossMatch(prefs: CrossMatchPrefs, puppies: readonly StockPuppy[]): CrossMatchSuggestion {
  if (!puppies.length) return EMPTY;

  const median = medianPriceCents(puppies);
  const top = puppies
    .map((puppy) => ({ puppy, ...scoreCrossMatch(prefs, puppy) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  const best = top[0];

  // So conta como combinacao quando a cor ou o sexo pedidos batem; estar disponivel sozinho nao basta.
  const matchesRequest = best.score > 20 || (best.score === 20 && best.puppy.status !== "available");
  const aboveMedian = Boolean(median && best.puppy.priceCents && best.puppy.priceCents > median * 1.15);

  let type: CrossMatchSuggestion["suggestion_type"] = "fallback";
  if (matchesRequest) type = aboveMedian ? "upsell" : "match";

  const reasons = [...best.reasons];
  if (type === "upsell") reasons.push("preço acima da mediana do estoque");

  return {
    suggestion_type: type,
    puppyId: best.puppy.id,
    puppyName: best.puppy.name,
    reasoning: matchesRequest
      ? `Combina por ${reasons.join(", ")}.`
      : "Nenhum filhote do estoque bate com a cor ou o sexo pedidos. Este é só o primeiro da lista.",
    probability_of_acceptance: Math.max(0, Math.min(100, best.score)),
    alternatives: top.map((entry) => ({ id: entry.puppy.id, name: entry.puppy.name, score: entry.score })),
  };
}

export async function runCrossMatch(leadId: string): Promise<CrossMatchSuggestion> {
  const sb = supabaseAdmin();
  const { data: lead, error: leadError } = await sb
    .from("leads")
    .select("id,cor_preferida,sexo_preferido")
    .eq("id", leadId)
    .maybeSingle();

  if (leadError) throw new Error("O banco recusou a leitura do lead.");
  if (!lead) throw new Error("Lead não encontrado.");

  const { data: rows, error } = await sb
    .from("puppies")
    .select(STOCK_PUPPY_SELECT)
    .in("status", stockStatusValues(["available", "reserved"]))
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw new Error("O banco recusou a leitura dos filhotes.");

  return crossMatch(
    { color: lead.cor_preferida, sex: lead.sexo_preferido },
    rowsToStockPuppies(rows),
  );
}
