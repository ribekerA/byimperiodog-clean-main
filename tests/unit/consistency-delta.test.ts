import { describe, expect, it } from "vitest";

import {
  BUSINESS_ID,
  buildLocalBusinessLD,
  buildVitrinePageLD,
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

function vitrineComStatus(status: string) {
  const input = { ...puppyBase, status } as unknown as Parameters<typeof buildVitrinePageLD>[0];
  return buildVitrinePageLD(input) as Record<string, unknown>;
}

describe("delta de consistência interna", () => {
  // Este teste dizia o contrário até 26/08/2026: exigia `offers.availability:
  // InStock` para quem estivesse "available". A página de vitrine não é ficha
  // de produto — ela continua publicada depois que o filhote encontra a família
  // dele —, então Offer nenhuma pode sair dela, em nenhum status. O teste agora
  // reprova se alguém trouxer o Product de volta.
  it("a página de vitrine não emite Product nem Offer, em status nenhum", () => {
    for (const status of ["available", "reserved", "sold"]) {
      const ld = vitrineComStatus(status);
      expect(ld["@type"], `status ${status} emitiu ${String(ld["@type"])}`).not.toBe("Product");
      expect(ld, `status ${status} publicou Offer`).not.toHaveProperty("offers");
      expect(JSON.stringify(ld), `status ${status} publicou InStock`).not.toContain("InStock");
      expect(ld, `status ${status} publicou nota agregada`).not.toHaveProperty("aggregateRating");
    }
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
