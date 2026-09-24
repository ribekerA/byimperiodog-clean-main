// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

import {
  contractCanBeFilled, validContractCode, validateContractFile, contractUploadPath, readContractForm,
  CONTRACT_MAX_FILE_BYTES,
} from "@/lib/contract-security";

const code = "A".repeat(32);
describe("contrato privado e upload", () => {
  it("recusa códigos enumeráveis e traversal", () => {
    for (const invalid of ["1", "2", "nome", "../secret", "A".repeat(100), "a".repeat(32)]) {
      expect(validContractCode(invalid)).toBe(false);
    }
    expect(validContractCode(code)).toBe(true);
    expect(validContractCode("B".repeat(12))).toBe(true);
  });
  it("somente pendente com expiração futura pode receber dados", () => {
    const now = Date.parse("2026-09-14T00:00:00Z");
    expect(contractCanBeFilled({ status: "pendente", expires_at: "2026-09-15" }, now)).toBe(true);
    for (const status of ["assinado", "cancelado", "unknown"]) {
      expect(contractCanBeFilled({ status, expires_at: "2026-09-15" }, now)).toBe(false);
    }
    for (const expires_at of [undefined, null, "", "inválido", "2026-09-13", "2026-09-14"]) {
      expect(contractCanBeFilled({ status: "pendente", expires_at }, now)).toBe(false);
    }
  });
  it("não confia no MIME nem aceita SVG/HTML como imagem", async () => {
    const unsafe = Buffer.from('<svg><script>alert(1)</script></svg>');
    await expect(validateContractFile(unsafe, "image/png")).rejects.toThrow();
    await expect(validateContractFile(unsafe, "image/svg+xml")).rejects.toThrow();
    await expect(validateContractFile(Buffer.from("<html>"), "application/pdf")).rejects.toThrow();
    await expect(validateContractFile(Buffer.alloc(CONTRACT_MAX_FILE_BYTES + 1), "image/png")).rejects.toThrow();
  });
  it("decodifica e reencoda imagens válidas, inclusive assinatura", async () => {
    const png = await sharp({ create: { width: 8, height: 8, channels: 3, background: "white" } }).png().toBuffer();
    const validated = await validateContractFile(png, "image/png", true);
    expect(validated.contentType).toBe("image/png");
    expect((await sharp(validated.buffer).metadata()).format).toBe("png");
    await expect(validateContractFile(png, "image/jpeg")).rejects.toThrow();
  });
  it("aceita PDF válido e bloqueia JavaScript no PDF", async () => {
    const pdf = await PDFDocument.create();
    pdf.addPage();
    const clean = await validateContractFile(Buffer.from(await pdf.save()), "application/pdf");
    expect(clean.extension).toBe("pdf");
    pdf.addJavaScript("autostart", "app.alert('not allowed')");
    await expect(validateContractFile(Buffer.from(await pdf.save()), "application/pdf")).rejects.toThrow();
  });
  it("usa caminhos aleatórios gerados pelo servidor e bloqueia campos externos", () => {
    const first = contractUploadPath(code, "assinatura", "png");
    expect(first).toMatch(new RegExp("^" + code + "/assinatura-[a-f0-9-]+\\.png$"));
    expect(first).not.toBe(contractUploadPath(code, "assinatura", "png"));
    expect(() => contractUploadPath(code, "../foo", "png")).toThrow();
    expect(() => contractUploadPath(code, "laudo", "html")).toThrow();
  });
  it("limita o corpo do envio antes de ler formData", async () => {
    const req = new Request("https://example.test/api/contract", {
      method: "POST", body: "oversize", headers: { "content-length": String(30 * 1024 * 1024) },
    });
    await expect(readContractForm(req)).rejects.toThrow("Envio grande demais");
  });
  it("contratos têm root sem tags, documento exige autorização antes de buscar", () => {
    const layout = readFileSync(resolve("app/(private)/layout.tsx"), "utf8");
    expect(layout).not.toMatch(/import .*Pixels|import .*Tracking|import .*Attribution/);
    expect(layout).toContain('referrer: "no-referrer"');
    const doc = readFileSync(resolve("app/(private)/contract/[code]/documento/page.tsx"), "utf8");
    const guard = doc.indexOf('await requireAdminLayout({ permission: "cadastros:read" })');
    expect(guard).toBeGreaterThan(-1);
    expect(guard).toBeLessThan(doc.indexOf("await fetchContract("));
    expect(doc).not.toContain("getPublicUrl");
  });
});
