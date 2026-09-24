import { randomUUID } from "node:crypto";

import { PDFDocument } from "pdf-lib";
import sharp from "sharp";

export const CONTRACT_MAX_FILE_BYTES = 10 * 1024 * 1024;
export const CONTRACT_MAX_SIGNATURE_BYTES = 1024 * 1024;

/** Novos códigos usam 128 bits; links legados só funcionam com expiração válida. */
export function validContractCode(code: string): boolean {
  return /^(?:[A-F0-9]{12}|[A-F0-9]{32})$/.test(code);
}

export function contractCanBeFilled(
  contract: { status: string; expires_at?: string | null }, now = Date.now(),
): boolean {
  const expires = contract.expires_at ? Date.parse(contract.expires_at) : NaN;
  return contract.status === "pendente" && Number.isFinite(expires) && expires > now;
}

export class InvalidContractFile extends Error {}

/** Limite aplicado ao stream, inclusive quando Content-Length estiver ausente. */
export async function readContractForm(req: Request): Promise<FormData> {
  const limit = CONTRACT_MAX_FILE_BYTES * 2 + CONTRACT_MAX_SIGNATURE_BYTES * 2;
  if (Number(req.headers.get("content-length")) > limit) throw new InvalidContractFile("Envio grande demais");
  const reader = req.body?.getReader();
  if (!reader) throw new InvalidContractFile("Envio vazio");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    size += chunk.value.byteLength;
    if (size > limit) {
      await reader.cancel();
      throw new InvalidContractFile("Envio grande demais");
    }
    chunks.push(chunk.value);
  }
  return new Response(new Uint8Array(Buffer.concat(chunks)), {
    headers: { "content-type": req.headers.get("content-type") ?? "" },
  }).formData();
}

/** Decodifica o conteúdo real. Imagens são reencodadas, sem metadados do original. */
export async function validateContractFile(buffer: Buffer, declaredType: string, signature = false) {
  const max = signature ? CONTRACT_MAX_SIGNATURE_BYTES : CONTRACT_MAX_FILE_BYTES;
  if (!buffer.length || buffer.length > max) throw new InvalidContractFile("Tamanho de arquivo inválido");
  if (!signature && declaredType === "application/pdf") {
    if (buffer.subarray(0, 5).toString() !== "%PDF-") throw new InvalidContractFile("PDF inválido");
    try {
      const pdf = await PDFDocument.load(buffer, { updateMetadata: false, throwOnInvalidObject: true });
      if (pdf.isEncrypted || pdf.getPageCount() < 1 || pdf.getPageCount() > 100) throw new Error();
      for (const [, value] of pdf.context.enumerateIndirectObjects()) {
        if (/\/(JavaScript|JS|OpenAction|AA|Launch|EmbeddedFiles|RichMedia)\b/.test(value.toString())) throw new Error();
      }
    } catch { throw new InvalidContractFile("PDF inválido ou com conteúdo ativo"); }
    return { buffer, contentType: "application/pdf", extension: "pdf" };
  }
  const expected = { "image/jpeg": "jpeg", "image/png": "png", "image/webp": "webp" }[declaredType];
  if (!expected || (signature && expected !== "png")) throw new InvalidContractFile("Use PDF, JPG, PNG ou WebP");
  try {
    const image = sharp(buffer, { limitInputPixels: 20_000_000, failOn: "warning" });
    const metadata = await image.metadata();
    if (metadata.format !== expected || (metadata.pages ?? 1) !== 1) throw new Error();
    const safeBuffer = await image.rotate().png().toBuffer();
    if (safeBuffer.length > max) throw new Error();
    return { buffer: safeBuffer, contentType: "image/png", extension: "png" };
  } catch { throw new InvalidContractFile("Imagem inválida ou grande demais"); }
}

export function contractUploadPath(code: string, field: string, extension: string): string {
  if (!validContractCode(code) || !["assinatura", "laudo", "hemograma"].includes(field) ||
    !["png", "pdf"].includes(extension)) throw new InvalidContractFile("Destino inválido");
  return `${code}/${field}-${randomUUID()}.${extension}`;
}
