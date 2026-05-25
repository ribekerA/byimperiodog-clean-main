/**
 * PricingAIEngine
 * Heurística inicial + placeholders para regressão futura.
 */
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type PuppyRow = {
  id: string;
  name: string;
  price_cents?: number | null;
  color?: string | null;
  sex?: string | null;
  birth_date?: string | null;
  status?: string | null;
};

type LeadRow = {
  id: string;
  cor_preferida?: string | null;
  sexo_preferido?: string | null;
  page_slug?: string | null;
  status?: string | null;
};

type PricingResult = {
  price_min_cents: number;
  price_ideal_cents: number;
  price_max_cents: number;
  prob_sale_at_current: number;
  alert: string;
  reasoning: string;
};

const RARE_COLORS = ["particolor", "sable", "blue merle", "exotic"];

function normalize(text?: string | null) {
  return (text ?? "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function monthsSince(date?: string | null) {
  if (!date) return 0;
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  return diff / (1000 * 60 * 60 * 24 * 30);
}

export async function recalcPricingForPuppy(puppyId: string): Promise<PricingResult> {
  const sb = supabaseAdmin();
  const { data: puppy } = await sb
    .from("puppies")
    .select("id,name,price_cents,color,sex,birth_date,status")
    .eq("id", puppyId)
    .maybeSingle();
  if (!puppy) throw new Error("Puppy não encontrado");

  const { data: leads } = await sb
    .from("leads")
    .select("id,cor_preferida,sexo_preferido,page_slug,status")
    .or(`page_slug.eq.${puppyId},page_slug.eq.${puppy.name || ""}`)
    .limit(200);

  const { data: sales } = await sb
    .from("puppies")
    .select("price_cents,color,sex,status,birth_date")
    .eq("status", "sold")
    .limit(200);

  const basePrice = puppy.price_cents ?? 600000; // fallback 6k
  const ageMonths = monthsSince(puppy.birth_date);
  const isRareColor = RARE_COLORS.some((c) => normalize(puppy.color).includes(c));

  // Heurísticas simples
  let ideal = basePrice;
  let min = Math.round(basePrice * 0.9);
  let max = Math.round(basePrice * 1.1);
  const reasons: string[] = [];

  // Raridade da cor
  if (isRareColor) {
    ideal = Math.round(ideal * 1.08);
    max = Math.round(max * 1.12);
    reasons.push("Cor rara: aumento de 8–12%.");
  }

  // Idade: quanto mais velho, mais desconto
  if (ageMonths > 4) {
    ideal = Math.round(ideal * 0.92);
    min = Math.round(min * 0.9);
    reasons.push("Idade >4 meses: ajuste para vender mais rápido.");
  }

  // Interesse (leads) e conversão
  const interested = (leads ?? []).length;
  const conversions = (leads ?? []).filter((l: { status?: string | null }) => l.status === "fechado").length;
  const convRate = interested > 0 ? conversions / interested : 0;
  if (interested > 8 && convRate < 0.1) {
    ideal = Math.round(ideal * 0.95);
    reasons.push("Muito interesse, pouca conversão: reduzir 5%.");
  } else if (interested < 3 && convRate > 0.25) {
    ideal = Math.round(ideal * 1.03);
    reasons.push("Boa conversão e pouco interesse: pequeno aumento.");
  }

  // Sazonalidade (placeholder: leve ajuste)
  const month = new Date().getMonth() + 1;
  if ([11, 12, 1].includes(month)) {
    ideal = Math.round(ideal * 1.05);
    reasons.push("Sazonalidade (fim/início de ano): +5%.");
  }

  min = Math.min(min, ideal);
  max = Math.max(max, ideal);

  // Probabilidade de venda no preço atual (heurística)
  const current = puppy.price_cents ?? ideal;
  let prob = 0.6;
  if (current > ideal * 1.1) prob = 0.35;
  else if (current < min) prob = 0.8;

  // Alerta
  const alert =
    current > max
      ? "Preço acima do recomendado; risco de perder leads."
      : current < min
        ? "Preço abaixo do recomendado; verificar margem."
        : "Preço dentro da faixa sugerida.";

  const reasoning = reasons.join(" ");

  // Persistir
  const payload = {
    puppy_id: puppy.id,
    price_min_cents: min,
    price_ideal_cents: ideal,
    price_max_cents: max,
    prob_sale_at_current: prob,
    alert,
    reasoning,
    features: {
      basePrice,
      ageMonths,
      isRareColor,
      interested,
      conversions,
      convRate,
      month,
    },
    computed_at: new Date().toISOString(),
  };

  const { error } = await sb.from("puppy_pricing_ai").upsert(payload, { onConflict: "puppy_id" });
  if (error) throw error;

  return {
    price_min_cents: min,
    price_ideal_cents: ideal,
    price_max_cents: max,
    prob_sale_at_current: prob,
    alert,
    reasoning,
  };
}

export async function recalcPricingBulk() {
  const sb = supabaseAdmin();
  const { data: puppies } = await sb
    .from("puppies")
    .select("id")
    .or("status.is.null,status.eq.available,status.eq.coming_soon")
    .limit(200);
  if (!puppies) return [];
  const results: Record<string, any> = {};
  for (const p of puppies) {
    try {
      results[p.id] = await recalcPricingForPuppy(p.id);
    } catch (e) {
      results[p.id] = { error: String(e) };
    }
  }
  return results;
}
