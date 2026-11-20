import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import SystemHealthPage from "../../app/(admin)/admin/(protected)/system/health/page";

describe("saúde do sistema", () => {
  beforeEach(() => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Banco indisponível" }), { status: 500 }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("não transforma falha da API em sistema saudável", async () => {
    render(<SystemHealthPage />);

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByText(/Banco indisponível/)).toBeTruthy();
    expect(screen.queryByText("Sistema saudável")).toBeNull();
  });
});
