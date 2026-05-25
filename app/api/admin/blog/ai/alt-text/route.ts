import { NextResponse } from "next/server";
import type { AiAltTextRequest, AiAltTextResponse } from "@/types/blog";

/**
 * POST /api/admin/blog/ai/alt-text
 * Gera alt-text e legendas básicas para imagens informadas.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AiAltTextRequest;
    const images = Array.isArray(body?.images) ? body.images : [];
    if (images.length === 0) {
      return NextResponse.json({ ok: false, error: "images array is required" } satisfies AiAltTextResponse, { status: 400 });
    }
    const items = images.map((img) => {
      const ctx = (img.context || "").toString();
      const spitzHint = /spitz|lulu|pomer/iu.test(ctx) ? "" : " de Spitz Alemão (Lulu da Pomerânia)";
      return {
        url: img.url,
        alt: (ctx ? `Imagem relacionada a ${ctx}` : "Imagem ilustrativa") + spitzHint +
             (img.url ? ` (${img.url.split('/').pop()})` : ""),
        caption: ctx || undefined,
      };
    });
    return NextResponse.json({ ok: true, items } satisfies AiAltTextResponse);
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message || err) } satisfies AiAltTextResponse, { status: 500 });
  }
}
