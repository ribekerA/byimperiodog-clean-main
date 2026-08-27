import { describe, expect, it } from "vitest";

import {
  resolveActiveEnvironment,
  type PixelsSettings,
} from "@/lib/pixels";

const emptyEnvironment = {
  gtmId: null,
  ga4Id: null,
  metaPixelId: null,
  tiktokPixelId: null,
  googleAdsId: null,
  googleAdsConversionLabel: null,
  googleAdsWhatsAppLabel: null,
  pinterestId: null,
  hotjarId: null,
  clarityId: null,
  metaDomainVerification: null,
  analyticsConsent: true,
  marketingConsent: true,
};

const settings: PixelsSettings = {
  id: "pixels",
  updated_at: null,
  production: { ...emptyEnvironment },
  staging: { ...emptyEnvironment },
};

describe("resolveActiveEnvironment", () => {
  it("usa NEXT_PUBLIC_GTM_ID como fallback quando o banco não tem contêiner", () => {
    const result = resolveActiveEnvironment(settings, {
      NODE_ENV: "development",
      NEXT_PUBLIC_GTM_ID: "GTM-NM5P94W8",
    });

    expect(result.config.gtmId).toBe("GTM-NM5P94W8");
  });

  it("mantém o contêiner do banco como fonte prioritária", () => {
    const result = resolveActiveEnvironment(
      {
        ...settings,
        production: { ...emptyEnvironment, gtmId: "GTM-BANCO1" },
      },
      {
        NODE_ENV: "production",
        NEXT_PUBLIC_GTM_ID: "GTM-AMBIENTE2",
      },
    );

    expect(result.config.gtmId).toBe("GTM-BANCO1");
  });

  it("ignora um fallback de GTM com caracteres não permitidos", () => {
    const result = resolveActiveEnvironment(settings, {
      NODE_ENV: "development",
      NEXT_PUBLIC_GTM_ID: "<script>alert(1)</script>",
    });

    expect(result.config.gtmId).toBeNull();
  });
});
