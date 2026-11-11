export const dynamic = "force-dynamic";
import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

import {
  buildPuppyWritePayload,
  parseAdminPuppyStatus,
  parseMidia,
  parsePuppySex,
  type PuppyMedia,
  type PuppyWriteInput,
} from "@/lib/admin/puppyAdmin";
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

/**
 * Corpo JSON do formulario antigo -> campos do cadastro.
 * Campo ausente fica de fora (nao apaga o que ja esta gravado).
 */
function toWriteInput(body: Record<string, unknown>): { input: PuppyWriteInput } | { error: string } {
  const input: PuppyWriteInput = {};
  const str = (value: unknown) => (typeof value === "string" ? value : value == null ? null : String(value));

  if ("nome" in body || "name" in body) input.name = str(body.nome ?? body.name);
  if ("codigo" in body) input.code = str(body.codigo);
  if ("color" in body || "cor" in body) input.color = str(body.color ?? body.cor);
  if (body.gender != null || body.sexo != null) {
    const raw = body.gender ?? body.sexo;
    if (raw !== "" && !parsePuppySex(raw)) return { error: "Sexo inválido. Use macho ou fêmea." };
    if (raw !== "") input.sex = raw;
  }
  if ("price_cents" in body) {
    const cents = body.price_cents == null || body.price_cents === "" ? null : Number(body.price_cents);
    if (cents != null && (!Number.isFinite(cents) || cents < 0)) return { error: "Preço inválido." };
    input.priceCents = cents;
  }
  if (body.status != null && body.status !== "") {
    const status = parseAdminPuppyStatus(body.status);
    if (!status) return { error: "Status inválido. Use disponível, reservado, vendido ou indisponível." };
    input.status = status;
  }
  if ("nascimento" in body) input.birthDate = str(body.nascimento);
  if ("descricao" in body) input.description = str(body.descricao);
  if ("notes" in body) input.notes = str(body.notes);

  // A tabela nao tem image_url nem video_url: capa e video entram na lista de midia.
  if ("midia" in body || "image_url" in body || "video_url" in body) {
    const media: PuppyMedia[] = parseMidia(body.midia);
    const cover = typeof body.image_url === "string" ? body.image_url.trim() : "";
    if (cover) {
      const rest = media.filter((item) => item.url !== cover);
      media.length = 0;
      media.push({ url: cover, type: "image" }, ...rest);
    }
    const video = typeof body.video_url === "string" ? body.video_url.trim() : "";
    if (video && !media.some((item) => item.url === video)) media.push({ url: video, type: "video" });
    input.media = media;
  }

  return { input };
}

async function readBody(req: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    const body = await req.json();
    return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Cria um filhote no estoque interno. */
export async function POST(req: NextRequest) {
  const guard = requireAdmin(req);
  if (guard) return guard;

  const body = await readBody(req);
  if (!body) return NextResponse.json({ error: "Envio inválido." }, { status: 400 });

  const parsed = toWriteInput(body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  if (!parsed.input.name || !parsed.input.name.trim()) {
    return NextResponse.json({ error: "Informe o nome do filhote." }, { status: 400 });
  }

  const payload = buildPuppyWritePayload(
    { ...parsed.input, status: parsed.input.status ?? "available" },
    { nowIso: new Date().toISOString(), isInsert: true },
  );
  const { data, error } = await supabaseAdmin().from("puppies").insert(payload).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, puppy: data });
}

/** Atualiza um filhote que ja existe (o formulario antigo salva a edicao por aqui). */
export async function PUT(req: NextRequest) {
  const guard = requireAdmin(req);
  if (guard) return guard;

  const body = await readBody(req);
  if (!body) return NextResponse.json({ error: "Envio inválido." }, { status: 400 });
  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (!id) return NextResponse.json({ error: "Faltou dizer qual filhote." }, { status: 400 });

  const parsed = toWriteInput(body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  if (parsed.input.name !== undefined && !(parsed.input.name ?? "").trim()) {
    return NextResponse.json({ error: "Informe o nome do filhote." }, { status: 400 });
  }

  const sb = supabaseAdmin();
  const { data: current, error: readError } = await sb
    .from("puppies")
    .select("id,sold_at,reserved_at")
    .eq("id", id)
    .maybeSingle();
  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 });
  if (!current) return NextResponse.json({ error: "Filhote não encontrado." }, { status: 404 });

  const payload = buildPuppyWritePayload(parsed.input, {
    nowIso: new Date().toISOString(),
    isInsert: false,
    current,
  });
  const { data, error } = await sb.from("puppies").update(payload).eq("id", id).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Filhote não encontrado." }, { status: 404 });

  return NextResponse.json({ ok: true, puppy: data });
}
