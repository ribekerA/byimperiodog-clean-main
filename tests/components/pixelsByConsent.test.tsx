/* eslint-disable @next/next/no-sync-scripts -- o script abaixo é somente o mock de next/script no DOM do teste */
import { cleanup, render } from "@testing-library/react";
import type React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import PixelsByConsent from "@/components/PixelsByConsent";
import { acceptAllConsent } from "@/lib/consent";

vi.mock("next/script", () => ({
  default: ({
    id,
    src,
    children,
  }: {
    id?: string;
    src?: string;
    children?: React.ReactNode;
  }) => (
    <script id={id} src={src} data-testid={id}>
      {children}
    </script>
  ),
}));

beforeEach(() => {
  localStorage.clear();
  acceptAllConsent();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("fonte única das tags Google", () => {
  it("com GTM renderiza um único loader e nenhum gtag direto", () => {
    const { container } = render(
      <PixelsByConsent
        isAdminRoute={false}
        useGTM
        GTM_ID="GTM-TESTE123"
        GA4_ID="G-TESTE12345"
        ADS_ID="AW-123456789"
        ADS_LABEL="lead-label"
        ADS_WHATSAPP_LABEL="whatsapp-label"
      />,
    );

    expect(container.querySelectorAll("#gtm-consent")).toHaveLength(1);
    expect(container.querySelector("#gtm-consent")?.textContent).toContain(
      "googletagmanager.com/gtm.js",
    );
    expect(container.querySelector("#ga4-src-consent")).toBeNull();
    expect(container.querySelector("#ga4-init-consent")).toBeNull();
    expect(container.querySelector("#google-ads-src")).toBeNull();
    expect(container.querySelector("#google-ads-init")).toBeNull();
  });

  it("sem consentimento não baixa GTM nem gtag", () => {
    localStorage.clear();

    const { container } = render(
      <PixelsByConsent
        isAdminRoute={false}
        useGTM
        GTM_ID="GTM-TESTE123"
        GA4_ID="G-TESTE12345"
        ADS_ID="AW-123456789"
      />,
    );

    expect(container.querySelectorAll("script")).toHaveLength(0);
  });
});
