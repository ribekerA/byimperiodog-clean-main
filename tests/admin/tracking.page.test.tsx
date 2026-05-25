/// <reference types="@testing-library/jest-dom" />
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import TrackingSettingsPage from "../../app/(admin)/admin/(protected)/settings/tracking/page";

type HookReturn = {
  values: { facebookPixelId: string; googleAnalyticsId: string };
  loading: boolean;
  saving: boolean;
  error: string | null;
  success: boolean;
  setValues: (updater: (prev: HookReturn["values"]) => HookReturn["values"]) => void;
  save: () => Promise<void>;
};

const hookMock = vi.fn<[], HookReturn>();

vi.mock("@/hooks/useTrackingSettings", () => ({
  useTrackingSettings: () => hookMock(),
}));

describe("Admin Tracking Settings Page", () => {
  beforeEach(() => {
    hookMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renderiza inputs com valores vindos do hook", () => {
    hookMock.mockReturnValue({
      values: { facebookPixelId: "1234567890", googleAnalyticsId: "G-ABC123" },
      loading: false,
      saving: false,
      error: null,
      success: false,
      setValues: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    });

    render(<TrackingSettingsPage />);

    expect(screen.getByLabelText(/Facebook Pixel ID/i)).toHaveValue("1234567890");
    expect(screen.getByLabelText(/Google Analytics ID/i)).toHaveValue("G-ABC123");
  });

  it("chama save ao clicar em Salvar configurações", async () => {
    const saveMock = vi.fn().mockResolvedValue(undefined);
    hookMock.mockReturnValue({
      values: { facebookPixelId: "", googleAnalyticsId: "" },
      loading: false,
      saving: false,
      error: null,
      success: false,
      setValues: vi.fn(),
      save: saveMock,
    });

    render(<TrackingSettingsPage />);
    fireEvent.click(screen.getByRole("button", { name: /salvar configurações/i }));
    await waitFor(() => {
      expect(saveMock).toHaveBeenCalled();
    });
  });

  it("desabilita o botão enquanto saving=true", () => {
    hookMock.mockReturnValue({
      values: { facebookPixelId: "", googleAnalyticsId: "" },
      loading: false,
      saving: true,
      error: null,
      success: false,
      setValues: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    });

    render(<TrackingSettingsPage />);
    expect(screen.getByRole("button", { name: /salvar configurações/i })).toBeDisabled();
  });

  it("botão Testar Pixel sem ID exibe mensagem de erro", async () => {
    hookMock.mockReturnValue({
      values: { facebookPixelId: "", googleAnalyticsId: "" },
      loading: false,
      saving: false,
      error: null,
      success: false,
      setValues: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    });

    render(<TrackingSettingsPage />);

    fireEvent.click(screen.getByRole("button", { name: /Testar Pixel/i }));
    expect(await screen.findByText(/Configure o Facebook Pixel ID antes de testar/i)).toBeInTheDocument();
  });

  it("botão Testar Pixel com ID chama fbq e mostra sucesso", async () => {
    const fbq = vi.fn();
    (globalThis as any).fbq = fbq;

    hookMock.mockReturnValue({
      values: { facebookPixelId: "1234567890", googleAnalyticsId: "" },
      loading: false,
      saving: false,
      error: null,
      success: false,
      setValues: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    });

    render(<TrackingSettingsPage />);

    fireEvent.click(screen.getByRole("button", { name: /Testar Pixel/i }));

    await waitFor(() => {
      expect(fbq).toHaveBeenCalledWith("track", "TestEvent", expect.any(Object));
    });
    expect(
      await screen.findByText(/Evento de teste enviado. Verifique no Meta Pixel Helper/i)
    ).toBeInTheDocument();
  });
});
