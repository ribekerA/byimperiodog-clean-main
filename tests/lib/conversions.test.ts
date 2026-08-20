import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getCurrentConsent } from "@/lib/consent";
import {
  clearPendingLeadConversion,
  readPendingLeadConversion,
  registerAdsAccount,
  rememberLeadConversion,
  trackAdsConversion,
  trackGenerateLead,
  trackLeadAdsConversion,
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
    registerAdsAccount({ adsId: "AW-123456789", leadLabel: null });
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
    expect(safePushToDataLayer).toHaveBeenCalledWith("conversion", payload);
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
