import { supabaseAdmin } from "@/lib/supabaseAdmin";

type LeadRow = {
  id: string;
  cor_preferida?: string | null;
  sexo_preferido?: string | null;
  page_slug?: string | null;
};

type PuppyRow = {
  id: string;
  name?: string | null;
  color?: string | null;
  gender?: string | null;
  status?: string | null;
  price_cents?: number | null;
  slug?: string | null;
};

export type CrossMatchSuggestion = {
  suggestion_type: "match" | "upsell" | "fallback";
  puppyId: string | null;
  puppyName?: string | null;
  reasoning: string;
  probability_of_acceptance: number;
  alternatives: { id: string; name: string | null; score: number }[];
};

function norm(str?: string | null) {
  return (str || "").trim().toLowerCase();
}

function scorePuppy(lead: LeadRow, puppy: PuppyRow, medianPrice: number): { score: number; type: "match" | "upsell" | "fallback" } {
  let score = 0;
  let type: "match" | "upsell" | "fallback" = "match";

  if (norm(lead.cor_preferida) && norm(lead.cor_preferida) === norm(puppy.color)) score += 40;
  if (norm(lead.sexo_preferido) && norm(lead.sexo_preferido) === norm(puppy.gender)) score += 20;
  if ((puppy.status || "available") === "available") score += 20;
  if (puppy.price_cents && medianPrice && puppy.price_cents > medianPrice * 1.15) {
    score += 15;
    type = "upsell";
  }
  if (score < 30) type = "fallback";
  return { score, type };
}

export async function runCrossMatch(leadId: string): Promise<CrossMatchSuggestion> {
  const sb = supabaseAdmin();
  const { data: lead } = await sb
    .from("leads")
    .select("id,cor_preferida,sexo_preferido,page_slug")
    .eq("id", leadId)
    .limit(1)
    .single();

  if (!lead) {
    return {
      suggestion_type: "fallback",
      puppyId: null,
      reasoning: "Lead não encontrado",
      probability_of_acceptance: 0,
      alternatives: [],
    };
  }

  const { data: puppies } = await sb
    .from("puppies")
    .select("id,name,color,gender,status,price_cents,slug")
    .or("status.eq.available,status.eq.reserved")
    .order("created_at", { ascending: false });

  if (!puppies || puppies.length === 0) {
    return {
      suggestion_type: "fallback",
      puppyId: null,
      reasoning: "Nenhum filhote disponível para recomendar.",
      probability_of_acceptance: 0,
      alternatives: [],
    };
  }

  const prices = puppies.map((p: PuppyRow) => p.price_cents || 0).filter((price: number) => Boolean(price));
  const medianPrice = prices.sort((a: number, b: number) => a - b)[Math.floor(prices.length / 2)] || 0;

  const scored = puppies.map((p: PuppyRow) => {
    const { score, type } = scorePuppy(lead, p, medianPrice);
    return { puppy: p, score, type };
  });

  scored.sort((a: { puppy: PuppyRow; score: number; type: string }, b: { puppy: PuppyRow; score: number; type: string }) => b.score - a.score);
  const top = scored.slice(0, 3);
  const best = top[0];

  const acceptance = Math.max(5, Math.min(95, best?.score ?? 0));
  const reasoningParts: string[] = [];
  if (norm(lead.cor_preferida) && norm(lead.cor_preferida) === norm(best?.puppy.color)) reasoningParts.push("cor desejada");
  if (norm(lead.sexo_preferido) && norm(lead.sexo_preferido) === norm(best?.puppy.gender)) reasoningParts.push("sexo desejado");
  if ((best?.puppy.status || "available") === "available") reasoningParts.push("disponível imediato");
  if (best && best.score > medianPrice && best.type === "upsell") reasoningParts.push("opção premium para aumentar ticket");

  return {
    suggestion_type: best?.type ?? "fallback",
    puppyId: best?.puppy.id ?? null,
    puppyName: best?.puppy.name,
    reasoning: reasoningParts.length ? `Combina por ${reasoningParts.join(", ")}.` : "Melhor afinidade disponível.",
    probability_of_acceptance: acceptance,
    alternatives: top.map((t: { puppy: PuppyRow; score: number; type: string }) => ({ id: t.puppy.id, name: t.puppy.name, score: t.score })),
  };
}
