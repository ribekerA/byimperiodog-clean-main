import { act, cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import WhatsAppClickTracker from "@/components/tracking/WhatsAppClickTracker";
import { acceptAllConsent, rejectAllConsent } from "@/lib/consent";
import { registerAdsAccount } from "@/lib/conversions";
import { WHATSAPP_NUMBER } from "@/lib/whatsapp";

// Componentes compilados com o runtime classico procuram React no escopo global.
(globalThis as unknown as { React?: typeof React }).React = React;

const LINK_DO_CANIL = `https://wa.me/${WHATSAPP_NUMBER}?text=Ol%C3%A1`;

/**
 * O teste que existe para impedir a conversão dobrada.
 *
 * O Google Ads relatar duas conversões para o mesmo toque é um erro caro e
 * silencioso: o Lances Inteligentes passa a achar que o clique converte o dobro
 * e gasta mais por ele. As causas clássicas são todas de código — onClick de
 * medição somado a um ouvinte global, componente pai e filho medindo o mesmo
 * clique, gtag disparando junto com uma tag do GTM. Por isso aqui não se checa
 * "o evento saiu": checa-se QUANTAS VEZES saiu.
 */
let chamadasGtag: Array<{ nome: string; params: Record<string, unknown> }> = [];

function eventos(nome: string) {
  return chamadasGtag.filter((c) => c.nome === nome);
}

function impedirNavegacao(evento: Event) {
  evento.preventDefault();
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  chamadasGtag = [];

  (window as unknown as { gtag: (...args: unknown[]) => void }).gtag = (
    ...args: unknown[]
  ) => {
    if (args[0] === "event") {
      chamadasGtag.push({
        nome: String(args[1]),
        params: (args[2] ?? {}) as Record<string, unknown>,
      });
    }
  };

  acceptAllConsent();
  registerAdsAccount({
    adsId: "AW-123456789",
    leadLabel: "label-de-lead",
    whatsappLabel: "label-do-whatsapp",
    useGTM: false,
  });

  // Sem isto o ambiente de teste tenta navegar de verdade ao clicar no <a>.
  document.addEventListener("click", impedirNavegacao);
});

afterEach(() => {
  document.removeEventListener("click", impedirNavegacao);
  cleanup();
  delete (window as unknown as { gtag?: unknown }).gtag;
  registerAdsAccount({ adsId: null, leadLabel: null, whatsappLabel: null, useGTM: false });
});

describe("medição de clique em WhatsApp", () => {
  it("A — abrir a página não converte nada", () => {
    render(
      <>
        <WhatsAppClickTracker />
        <a href={LINK_DO_CANIL} data-wa-placement="hero">
          Fale pelo WhatsApp
        </a>
      </>,
    );

    expect(chamadasGtag).toHaveLength(0);
  });

  it("B — um clique no CTA principal = 1 evento GA4 + 1 conversão do Ads", () => {
    const { getByText } = render(
      <>
        <WhatsAppClickTracker />
        <a href={LINK_DO_CANIL} data-wa-placement="hero">
          Fale pelo WhatsApp
        </a>
      </>,
    );

    getByText("Fale pelo WhatsApp").click();

    expect(eventos("whatsapp_click")).toHaveLength(1);
    expect(eventos("conversion")).toHaveLength(1);
    expect(eventos("whatsapp_click")[0].params).toMatchObject({
      placement: "hero",
      page_path: "/",
      campaign_context: "direct",
    });
    expect(eventos("conversion")[0].params).toEqual({
      send_to: "AW-123456789/label-do-whatsapp",
    });
  });

  it("C — clicar no ícone dentro do link não conta duas vezes", () => {
    const { getByTestId } = render(
      <>
        <WhatsAppClickTracker />
        <a href={LINK_DO_CANIL} data-wa-placement="footer">
          <span data-testid="icone">ícone</span> Fale pelo WhatsApp
        </a>
      </>,
    );

    getByTestId("icone").click();

    expect(eventos("whatsapp_click")).toHaveLength(1);
    expect(eventos("whatsapp_click")[0].params).toMatchObject({ placement: "footer" });
  });

  // Vários cards de filhote chamam stopPropagation para o clique no botão não
  // abrir o modal. Na fase de borbulha isso mataria a medição em silêncio.
  it("D — stopPropagation do card não apaga a medição", () => {
    const { getByText } = render(
      <>
        <WhatsAppClickTracker />
        <div onClick={(e) => e.stopPropagation()}>
          <a
            href={LINK_DO_CANIL}
            data-wa-placement="puppy_card"
            data-wa-puppy="spitz-alemao-anao-branco-femea"
            onClick={(e) => e.stopPropagation()}
          >
            Consulte disponibilidade
          </a>
        </div>
      </>,
    );

    getByText("Consulte disponibilidade").click();

    expect(eventos("whatsapp_click")).toHaveLength(1);
    expect(eventos("whatsapp_click")[0].params).toMatchObject({
      placement: "puppy_card",
      puppy_slug: "spitz-alemao-anao-branco-femea",
    });
  });

  it("E — botão flutuante (não é <a>) conta uma vez por clique real", () => {
    const { getByText } = render(
      <>
        <WhatsAppClickTracker />
        <button type="button" data-wa-cta="true" data-wa-placement="floating_button">
          WhatsApp
        </button>
      </>,
    );

    getByText("WhatsApp").click();
    expect(eventos("whatsapp_click")).toHaveLength(1);

    getByText("WhatsApp").click();
    expect(eventos("whatsapp_click")).toHaveLength(2);
  });

  // Compartilhar um artigo não é iniciar atendimento: contar isso como conversão
  // encheria o Ads de gente que nunca falou com o canil.
  it("F — link de compartilhamento (wa.me sem número) não converte", () => {
    const { getByText } = render(
      <>
        <WhatsAppClickTracker />
        <a href="https://wa.me/?text=veja%20esse%20artigo">Compartilhar</a>
        <a href="/filhotes">Ver filhotes</a>
      </>,
    );

    getByText("Compartilhar").click();
    getByText("Ver filhotes").click();

    expect(chamadasGtag).toHaveLength(0);
  });

  it("G — sem consentimento nada é medido", () => {
    rejectAllConsent();

    const { getByText } = render(
      <>
        <WhatsAppClickTracker />
        <a href={LINK_DO_CANIL} data-wa-placement="hero">
          Fale pelo WhatsApp
        </a>
      </>,
    );

    getByText("Fale pelo WhatsApp").click();

    expect(chamadasGtag).toHaveLength(0);
  });

  it("H — reconhece a origem de campanha sem carregar o gclid", () => {
    window.history.replaceState({}, "", "/?gclid=EAIaIQobChMI-exemplo");

    const { getByText } = render(
      <>
        <WhatsAppClickTracker />
        <a href={LINK_DO_CANIL} data-wa-placement="hero">
          Fale pelo WhatsApp
        </a>
      </>,
    );

    getByText("Fale pelo WhatsApp").click();
    window.history.replaceState({}, "", "/");

    const [evento] = eventos("whatsapp_click");
    expect(evento.params.campaign_context).toBe("google_ads");
    expect(JSON.stringify(evento.params)).not.toContain("EAIaIQobChMI");
  });

  it("I — nenhum parâmetro carrega dado pessoal", () => {
    const { getByText } = render(
      <>
        <WhatsAppClickTracker />
        <a href={LINK_DO_CANIL} data-wa-placement="contact_section">
          Fale pelo WhatsApp
        </a>
      </>,
    );

    getByText("Fale pelo WhatsApp").click();

    const chaves = Object.keys(eventos("whatsapp_click")[0].params).sort();
    expect(chaves).toEqual([
      "campaign_context",
      "page_path",
      "page_title",
      "placement",
    ]);
  });
});

/**
 * O teste E acima usa um <button data-wa-cta> montado à mão, e por isso não
 * pegou o defeito real: o <WhatsAppFloat> de verdade media por conta própria.
 * Um toque saía como DOIS eventos de nomes diferentes — `whatsapp_click`, do
 * ouvinte delegado, e `lead_whatsapp`, do próprio componente. Marcar os dois
 * como conversão contaria uma pessoa como duas, e o segundo nome ainda
 * chamava de "lead" o que é apenas um clique.
 *
 * Aqui o componente real entra em cena. A regra que este bloco protege: quem
 * carrega `data-wa-cta` não mede nada sozinho — quem mede é o ouvinte.
 */
describe("botão flutuante real — um toque, um evento", () => {
  it("não emite nenhum evento próprio além do whatsapp_click do ouvinte", async () => {
    const { default: WhatsAppFloat } = await import("@/components/WhatsAppFloat");
    const abrir = vi.fn();
    vi.stubGlobal("open", abrir);

    const { container } = render(
      <>
        <WhatsAppClickTracker />
        <WhatsAppFloat />
      </>,
    );

    // O botão só aparece 3 s depois da carga, de propósito: entrar antes
    // mexeria no CLS. Sem avançar o relógio não há o que clicar.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 3200));
    });

    const botao = container.querySelector<HTMLElement>('[data-wa-cta="true"]');
    expect(botao).not.toBeNull();

    botao!.click();

    // Um toque = um evento de GA4 + uma conversão do Ads. Nada além disso:
    // qualquer terceiro evento aqui é o mesmo toque contado de novo.
    expect(eventos("whatsapp_click")).toHaveLength(1);
    expect(eventos("whatsapp_click")[0].params.placement).toBe("floating_button");
    expect(eventos("conversion")).toHaveLength(1);
    expect(chamadasGtag).toHaveLength(2);

    // Os nomes que confundiam clique com lead não podem voltar.
    expect(eventos("lead_whatsapp")).toHaveLength(0);
    expect(eventos("wa_float_click")).toHaveLength(0);

    // O atendimento continua abrindo: medição não pode ter engolido o clique.
    expect(abrir).toHaveBeenCalledTimes(1);

    vi.unstubAllGlobals();
  });
});
