export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

interface InjectReq {
  postId: string;
  maxImages?: number;
}

function extractH2Headings(mdx: string): string[] {
  return (mdx.match(/^## (.+)$/gm) ?? [])
    .map((m) => m.replace(/^## /, "").trim())
    .filter(Boolean);
}

function buildPrompt(articleTitle: string, heading: string): string {
  const base = "Pomeranian Spitz dog, professional pet photography, soft natural light, sharp focus, editorial magazine style, clean background.";
  return `${base} Subject relates to: ${heading}. Article: ${articleTitle}`;
}

async function generateAndUpload(
  prompt: string,
  alt: string,
): Promise<string | null> {
  const openaiKey = process.env.OPENAI_API_KEY;
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "media";
  const sb = supabaseAdmin();

  let fileData: Buffer | null = null;

  if (openaiKey) {
    try {
      const res = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-image-1",
          prompt,
          size: "1200x630",
        }),
      });
      if (res.ok) {
        const j = await res.json();
        const b64 = j.data?.[0]?.b64_json as string | undefined;
        if (b64) fileData = Buffer.from(b64, "base64");
      }
    } catch {
      // fall through to null
    }
  }

  if (!fileData) return null;

  const filename = `inline/${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
  const { error: upErr } = await (sb as any).storage
    .from(bucket)
    .upload(filename, fileData, { contentType: "image/png", upsert: false });

  if (upErr) return null;

  const { data: pub } = (sb as any).storage.from(bucket).getPublicUrl(filename);
  return (pub as any)?.publicUrl ?? null;
}

function injectImageAfterH2(mdx: string, heading: string, imageUrl: string): string {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const h2Re = new RegExp(`(^## ${escaped}[ \\t]*$)`, "m");
  const tag = `\n\n![${heading}](${imageUrl})\n`;
  return mdx.replace(h2Re, `$1${tag}`);
}

export async function POST(req: Request) {
  const auth = await requireAdminApi(req, { permission: "blog:write" });
  if (auth) return auth;

  try {
    const body = (await req.json()) as InjectReq;
    const { postId, maxImages = 3 } = body;

    if (!postId) {
      return NextResponse.json({ error: "postId é obrigatório" }, { status: 400 });
    }

    const sb = supabaseAdmin();
    const { data: post, error: fetchErr } = await sb
      .from("blog_posts")
      .select("id, title, content_mdx")
      .eq("id", postId)
      .maybeSingle();

    if (fetchErr || !post) {
      return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
    }

    const mdx = (post.content_mdx as string) || "";
    if (!mdx.trim()) {
      return NextResponse.json({ error: "Post sem conteúdo MDX" }, { status: 400 });
    }

    const headings = extractH2Headings(mdx).slice(0, maxImages);
    if (!headings.length) {
      return NextResponse.json({ error: "Nenhum H2 encontrado no artigo" }, { status: 422 });
    }

    const results: { heading: string; url: string | null }[] = [];
    let updatedMdx = mdx;

    for (const heading of headings) {
      const prompt = buildPrompt(post.title as string, heading);
      const url = await generateAndUpload(prompt, heading);
      results.push({ heading, url });
      if (url) {
        updatedMdx = injectImageAfterH2(updatedMdx, heading, url);
      }
    }

    const injected = results.filter((r) => r.url).length;
    if (injected === 0) {
      return NextResponse.json(
        { error: "Nenhuma imagem gerada. Verifique OPENAI_API_KEY.", results },
        { status: 422 },
      );
    }

    const { error: updateErr } = await sb
      .from("blog_posts")
      .update({ content_mdx: updatedMdx, updated_at: new Date().toISOString() })
      .eq("id", postId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      injected,
      total: headings.length,
      results,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
