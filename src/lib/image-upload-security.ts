import "server-only";

import sharp from "sharp";

import { isAllowedImage } from "@/lib/uploadValidation";

export class InvalidPublicImage extends Error {
  constructor() { super("Imagem inválida ou fora dos limites permitidos"); }
}

/** Valida o arquivo real, preservando a foto original; não equivale a antivírus. */
export async function validatePublicImage(buffer: Buffer, mime: string): Promise<void> {
  if (!isAllowedImage(mime, buffer.byteLength)) throw new InvalidPublicImage();
  const expected = { "image/jpeg": "jpeg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "heif" }[mime];
  try {
    const image = sharp(buffer, { animated: true, limitInputPixels: 20_000_000, failOn: "warning" });
    const metadata = await image.metadata();
    if (metadata.format !== expected || (mime === "image/avif" && metadata.compression !== "av1") ||
      (metadata.pages ?? 1) > 200) throw new InvalidPublicImage();
    // metadata() sozinha não verifica pixels truncados/corrompidos.
    await image.raw().toBuffer();
  } catch { throw new InvalidPublicImage(); }
}
