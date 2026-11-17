import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { BRAND, DELIVERY_POLICY_COPY, FOUNDING_YEAR } from "../../src/domain/config";
import { FAIXA_PUBLICA_TEXTO } from "../../src/domain/pricing";
import { buildLocalBusinessLD, buildVisibleFAQPageLD } from "../../src/lib/structured-data";
import { SITE_ORIGIN } from "../../src/lib/seo.core";

describe("identidade pública e SEO da By Império Dog", () => {
  const org = buildLocalBusinessLD();

  it("usa identidade e contato centralizados", () => {
    expect(BRAND.name).toBe("By Império Dog");
    expect(BRAND.headquarters.city).toBe("Bragança Paulista");
    expect(BRAND.headquarters.state).toBe("SP");
    expect(BRAND.contact.phone).toBe("+55 11 96863-3239");
    expect(org.email).toBe(BRAND.contact.email);
    expect(org.telephone).toBe(BRAND.contact.phone);
    expect(org.foundingDate).toBe(String(FOUNDING_YEAR));
  });

  it("declara a faixa comercial central, sem inventar endereço", () => {
    expect(org.priceRange).toBe(FAIXA_PUBLICA_TEXTO);
    expect("address" in org).toBe(false);
    expect(JSON.stringify(org)).not.toContain("01000-000");
    expect(org.areaServed.length).toBeGreaterThan(0);
  });

  it("usa domínio canônico sem www", () => {
    expect(SITE_ORIGIN).toBe("https://byimperiodog.com.br");
    expect(BRAND.urls.site).toBe(SITE_ORIGIN);
    const netlify = readFileSync(join(process.cwd(), "netlify.toml"), "utf8");
    expect(netlify).toContain('from = "https://www.byimperiodog.com.br/*"');
    expect(netlify).toContain('to = "https://byimperiodog.com.br/:splat"');
  });

  it("não apresenta rede social sem URL confirmada", () => {
    expect(org.sameAs).toEqual(BRAND.schema.sameAs);
    expect(org.sameAs).toContain(BRAND.urls.googleMapsProfile);
  });

  it("só permite FAQ estruturado com perguntas e respostas", () => {
    const faq = buildVisibleFAQPageLD("/filhotes/spitz-alemao-anao-preto-macho", [
      { question: "Como confirmar a entrega?", answer: DELIVERY_POLICY_COPY },
    ]);
    expect(faq["@type"]).toBe("FAQPage");
    expect(faq.mainEntity[0].acceptedAnswer.text).toBe(DELIVERY_POLICY_COPY);
  });

  it("não duplica Organization no contato", () => {
    const source = readFileSync(join(process.cwd(), "app/(public)/contato/page.tsx"), "utf8");
    expect(source).not.toContain('id="ld-org-contato"');
  });
});
