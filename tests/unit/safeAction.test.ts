import { describe, expect, it } from "vitest";
import { z } from "zod";

import { AppError } from "@/lib/errors";
import { safeAction } from "@/lib/safeAction";

const schema = z.object({
  nome: z.string().min(1),
});

describe("safeAction", () => {
  it("retorna resultado quando dados validos sao enviados", async () => {
    const handler = safeAction({
      schema,
      handler: async (payload) => payload.nome.toUpperCase(),
    });

    const request = new Request("http://localhost/test", {
      method: "POST",
      body: JSON.stringify({ nome: "ana" }),
      headers: { "content-type": "application/json" },
    });

    await expect(handler(request)).resolves.toBe("ANA");
  });

  it("lança AppError quando payload é invalido", async () => {
    const handler = safeAction({
      schema,
      handler: async () => "ok",
    });

    const request = new Request("http://localhost/test", {
      method: "POST",
      body: JSON.stringify({ nome: "" }),
      headers: { "content-type": "application/json" },
    });

    await expect(handler(request)).rejects.toBeInstanceOf(AppError);
  });
});

