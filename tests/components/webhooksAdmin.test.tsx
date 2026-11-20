import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import WebhooksPage from "../../app/(admin)/admin/(protected)/webhooks/page";

describe("administração de webhooks", () => {
  beforeEach(() => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Banco indisponível" }), { status: 500 }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("não transforma falha da API em lista vazia", async () => {
    render(<WebhooksPage />);

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByText(/Banco indisponível/)).toBeTruthy();
    expect(screen.queryByText("Nenhum webhook configurado")).toBeNull();
  });
});
