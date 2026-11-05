/** Referência comercial determinística. Não estima procura nem altera o cadastro. */
import { statusOrFilter } from "@/domain/puppy-status";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type PricingResult = {
  price_min_cents: number;
  price_ideal_cents: number;
  price_max_cents: number;
  prob_sale_at_current: null;
  alert: string;
  reasoning: string;
};

export async function recalcPricingForPuppy(puppyId: string): Promise<PricingResult> {
  const sb = supabaseAdmin();
  const { data: puppy, error } = await sb.from("puppies")
    .select("id,price_cents,color,sex").eq("id", puppyId).maybeSingle();
  if (error || !puppy) throw new Error("Não foi possível consultar o cadastro");
  const official = puppy.price_cents;
  if (!Number.isSafeInteger(official) || official <= 0) throw new Error("Cadastro sem preço individual válido; consultar a responsável");
  return {
    price_min_cents: official,
    price_ideal_cents: official,
    price_max_cents: official,
    prob_sale_at_current: null,
    alert: "Preço individual preservado. Qualquer alteração precisa ser confirmada pela responsável.",
    reasoning: "Valor do próprio cadastro, sem inferência por cor ou sexo, estimativa de venda, desconto ou condição de pagamento automática.",
  };
}

export async function recalcPricingBulk() {
  const sb = supabaseAdmin();
  const { data: puppies, error } = await sb.from("puppies").select("id")
    .or(statusOrFilter(["available", "coming_soon"], { incluirNulo: true })).limit(200);
  if (error) throw new Error("Não foi possível consultar os cadastros");
  const results: Record<string, PricingResult | { error: string }> = {};
  for (const puppy of puppies ?? []) {
    try { results[puppy.id] = await recalcPricingForPuppy(puppy.id); }
    catch { results[puppy.id] = { error: "Referência indisponível; conferir cor, sexo e acesso ao cadastro." }; }
  }
  return results;
}
