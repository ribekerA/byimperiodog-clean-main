export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type SupabaseClient = ReturnType<typeof supabaseAdmin> | null;

function parseStringList(input: unknown): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return input.map((item) => String(item)).filter(Boolean);
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return [];
    if ((trimmed.startsWith("[") && trimmed.endsWith("]")) || (trimmed.startsWith("\"") && trimmed.endsWith("\""))) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map((item) => String(item)).filter(Boolean);
      } catch {
        // ignore JSON parse errors and fall back to split below
      }
    }
    return trimmed
      .split(/[\n;,|]/)
      .map((chunk) => chunk.replace(/^"|"$/g, "").trim())
      .filter(Boolean);
  }
  return [];
}

function extractBucketPath(raw: string): { bucket: string | null; path: string | null } {
  let value = raw.replace(/^https?:\/\/[^/]+\/storage\/v1\/object\//i, "");
  value = value.replace(/^public\//, "");
  if (value.startsWith("storage/v1/object/public/")) {
    value = value.replace(/^storage\/v1\/object\/public\//, "");
  }

  const match = value.match(/^(?<bucket>[^/]+)\/(?<path>.+)$/);
  if (match?.groups?.bucket && match?.groups?.path) {
    return { bucket: match.groups.bucket, path: match.groups.path };
  }

  return { bucket: null, path: null };
}

async function resolveMediaUrl(rawInput: unknown, client: SupabaseClient): Promise<string | null> {
  if (rawInput == null) return null;
  const raw = String(rawInput).trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;

  const { bucket, path } = extractBucketPath(raw);
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");

  if (bucket && path) {
    if (client?.storage) {
      try {
        const { data: signed } = await client.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24);
        if (signed?.signedUrl) return signed.signedUrl;
      } catch (err) {
        console.warn("[puppies-route] Falha ao gerar URL assinada", err);
      }

      const { data: pub } = client.storage.from(bucket).getPublicUrl(path);
      if (pub?.publicUrl) return pub.publicUrl;
    }

    if (base) return `${base}/storage/v1/object/public/${bucket}/${path}`;
  }

  if (base) return `${base}/storage/v1/object/public/${raw.replace(/^\/+/, "")}`;
  return raw;
}

function inferTypeFromUrl(url: string): "image" | "video" {
  return /\.(mp4|webm|mov|m4v)$/i.test(url) ? "video" : "image";
}

async function hydrateMedia(record: any, client: SupabaseClient) {
  if (!record) return record;

  const rawMediaArray = Array.isArray(record.midia) ? record.midia : undefined;
  const fallbackList = rawMediaArray && rawMediaArray.length ? [] : parseStringList(record.images ?? record.midia);
  const mediaSource = rawMediaArray && rawMediaArray.length ? rawMediaArray : fallbackList;

  const resolvedEntries = (
    await Promise.all(
      (mediaSource as unknown[]).map(async (entry) => {
        let baseUrl = "";
        if (typeof entry === "string") {
          baseUrl = entry;
        } else if (entry && typeof entry === "object") {
          if ("url" in entry && typeof entry.url === "string") baseUrl = entry.url;
          else if ("src" in entry && typeof entry.src === "string") baseUrl = entry.src;
        }
        if (!baseUrl) return null;
        const resolvedUrl = await resolveMediaUrl(baseUrl, client);
        if (!resolvedUrl) return null;
        let type: "image" | "video" = "image";
        if (entry && typeof entry === "object" && "type" in entry && entry.type === "video") {
          type = "video";
        }
        return {
          url: resolvedUrl,
          type: type === "video" ? "video" : inferTypeFromUrl(resolvedUrl),
        };
      })
    )
  ).filter((item): item is { url: string; type: "image" | "video" } => Boolean(item));

  const explicitVideo = await resolveMediaUrl(record.video_url ?? record.videoUrl, client);
  if (explicitVideo && !resolvedEntries.some((entry) => entry.type === "video")) {
    resolvedEntries.push({ url: explicitVideo, type: "video" });
  }

  const imageUrls = resolvedEntries.filter((entry) => entry.type === "image").map((entry) => entry.url);
  const videoUrls = resolvedEntries.filter((entry) => entry.type === "video").map((entry) => entry.url);
  const resolvedCover = imageUrls[0] ?? (await resolveMediaUrl(record.image_url ?? record.imageUrl, client)) ?? null;

  const finalImages = imageUrls.length ? imageUrls : resolvedCover ? [resolvedCover] : [];

  if (process.env.NODE_ENV !== "production") {
    console.debug("[admin-puppies-route] media hydration", {
      mediaSource,
      resolvedEntries,
      resolvedCover,
      videoUrls,
    });
  }

  return {
    ...record,
    image_url: resolvedCover,
    video_url: videoUrls[0] ?? explicitVideo ?? null,
    images: finalImages,
    midia: resolvedEntries,
  };
}


export async function GET(req: NextRequest) {
  const guard = requireAdmin(req);
  if (guard) return guard;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("puppies")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const hydrated = await hydrateMedia(data, supabase);
  return NextResponse.json({ puppy: hydrated });
}

export async function POST(req: NextRequest) {
  const guard = requireAdmin(req);
  if (guard) return guard;

  let data;
  try {
    data = await req.json();
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON', parseError: err && (err as any).message }, { status: 400 });
  }

  // Adapte os campos conforme sua tabela Supabase
  const { nome, color, gender, status, nascimento, image_url, descricao, notes, video_url, midia, price_cents, codigo } = data;
  const supabase = supabaseAdmin();
  let result;
  try {
    result = await supabase
      .from('puppies')
      .insert([{ nome, color, gender, status, nascimento, image_url, descricao, notes, video_url, midia, price_cents, codigo }])
      .select()
      .maybeSingle();
  } catch (err) {
    return NextResponse.json({ error: 'Supabase JS Exception', exception: err && (err as any).message, data }, { status: 500 });
  }
  const { error, data: inserted } = result;

  if (error) {
    return NextResponse.json({ error: error.message, supabaseError: error, sentData: data }, { status: 500 });
  }

  return NextResponse.json({ ok: true, puppy: inserted, sentData: data });
}
