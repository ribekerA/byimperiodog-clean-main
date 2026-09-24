import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { validatePublicImage } from "@/lib/image-upload-security";
import { inferExtFromMime } from "@/lib/uploadValidation";

describe("validação real de uploads de mídia", () => {
  it("recusa HTML/SVG com MIME de imagem permitido", async () => {
    await expect(validatePublicImage(Buffer.from('<svg><script>alert(1)</script></svg>'), "image/png")).rejects.toThrow();
    await expect(validatePublicImage(Buffer.from('<html>'), "image/jpeg")).rejects.toThrow();
  });
  it("decodifica PNG válido e recusa MIME divergente", async () => {
    const png = await sharp({ create: { width: 8, height: 8, channels: 3, background: "white" } }).png().toBuffer();
    await expect(validatePublicImage(png, "image/png")).resolves.toBeUndefined();
    await expect(validatePublicImage(png, "image/jpeg")).rejects.toThrow();
    await expect(validatePublicImage(png.subarray(0, 35), "image/png")).rejects.toThrow();
  });
  it("limita dimensões descompactadas", async () => {
    const png = await sharp({ create: { width: 5000, height: 5000, channels: 3, background: "white" } }).png().toBuffer();
    await expect(validatePublicImage(png, "image/png")).rejects.toThrow();
  });
  it("não salva vídeo como extensão bin genérica", () => {
    expect(inferExtFromMime("video/mp4")).toBe("mp4");
    expect(inferExtFromMime("video/webm")).toBe("webm");
    expect(inferExtFromMime("video/quicktime")).toBe("mov");
  });
});
