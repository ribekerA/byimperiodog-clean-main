export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabasePublic } from "@/lib/supabasePublic";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { z } from "zod";

// best-effort in-memory rate limiter
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const rateMap = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: Request) {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "anonymous";
}

function checkRate(req: Request) {
  const key = getClientIp(req);
  const now = Date.now();
  const entry = rateMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const schema = z.object({
      post_id: z.string().uuid({ message: "post_id inválido" }),
      limit: z.coerce.number().int().min(1).max(50).default(20),
      before: z
        .string()
        .trim()
        .optional()
        .refine((v) => !v || !Number.isNaN(Date.parse(v)), { message: "before inválido" }),
    });
    const parsed = schema.safeParse({
      post_id: url.searchParams.get("post_id"),
      limit: url.searchParams.get("limit") ?? undefined,
      before: url.searchParams.get("before") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Parâmetros inválidos" }, { status: 400 });
    }
    const { post_id, limit, before } = parsed.data;

    const sb = supabasePublic();
    let query = sb
      .from("blog_comments")
      .select("id,post_id,author_name,body,approved,created_at")
      .eq("post_id", post_id)
      .eq("approved", true)
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    if (before) query = query.lt("created_at", before);

    const { data, error } = await query;
    if (error) throw error;
    const items = data ?? [];
    let nextCursor: string | null = null;
    if (items.length > limit) {
      const last = items.pop();
      nextCursor = last?.created_at ?? null;
    }
    return NextResponse.json({ items, nextCursor });
  } catch (err: any) {
    console.error(err?.message || err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!checkRate(req)) {
      return NextResponse.json({ error: "Muitas tentativas. Tente novamente em instantes." }, { status: 429 });
    }

    const schema = z.object({
      post_id: z.string().uuid({ message: "post_id inválido" }),
      author_name: z
        .string()
        .trim()
        .min(1, { message: "Nome muito curto" })
        .max(60, { message: "Nome muito longo" })
        .optional()
        .or(z.literal("").transform(() => undefined)),
      author_email: z
        .string()
        .trim()
        .email({ message: "E-mail inválido" })
        .optional()
        .or(z.literal("").transform(() => undefined)),
      body: z.string().trim().min(5, { message: "Comentário muito curto" }).max(2000, { message: "Comentário muito longo" }),
    });
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Dados inválidos" }, { status: 400 });
    }
    const { post_id, author_name, author_email, body: comment } = parsed.data;

    // Ensure post exists and is published (public select on published only)
    const sbPublic = supabasePublic();
    const { data: postExist } = await sbPublic
      .from("blog_posts")
      .select("id")
      .eq("id", post_id)
      .maybeSingle();
    if (!postExist) {
      return NextResponse.json({ error: "Post inexistente ou não publicado" }, { status: 404 });
    }

    // Insert unapproved; moderation elsewhere
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from("blog_comments")
      .insert([{ post_id, author_name, author_email, body: comment }])
      .select("id,post_id,author_name,body,approved,created_at")
      .single();
    if (error) throw error;

    return NextResponse.json({ ok: true, comment: data }, { status: 201 });
  } catch (err: any) {
    console.error(err?.message || err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
