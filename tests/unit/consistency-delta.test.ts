import { describe, expect, it } from "vitest";

import {
  BUSINESS_ID,
  buildLocalBusinessLD,
  buildPuppyProductLD,
} from "@/lib/structured-data";
import * as tracking from "@/lib/tracking";
import { buildWebsiteLD } from "@/lib/tracking";

const puppyBase = {
  slug: "luna",
  name: "Luna",
  description: "Spitz Alemão Anão",
  images: ["/filhotes/luna.jpg"],
  price_cents: 650000,
};

function productWithStatus(status: string) {
  const input = { ...puppyBase, status } as unknown as Parameters<typeof buildPuppyProductLD>[0];
  return buildPuppyProductLD(input);
}

describe("delta de consistência interna", () => {
  it("emite Offer apenas para filhote disponível", () => {
    expect(productWithStatus("available")).toHaveProperty("offers.availability", "https://schema.org/InStock");
    expect(productWithStatus("reserved")).not.toHaveProperty("offers");
    expect(productWithStatus("sold")).not.toHaveProperty("offers");
  });

  it("mantém uma entidade canônica e fatos geográficos mínimos", () => {
    const business = buildLocalBusinessLD();

    expect(BUSINESS_ID).toBe("https://byimperiodog.com.br/#business");
    expect(business["@id"]).toBe(BUSINESS_ID);

    // Havia dois nós declarando o MESMO @id com fatos diferentes: este e um
    // buildOrganizationLD() em src/lib/tracking.ts. Nó com @id igual e campo
    // divergente não funde — vira aviso de campo duplicado no Search Console.
    // Se alguém recriar aquela função, este teste cai.
    expect(tracking).not.toHaveProperty("buildOrganizationLD");

    expect(business.areaServed).toEqual([{ "@type": "Country", name: "Brasil" }]);
    expect(business).not.toHaveProperty("serviceArea");
    expect(business.address).toEqual({
      "@type": "PostalAddress",
      addressLocality: "Bragança Paulista",
      addressRegion: "SP",
      addressCountry: "BR",
    });
  });

  it("não aceita domínio alternativo no WebSite ou publisher", () => {
    const website = buildWebsiteLD("https://dominio-antigo.invalid");
    expect(website.url).toBe("https://byimperiodog.com.br/");
    expect(website.publisher).toEqual({ "@id": BUSINESS_ID });
  });
});
