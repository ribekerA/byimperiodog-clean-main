import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Experiments from "../../app/(admin)/admin/(protected)/experiments/page";

describe("administração de experimentos", () => {
  beforeEach(() => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Banco indisponível" }), { status: 500 }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("distingue erro ao carregar de uma lista sem experimentos", async () => {
    render(<Experiments />);

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByText("Banco indisponível")).toBeTruthy();
    expect(screen.queryByText("Nenhum experimento criado ainda.")).toBeNull();
  });
});
