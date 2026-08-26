import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getCurrentConsent } from "@/lib/consent";
import {
  ADS_CONVERSION_DATALAYER_EVENT,
  clearPendingLeadConversion,
  readPendingLeadConversion,
  registerAdsAccount,
  rememberLeadConversion,
  trackAdsConversion,
  trackGenerateLead,
  trackLeadAdsConversion,
  trackWhatsAppAdsConversion,
} from "@/lib/conversions";
import { safePushToDataLayer } from "@/lib/tracking";

vi.mock("@/lib/consent", () => ({
  getCurrentConsent: vi.fn(),
}));

vi.mock("@/lib/tracking", () => ({
  safePushToDataLayer: vi.fn(),
}));

const consent = (marketing: boolean) => ({
  necessary: true,
  analytics: true,
  marketing,
  functional: true,
});

describe("conversões de lead", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentConsent).mockReturnValue(consent(true));
    registerAdsAccount({
      adsId: "AW-123456789",
      leadLabel: null,
      whatsappLabel: null,
      useGTM: false,
    });
  });

  afterEach(() => {
    delete (window as unknown as { gtag?: unknown }).gtag;
  });

  it("não envia nada sem consentimento de marketing", () => {
    const gtag = vi.fn();
    (window as unknown as { gtag: typeof gtag }).gtag = gtag;
    vi.mocked(getCurrentConsent).mockReturnValue(consent(false));

    expect(trackAdsConversion("lead-label")).toBe(false);
    expect(trackGenerateLead()).toBe(false);
    expect(gtag).not.toHaveBeenCalled();
    expect(safePushToDataLayer).not.toHaveBeenCalled();
  });

  it("não tenta conversão do Ads quando gtag não existe", () => {
    expect(trackAdsConversion("lead-label")).toBe(false);
    expect(safePushToDataLayer).not.toHaveBeenCalled();
  });

  it("envia valor em BRL e transaction_id para o Ads e dataLayer", () => {
    const gtag = vi.fn();
    (window as unknown as { gtag: typeof gtag }).gtag = gtag;

    expect(trackAdsConversion("lead-label", 150, "lead-42")).toBe(true);
    const payload = {
      send_to: "AW-123456789/lead-label",
      value: 150,
      currency: "BRL",
      transaction_id: "lead-42",
    };
    expect(gtag).toHaveBeenCalledWith("event", "conversion", payload);
    // O evento do dataLayer NÃO se chama "conversion": esse é o nome que o
    // modelo de tag do Ads no GTM traz sugerido como gatilho, e um container
    // montado no padrão reenviaria a mesma conversão que o gtag acabou de
    // mandar — dobrando o número no relatório.
    expect(safePushToDataLayer).toHaveBeenCalledWith(
      ADS_CONVERSION_DATALAYER_EVENT,
      payload,
    );
    expect(ADS_CONVERSION_DATALAYER_EVENT).not.toBe("conversion");
  });

  it("publica generate_lead mesmo sem label do Ads configurado", () => {
    expect(trackGenerateLead({ contexto: { lead_source: "formulario" } })).toBe(true);
    expect(safePushToDataLayer).toHaveBeenCalledWith("generate_lead", {
      lead_source: "formulario",
    });
  });

  it("usa o label registrado no admin e não duplica generate_lead", () => {
    const gtag = vi.fn();
    (window as unknown as { gtag: typeof gtag }).gtag = gtag;
    registerAdsAccount({ adsId: "AW-123456789", leadLabel: "label-do-admin" });

    expect(trackLeadAdsConversion({ transactionId: "lead-7" })).toBe(true);
    expect(gtag).toHaveBeenCalledWith("event", "conversion", {
      send_to: "AW-123456789/label-do-admin",
      transaction_id: "lead-7",
    });
    expect(safePushToDataLayer).not.toHaveBeenCalledWith(
      "generate_lead",
      expect.anything(),
    );
  });

  it("não dispara conversão de lead sem label configurado", () => {
    const gtag = vi.fn();
    (window as unknown as { gtag: typeof gtag }).gtag = gtag;

    expect(trackLeadAdsConversion({ transactionId: "lead-7" })).toBe(false);
    expect(gtag).not.toHaveBeenCalled();
  });
});

describe("conversão de clique no WhatsApp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentConsent).mockReturnValue(consent(true));
    registerAdsAccount({
      adsId: "AW-123456789",
      leadLabel: "label-de-lead",
      whatsappLabel: null,
      useGTM: false,
    });
  });

  afterEach(() => {
    delete (window as unknown as { gtag?: unknown }).gtag;
  });

  it("não dispara — nem reaproveita o label de lead — sem label próprio", () => {
    const gtag = vi.fn();
    (window as unknown as { gtag: typeof gtag }).gtag = gtag;

    expect(trackWhatsAppAdsConversion()).toBe(false);
    expect(gtag).not.toHaveBeenCalled();
    expect(safePushToDataLayer).not.toHaveBeenCalled();
  });

  it("dispara uma única vez, sem valor monetário — clique é lead, não venda", () => {
    const gtag = vi.fn();
    (window as unknown as { gtag: typeof gtag }).gtag = gtag;
    registerAdsAccount({ whatsappLabel: "label-do-whatsapp" });

    expect(trackWhatsAppAdsConversion()).toBe(true);

    const payload = { send_to: "AW-123456789/label-do-whatsapp" };
    expect(gtag).toHaveBeenCalledTimes(1);
    expect(gtag).toHaveBeenCalledWith("event", "conversion", payload);
    expect(safePushToDataLayer).toHaveBeenCalledTimes(1);
    expect(safePushToDataLayer).toHaveBeenCalledWith(
      ADS_CONVERSION_DATALAYER_EVENT,
      payload,
    );
    expect(payload).not.toHaveProperty("value");
  });

  // Rota única de envio: com container do GTM quem manda a conversão é a tag de
  // dentro do container. Chamar o gtag daqui TAMBÉM faria o mesmo clique virar
  // duas conversões — é o modo clássico de o Ads relatar o dobro.
  it("com GTM, publica no dataLayer e não chama o gtag do Ads", () => {
    const gtag = vi.fn();
    (window as unknown as { gtag: typeof gtag }).gtag = gtag;
    registerAdsAccount({ whatsappLabel: "label-do-whatsapp", useGTM: true });

    expect(trackWhatsAppAdsConversion()).toBe(true);
    expect(gtag).not.toHaveBeenCalled();
    expect(safePushToDataLayer).toHaveBeenCalledTimes(1);
  });
});

describe("marca de lead pendente para a página /obrigado", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("guarda e devolve o id do lead do envio atual", () => {
    rememberLeadConversion("lead-99");

    expect(readPendingLeadConversion()).toEqual({ id: "lead-99" });
  });

  it("devolve nulo quando não houve envio nesta visita", () => {
    expect(readPendingLeadConversion()).toBeNull();
  });

  it("aceita envio sem id, para o caso de a API não devolver o registro", () => {
    rememberLeadConversion(null);

    expect(readPendingLeadConversion()).toEqual({ id: null });
  });

  it("descarta marca com mais de 30 minutos", () => {
    sessionStorage.setItem(
      "bid_pending_lead",
      JSON.stringify({ id: "antigo", timestamp: Date.now() - 31 * 60 * 1000 }),
    );

    expect(readPendingLeadConversion()).toBeNull();
    expect(sessionStorage.getItem("bid_pending_lead")).toBeNull();
  });

  it("some depois de consumida, para o recarregamento não contar de novo", () => {
    rememberLeadConversion("lead-99");
    clearPendingLeadConversion();

    expect(readPendingLeadConversion()).toBeNull();
  });

  it("não lança quando o storage está bloqueado", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(() => rememberLeadConversion("lead-99")).not.toThrow();
  });
});
