/** Referência comercial determinística. Não estima procura nem altera o cadastro. */
import { precoDeCadastro, CONDICOES_PAGAMENTO } from "@/domain/pricing";
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
  const official = precoDeCadastro(puppy.color, puppy.sex);
  if (official == null) throw new Error("Combinação sem preço oficial; consultar a responsável");
  return {
    price_min_cents: official,
    price_ideal_cents: official,
    price_max_cents: official,
    prob_sale_at_current: null,
    alert: puppy.price_cents === official ? "Preço cadastrado alinhado à tabela Pix." :
      "Preço cadastrado difere da tabela Pix. Investigue uma condição individual antes de alterar.",
    reasoning: "Referência da tabela oficial por cor e sexo, sem estimativa de venda ou desconto automático. " + CONDICOES_PAGAMENTO,
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
