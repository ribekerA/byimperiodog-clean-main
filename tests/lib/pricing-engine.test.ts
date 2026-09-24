import { beforeEach, describe, expect, it, vi } from "vitest";

const fixture = vi.hoisted(() => ({
  puppy: { id: "local-fixture", color: "branco", sex: "female", price_cents: 850000 },
}));
vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: () => ({
    from: (table: string) => {
      if (table !== "puppies") throw new Error("Não deve consultar leads ou gravar preços");
      const query = {
        select: () => query, eq: () => query,
        maybeSingle: async () => ({ data: fixture.puppy, error: null }),
      };
      return query;
    },
  }),
}));
import { precoDeCadastro } from "@/domain/pricing";
import { recalcPricingForPuppy } from "@/lib/ai/pricing-engine";

describe("admin usa referência oficial sem sobrescrever condição individual", () => {
  beforeEach(() => { fixture.puppy.color = "branco"; });
  it("ignora raridade, sazonalidade e preço antigo ao calcular referência", async () => {
    const result = await recalcPricingForPuppy("local-fixture");
    expect(result.price_ideal_cents).toBe(1050000);
    expect(result.prob_sale_at_current).toBeNull();
    expect(result.alert).toContain("Investigue uma condição individual");
    expect(fixture.puppy.price_cents).toBe(850000);
  });
  it("não inventa preço para uma combinação desconhecida", async () => {
    fixture.puppy.color = "desconhecido";
    await expect(recalcPricingForPuppy("local-fixture")).rejects.toThrow("sem preço oficial");
    expect(precoDeCadastro("branco", "unknown")).toBeNull();
    expect(precoDeCadastro("preto", "fêmea")).toBe(950000);
  });
});
