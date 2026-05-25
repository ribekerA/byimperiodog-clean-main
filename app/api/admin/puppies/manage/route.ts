export const dynamic = "force-dynamic";
import { randomUUID } from "crypto";
import { Buffer } from "node:buffer";

import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sanitizeFilename } from "@/lib/uploadValidation";

const STORAGE_BUCKET = "puppies";

type OrderEntry = {
  type: "existing" | "new";
  ref: string;
};

type JsonBody = {
  id?: string;
  name?: string;
  slug?: string | null;
  color?: string | null;
  sex?: string | null;
  city?: string | null;
  state?: string | null;
  priceCents?: number | null;
  status?: string | null;
  description?: string | null;
};

function mapStatusToDb(status?: string | null) {
  const value = (status || "disponivel").toLowerCase();
  if (value === "sold" || value === "vendido") return "vendido";
  if (value === "reserved" || value === "reservado") return "reservado";
  if (value === "indisponivel" || value === "unavailable" || value === "pending") return "indisponivel";
  return "disponivel";
}

function mapSexToDb(sex?: string | null) {
  const value = (sex || "femea").toLowerCase();
  return value === "male" || value === "macho" ? "macho" : "femea";
}

function normalizeGender(sex?: string | null) {
  const value = (sex || "female").toLowerCase();
  return value === "macho" || value === "male" ? "male" : "female";
}

function parseJsonArray(value: FormDataEntryValue | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(String(value));
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item)).filter(Boolean);
    }
  } catch {
    // ignore
  }
  return [];
}

function parseOrder(value: FormDataEntryValue | null): OrderEntry[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(String(value));
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const type = item.type === "new" ? "new" : item.type === "existing" ? "existing" : null;
          const ref = typeof item.ref === "string" ? item.ref : typeof item.url === "string" ? item.url : null;
          if (!type || !ref) return null;
          return { type, ref } satisfies OrderEntry;
        })
        .filter(Boolean) as OrderEntry[];
    }
  } catch {
    // ignore
  }
  return [];
}

function extractFileToken(file: File): { token: string | null; originalName: string } {
  const name = file.name || "";
  if (name.includes("::")) {
    const [token, ...rest] = name.split("::");
    return { token: token || null, originalName: rest.join("::") || "upload" };
  }
  return { token: null, originalName: name || "upload" };
}

function publicUrlToPath(url: string): { bucket: string | null; path: string | null } {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return { bucket: null, path: null };
  const normalized = url.replace(`${base}/storage/v1/object/public/`, "");
  const [bucket, ...rest] = normalized.split("/");
  if (!bucket || !rest.length) return { bucket: null, path: null };
  return { bucket, path: rest.join("/") };
}

async function uploadMediaFile(sb: ReturnType<typeof supabaseAdmin>, file: File, type: "image" | "video", originalName: string) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const extFromName = originalName.includes(".") ? originalName.split(".").pop() : undefined;
  const ext = extFromName ? extFromName.toLowerCase() : type === "image" ? "jpg" : "mp4";
  const safeBase = sanitizeFilename(originalName.replace(/\.[^.]+$/, "")) || type;
  const folder = new Date().toISOString().slice(0, 10);
  const objectPath = `${folder}/${safeBase}-${randomUUID()}.${ext}`;
  const storage = sb.storage.from(STORAGE_BUCKET);
  const { error } = await storage.upload(objectPath, buffer, {
    contentType: file.type || (type === "image" ? "image/jpeg" : "video/mp4"),
    upsert: false,
  });
  if (error) throw new Error(`Falha ao salvar arquivo: ${error.message}`);
  const { data } = storage.getPublicUrl(objectPath);
  return data.publicUrl;
}

async function deleteMedia(sb: ReturnType<typeof supabaseAdmin>, urls: string[]) {
  if (!urls.length) return;
  const pathsByBucket = new Map<string, string[]>();
  urls.forEach((url) => {
    const { bucket, path } = publicUrlToPath(url);
    if (bucket && path) {
      pathsByBucket.set(bucket, [...(pathsByBucket.get(bucket) ?? []), path]);
    }
  });
  await Promise.all(
    Array.from(pathsByBucket.entries()).map(([bucket, paths]) =>
      sb.storage
        .from(bucket)
        .remove(paths)
        .catch(() => null),
    ),
  );
}

function buildOrderedList(order: OrderEntry[], existing: string[], uploads: Map<string, string>) {
  if (!order.length) {
    return [...existing, ...Array.from(uploads.values())];
  }
  const usedUploads = new Set<string>();
  const usedExisting = new Set<string>();
  const result: string[] = [];

  order.forEach((entry) => {
    if (entry.type === "existing" && existing.includes(entry.ref) && !usedExisting.has(entry.ref)) {
      result.push(entry.ref);
      usedExisting.add(entry.ref);
    } else if (entry.type === "new") {
      const uploaded = uploads.get(entry.ref);
      if (uploaded) {
        result.push(uploaded);
        usedUploads.add(entry.ref);
      }
    }
  });

  const leftoverExisting = existing.filter((url) => !usedExisting.has(url));
  const leftoverUploads = Array.from(uploads.entries())
    .filter(([token]) => !usedUploads.has(token))
    .map(([, url]) => url);

  return [...result, ...leftoverExisting, ...leftoverUploads];
}

export async function POST(req: NextRequest) {
  const guard = requireAdmin(req);
  if (guard) return guard;

  const contentType = req.headers.get("content-type") || "";
  const sb = supabaseAdmin();

  if (!contentType.includes("multipart/form-data")) {
    const body = (await req.json().catch(() => ({}))) as JsonBody;
    if (!body.id) {
      return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (body.status) updates.status = mapStatusToDb(body.status);
    if (typeof body.priceCents === "number") {
      updates.price_cents = body.priceCents;
      updates.preco = body.priceCents / 100;
    }
    if (body.description !== undefined) {
      updates.descricao = body.description;
      updates.description = body.description;
    }
    updates.updated_at = new Date().toISOString();

    const { data, error } = await sb.from("puppies").update(updates).eq("id", body.id).select().maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ puppy: data });
  }

  const formData = await req.formData();
  const id = (formData.get("id") as string) || undefined;
  const name = (formData.get("name") as string) || "";
  const slug = (formData.get("slug") as string) || null;
  const color = (formData.get("color") as string) || null;
  const sex = (formData.get("sex") as string) || null;
  const city = (formData.get("city") as string) || null;
  const state = ((formData.get("state") as string) || "").toUpperCase() || null;
  const priceCents = Number(formData.get("priceCents")) || 0;
  const status = (formData.get("status") as string) || null;
  const description = (formData.get("description") as string) || null;

  const existingPhotoUrls = parseJsonArray(formData.get("existingPhotoUrls"));
  const existingVideoUrls = parseJsonArray(formData.get("existingVideoUrls"));
  const deletedPhotoUrls = parseJsonArray(formData.get("deletedPhotoUrls"));
  const deletedVideoUrls = parseJsonArray(formData.get("deletedVideoUrls"));
  const photoOrder = parseOrder(formData.get("photoOrder"));
  const videoOrder = parseOrder(formData.get("videoOrder"));

  const photoFiles = formData
    .getAll("photos")
    .filter((item): item is File => item instanceof File);
  const videoFiles = formData
    .getAll("videos")
    .filter((item): item is File => item instanceof File);

  await deleteMedia(sb, [...deletedPhotoUrls, ...deletedVideoUrls]);

  const uploadedPhotos = new Map<string, string>();
  for (const file of photoFiles) {
    const { token, originalName } = extractFileToken(file);
    const url = await uploadMediaFile(sb, file, "image", originalName);
    uploadedPhotos.set(token ?? randomUUID(), url);
  }

  const uploadedVideos = new Map<string, string>();
  for (const file of videoFiles) {
    const { token, originalName } = extractFileToken(file);
    const url = await uploadMediaFile(sb, file, "video", originalName);
    uploadedVideos.set(token ?? randomUUID(), url);
  }

  const orderedPhotoUrls = buildOrderedList(photoOrder, existingPhotoUrls, uploadedPhotos);
  const orderedVideoUrls = buildOrderedList(videoOrder, existingVideoUrls, uploadedVideos);

  const mediaPayload = [
    ...orderedPhotoUrls.map((url) => ({ url, type: "image" })),
    ...orderedVideoUrls.map((url) => ({ url, type: "video" })),
  ];

  const now = new Date().toISOString();
  const payload: Record<string, unknown> = {
    nome: name,
    name,
    slug,
    cor: color,
    color,
    sexo: mapSexToDb(sex),
    gender: normalizeGender(sex),
    city,
    cidade: city,
    state,
    estado: state,
    price_cents: priceCents,
    preco: Number.isFinite(priceCents) ? priceCents / 100 : null,
    status: mapStatusToDb(status),
    descricao: description,
    description,
    image_url: orderedPhotoUrls[0] ?? null,
    video_url: orderedVideoUrls[0] ?? null,
    images: orderedPhotoUrls,
    media: orderedPhotoUrls,
    midia: mediaPayload,
    updated_at: now,
  };

  if (!id) {
    payload.created_at = now;
  }

  const query = id
    ? sb.from("puppies").update(payload).eq("id", id).select().maybeSingle()
    : sb.from("puppies").insert(payload).select().maybeSingle();

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ puppy: data });
}
