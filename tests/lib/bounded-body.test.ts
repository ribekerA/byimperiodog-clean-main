// @vitest-environment node
import { describe, expect, it } from "vitest";

import { BodyTooLargeError, readBoundedBody } from "@/lib/bounded-body";
import { corpoJson } from "@/lib/limitePublico";

describe("teto real de corpo HTTP", () => {
  it("lê corpo válido sem Content-Length", async () => {
    const req = new Request("https://example.test", { method: "POST", body: "ok" });
    expect(new TextDecoder().decode(await readBoundedBody(req, 2))).toBe("ok");
  });
  it("interrompe stream acima do limite e não confia em tamanho declarado menor", async () => {
    const req = new Request("https://example.test", { method: "POST", body: "grande demais", headers: { "content-length": "1" } });
    await expect(readBoundedBody(req, 4)).rejects.toBeInstanceOf(BodyTooLargeError);
  });
  it("mede bytes UTF-8, não apenas caracteres", async () => {
    const req = new Request("https://example.test", { method: "POST", body: '"ééé"' });
    expect((await corpoJson(req, 6)).resposta?.status).toBe(413);
  });
  it("recusa comprimento declarado excessivo antes da leitura", async () => {
    const req = new Request("https://example.test", { method: "POST", body: "ok", headers: { "content-length": "1000" } });
    await expect(readBoundedBody(req, 10)).rejects.toThrow("Envio grande demais");
    expect(req.bodyUsed).toBe(false);
  });
});
