import { describe, expect, it } from "vitest";

import {
  BUSINESS_ID,
  buildLocalBusinessLD,
  buildPuppyProductLD,
} from "@/lib/structured-data";
import { buildOrganizationLD, buildWebsiteLD } from "@/lib/tracking";

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
    const organization = buildOrganizationLD("https://dominio-antigo.invalid");

    expect(BUSINESS_ID).toBe("https://byimperiodog.com.br/#business");
    expect(organization["@id"]).toBe(BUSINESS_ID);
    expect(organization.description).toBe(business.description);
    expect(organization.sameAs).toEqual(business.sameAs);
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
