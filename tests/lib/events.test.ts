import { beforeEach, describe, expect, it, vi } from "vitest";

import { getCurrentConsent } from "@/lib/consent";
import { isGoogleTagManagerEnabled } from "@/lib/conversions";
import { trackLeadFormSubmit } from "@/lib/events";
import { safePushToDataLayer } from "@/lib/tracking";

vi.mock("@/lib/consent", () => ({
  getCurrentConsent: vi.fn(),
}));

vi.mock("@/lib/conversions", () => ({
  isGoogleTagManagerEnabled: vi.fn(),
  trackWhatsAppAdsConversion: vi.fn(),
}));

vi.mock("@/lib/tracking", () => ({
  safePushToDataLayer: vi.fn(),
}));

describe("evento generate_lead", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentConsent).mockReturnValue({
      necessary: true,
      analytics: true,
      marketing: false,
      functional: true,
    });
  });

  it("publica um evento personalizado no dataLayer quando o GTM está ativo", () => {
    const gtag = vi.fn();
    (window as unknown as { gtag: typeof gtag }).gtag = gtag;
    vi.mocked(isGoogleTagManagerEnabled).mockReturnValue(true);

    trackLeadFormSubmit("lead-form-main", "lead-42");

    expect(safePushToDataLayer).toHaveBeenCalledWith(
      "generate_lead",
      {
        event_category: "conversion",
        event_label: "lead-form-main",
        lead_source: "formulario",
        transaction_id: "lead-42",
      },
      { mirrorPixels: false },
    );
    expect(gtag).not.toHaveBeenCalled();
  });

  it("usa gtag diretamente apenas quando não há GTM", () => {
    const gtag = vi.fn();
    (window as unknown as { gtag: typeof gtag }).gtag = gtag;
    vi.mocked(isGoogleTagManagerEnabled).mockReturnValue(false);

    trackLeadFormSubmit("ai-matchmaker");

    expect(gtag).toHaveBeenCalledWith("event", "generate_lead", {
      event_category: "conversion",
      event_label: "ai-matchmaker",
      lead_source: "ai_matchmaker",
    });
    expect(safePushToDataLayer).not.toHaveBeenCalled();
  });

  it("publica no GTM com consentimento somente de marketing", () => {
    vi.mocked(getCurrentConsent).mockReturnValue({
      necessary: true,
      analytics: false,
      marketing: true,
      functional: true,
    });
    vi.mocked(isGoogleTagManagerEnabled).mockReturnValue(true);

    trackLeadFormSubmit("lead-form-main", "lead-marketing");

    expect(safePushToDataLayer).toHaveBeenCalledWith(
      "generate_lead",
      expect.objectContaining({ transaction_id: "lead-marketing" }),
      { mirrorPixels: false },
    );
  });
});
