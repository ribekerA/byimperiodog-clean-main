export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/adminAuth";
import { chaveIA, respostaSemChaveIA } from "@/lib/ai/require-key";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type ImageReq = { prompt: string; alt?: string };

// Return data appropriate for upload: Buffer (Node) or Blob (Edge/browser)
function base64ToUploadData(b64: string, mime = "image/png") {
  // If Buffer exists (Node runtime), prefer Buffer
  if (typeof Buffer !== "undefined") {
    return Buffer.from(b64, "base64");
  }

  // Edge/browser runtime: build a Uint8Array and wrap in a Blob
  // atob should exist in edge/browser environments
  const binary = typeof atob === "function" ? atob(b64) : "";
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export async function POST(req: Request) {
  const auth = requireAdminApi(req);
  if (auth) return auth;

  try {
    const body = (await req.json()) as ImageReq;
    const prompt = (body.prompt || "").trim();
    if (!prompt) return NextResponse.json({ error: "prompt é obrigatório" }, { status: 400 });

    const openaiKey = chaveIA();
    if (!openaiKey) return respostaSemChaveIA();
    const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "media";
    const sb = supabaseAdmin();

    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({ model: "gpt-image-1", prompt, size: "1200x630" }),
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Falha no provedor de imagem (HTTP ${res.status}). Nenhuma imagem foi criada.` },
        { status: 502 }
      );
    }
    const j = await res.json();
    const b64 = j.data?.[0]?.b64_json as string | undefined;
    if (!b64) {
      return NextResponse.json(
        { error: "O provedor de imagem retornou uma resposta vazia." },
        { status: 502 }
      );
    }
    const fileData = base64ToUploadData(b64, "image/png");

  const filename = `covers/${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
  // fileData is Blob (Edge) or Buffer (Node) — pass directly to Supabase storage
  const { error: upErr } = await (sb as any).storage.from(bucket).upload(filename, fileData as any, {
    contentType: "image/png",
    upsert: false,
  });
  if (upErr) throw upErr;
  const { data: pub } = (sb as any).storage.from(bucket).getPublicUrl(filename);
  const url = (pub as any)?.publicUrl || (pub as any)?.public_url || "";
  if (!url) throw new Error("O armazenamento não retornou uma URL pública para a imagem.");

    // Persist in media table
  const { data: media, error: mediaErr } = await sb
    .from("media")
    .insert([{ url, alt: body.alt || prompt, width: 1200, height: 630 }])
    .select("id, url")
    .single();
  if (mediaErr) throw mediaErr;

  return NextResponse.json({ url, media_id: (media as any)?.id }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
