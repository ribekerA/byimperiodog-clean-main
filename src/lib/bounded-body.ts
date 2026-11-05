export class BodyTooLargeError extends Error {
  constructor() { super("Envio grande demais"); }
}

/** Limita bytes durante a leitura, mesmo sem Content-Length ou com valor falso. */
export async function readBoundedBody(req: Request, limit: number): Promise<Uint8Array<ArrayBuffer>> {
  if (!Number.isSafeInteger(limit) || limit < 1) throw new Error("Limite inválido");
  if (Number(req.headers.get("content-length")) > limit) throw new BodyTooLargeError();
  const reader = req.body?.getReader();
  if (!reader) return new Uint8Array(0);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > limit) {
        await reader.cancel().catch(() => {});
        throw new BodyTooLargeError();
      }
      chunks.push(chunk.value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}

export async function readBoundedFormData(req: Request, limit: number): Promise<FormData> {
  return new Response(await readBoundedBody(req, limit), {
    headers: { "content-type": req.headers.get("content-type") ?? "" },
  }).formData();
}
