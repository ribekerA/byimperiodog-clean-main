import { describe, expect, it } from "vitest";

import { puppiesPublicados } from "@/content/puppies-static";
import { buildWhatsAppLink, generateWhatsAppMessage } from "@/lib/whatsapp";

describe("mensagens comerciais do WhatsApp", () => {
  it("nao injeta referencia interna no link", () => {
    const link = buildWhatsAppLink({
      message: "Olá! Quero conhecer as opções atuais.",
      utmSource: "site",
      utmMedium: "test",
      utmCampaign: "regressao",
    });

    expect(decodeURIComponent(link)).not.toMatch(/\[ref:/i);
    expect(new URL(link).searchParams.get("text")).toBe(
      "Olá! Quero conhecer as opções atuais.",
    );
  });

  it("usa valor exato e evita falsa escassez em todos os filhotes publicados", () => {
    for (const filhote of puppiesPublicados) {
      const payload = generateWhatsAppMessage(
        { nome: "Cliente" },
        {
          name: filhote.name,
          color: filhote.color,
          price_cents: filhote.priceCents,
        },
      );
      const textos = [payload.message, ...payload.variations, payload.strategy].join("\n");

      expect(textos).not.toMatch(/\[ref:/i);
      expect(textos).not.toMatch(/a partir de/i);
      expect(textos).not.toMatch(/reservad[oa] para voc[eê]|apenas hoje|[uú]ltima agenda/i);
    }
  });
});
