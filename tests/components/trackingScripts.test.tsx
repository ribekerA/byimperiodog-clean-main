import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import TrackingScripts from "@/components/TrackingScripts";

const mocks = vi.hoisted(() => ({
  isGoogleTagManagerEnabled: vi.fn(),
}));

vi.mock("@/lib/analytics", () => ({
  initWebVitals: vi.fn(),
  logEvent: vi.fn(),
}));

vi.mock("@/lib/consent", () => ({
  getCurrentConsent: () => ({ analytics: true, marketing: false }),
}));

vi.mock("@/lib/conversions", () => ({
  isGoogleTagManagerEnabled: mocks.isGoogleTagManagerEnabled,
}));

vi.mock("@/lib/tracking", () => ({
  isAdminRoute: () => false,
}));

beforeEach(() => {
  mocks.isGoogleTagManagerEnabled.mockReset();
  (window as typeof window & { gtag?: ReturnType<typeof vi.fn> }).gtag = vi.fn();
});

afterEach(() => {
  cleanup();
  delete (window as typeof window & { gtag?: ReturnType<typeof vi.fn> }).gtag;
});

describe("page_view em navegação SPA", () => {
  it("deixa o History Change do GTM como fonte única quando o contêiner está ativo", () => {
    mocks.isGoogleTagManagerEnabled.mockReturnValue(true);
    render(<TrackingScripts />);

    act(() => window.dispatchEvent(new PopStateEvent("popstate")));

    expect((window as typeof window & { gtag: ReturnType<typeof vi.fn> }).gtag).not.toHaveBeenCalled();
  });

  it("mantém o fallback do gtag quando o GTM está desativado", () => {
    mocks.isGoogleTagManagerEnabled.mockReturnValue(false);
    render(<TrackingScripts />);

    act(() => window.dispatchEvent(new PopStateEvent("popstate")));

    expect((window as typeof window & { gtag: ReturnType<typeof vi.fn> }).gtag).toHaveBeenCalledWith(
      "event",
      "page_view",
      expect.objectContaining({ page_path: window.location.pathname }),
    );
  });
});
