export const dynamic = "force-dynamic";
import { randomUUID } from "crypto";
import { Buffer } from "node:buffer";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  buildPuppyWritePayload,
  parseAdminPuppyStatus,
  parsePuppySex,
  type AdminPuppyStatus,
  type PuppyMedia,
  type PuppyWriteInput,
} from "@/lib/admin/puppyAdmin";
import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  ALLOWED_IMAGE_MIME,
  ALLOWED_VIDEO_MIME,
  detectMediaMime,
  inferExtFromMime,
  sanitizeFilename,
} from "@/lib/uploadValidation";

/**
 * Salva um filhote do estoque interno (formulario de criar e de editar).
 *
 * Ordem das coisas, de proposito:
 *   1. confere os campos e os arquivos ANTES de mexer em qualquer coisa;
 *   2. sobe os arquivos novos;
 *   3. grava no banco, so com colunas que existem (buildPuppyWritePayload);
 *   4. so depois de gravar, apaga do Storage as fotos que a pessoa removeu.
 * Se a gravacao falha, os arquivos recem-subidos sao removidos e as fotos
 * antigas continuam onde estavam. Antes as fotos eram apagadas primeiro e a
 * gravacao falhava em seguida, por causa de colunas que nao existem.
 */

const STORAGE_BUCKET = "puppies";
const STATUS_ERROR = "Status inválido. Use disponível, reservado, vendido ou indisponível.";

type Supabase = ReturnType<typeof supabaseAdmin>;

type OrderEntry = {
  type: "existing" | "new";
  ref: string;
};

type JsonBody = {
  id?: unknown;
  priceCents?: unknown;
  status?: unknown;
  description?: unknown;
};

type CheckedFile = {
  token: string;
  originalName: string;
  buffer: Buffer;
  mime: string;
};

type StatusDates = { sold_at: string | null; reserved_at: string | null };

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function formText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
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

/**
 * Endereco assinado (vence em 24 h) vira o endereco publico do mesmo arquivo.
 * Sem isso, editar um filhote poderia gravar um endereco que para de abrir.
 */
function stableUrl(url: string): string {
  const marker = "/storage/v1/object/sign/";
  const at = url.indexOf(marker);
  if (at < 0) return url;
  const rest = url.slice(at + marker.length).split("?")[0];
  return `${url.slice(0, at)}/storage/v1/object/public/${rest}`;
}

function publicUrlToPath(url: string): { bucket: string | null; path: string | null } {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return { bucket: null, path: null };
  const prefix = `${base}/storage/v1/object/public/`;
  const stable = stableUrl(url);
  if (!stable.startsWith(prefix)) return { bucket: null, path: null };
  const [bucket, ...rest] = stable.slice(prefix.length).split("/");
  if (!bucket || !rest.length) return { bucket: null, path: null };
  return { bucket, path: rest.join("/") };
}

/** Le o arquivo e confere pelos bytes se e mesmo foto ou video aceito. */
async function checkFile(file: File, kind: "image" | "video"): Promise<CheckedFile | { error: string }> {
  const { token, originalName } = extractFileToken(file);
  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = detectMediaMime(buffer);
  const allowed = kind === "image" ? ALLOWED_IMAGE_MIME : ALLOWED_VIDEO_MIME;
  if (!mime || !allowed.has(mime)) {
    return {
      error:
        kind === "image"
          ? `A foto "${originalName}" não é JPG, PNG, WebP, AVIF ou GIF. Converta o arquivo e envie de novo.`
          : `O vídeo "${originalName}" não é MP4, WebM ou MOV. Converta o arquivo e envie de novo.`,
    };
  }
  return { token: token ?? randomUUID(), originalName, buffer, mime };
}

async function uploadMediaFile(sb: Supabase, file: CheckedFile, kind: "image" | "video") {
  const dot = file.originalName.lastIndexOf(".");
  const baseName = dot > 0 ? file.originalName.slice(0, dot) : file.originalName;
  const safeBase = sanitizeFilename(baseName) || kind;
  const folder = new Date().toISOString().slice(0, 10);
  const objectPath = `${folder}/${safeBase}-${randomUUID()}.${inferExtFromMime(file.mime)}`;
  const storage = sb.storage.from(STORAGE_BUCKET);
  const { error } = await storage.upload(objectPath, file.buffer, { contentType: file.mime, upsert: false });
  if (error) throw new Error(`Falha ao salvar o arquivo "${file.originalName}": ${error.message}`);
  const { data } = storage.getPublicUrl(objectPath);
  return data.publicUrl;
}

async function deleteMedia(sb: Supabase, urls: string[]) {
  if (!urls.length) return;
  const pathsByBucket = new Map<string, string[]>();
  urls.forEach((url) => {
    const { bucket, path } = publicUrlToPath(url);
    if (bucket && path) {
      pathsByBucket.set(bucket, [...(pathsByBucket.get(bucket) ?? []), path]);
    }
  });
  await Promise.all(
    Array.from(pathsByBucket.entries()).map(async ([bucket, paths]) => {
      try {
        await sb.storage.from(bucket).remove(paths);
      } catch {
        // Arquivo orfao no Storage nao impede o cadastro de ficar certo.
      }
    }),
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

function stableOrder(order: OrderEntry[]): OrderEntry[] {
  return order.map((entry) => (entry.type === "existing" ? { ...entry, ref: stableUrl(entry.ref) } : entry));
}

async function readStatusDates(sb: Supabase, id: string) {
  const { data, error } = await sb.from("puppies").select("id,sold_at,reserved_at").eq("id", id).maybeSingle();
  if (error) return { response: fail(error.message, 500) } as const;
  if (!data) return { response: fail("Filhote não encontrado.", 404) } as const;
  return { current: data as StatusDates } as const;
}

/** Ajuste rapido por JSON: status, preco e descricao de um filhote que ja existe. */
async function handleJson(req: NextRequest, sb: Supabase) {
  const body = (await req.json().catch(() => ({}))) as JsonBody;
  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (!id) return fail("Faltou dizer qual filhote.", 400);

  const input: PuppyWriteInput = {};
  if (body.status !== undefined && body.status !== null && body.status !== "") {
    const status = parseAdminPuppyStatus(body.status);
    if (!status) return fail(STATUS_ERROR, 400);
    input.status = status;
  }
  if (typeof body.priceCents === "number") input.priceCents = body.priceCents;
  if (typeof body.description === "string") input.description = body.description;

  const read = await readStatusDates(sb, id);
  if ("response" in read) return read.response;

  const payload = buildPuppyWritePayload(input, {
    nowIso: new Date().toISOString(),
    isInsert: false,
    current: read.current,
  });
  const { data, error } = await sb.from("puppies").update(payload).eq("id", id).select("id").maybeSingle();
  if (error) return fail(error.message, 500);
  if (!data) return fail("Filhote não encontrado.", 404);
  return NextResponse.json({ ok: true, puppy: data });
}

export async function POST(req: NextRequest) {
  const guard = requireAdmin(req);
  if (guard) return guard;

  const contentType = req.headers.get("content-type") || "";
  const sb = supabaseAdmin();

  if (!contentType.includes("multipart/form-data")) return handleJson(req, sb);

  const formData = await req.formData();
  const id = formText(formData, "id") || undefined;

  // 1. Conferir tudo antes de subir arquivo ou tocar no banco.
  const name = formText(formData, "name");
  if (!name) return fail("Informe o nome do filhote.", 400);

  const rawSex = formText(formData, "sex");
  if (rawSex && !parsePuppySex(rawSex)) return fail("Sexo inválido. Use macho ou fêmea.", 400);

  const rawStatus = formText(formData, "status");
  let status: AdminPuppyStatus | undefined;
  if (rawStatus) {
    const parsed = parseAdminPuppyStatus(rawStatus);
    if (!parsed) return fail(STATUS_ERROR, 400);
    status = parsed;
  } else if (!id) {
    status = "available";
  }

  const rawPrice = formText(formData, "priceCents");
  const priceCents = rawPrice ? Number(rawPrice) : null;
  if (priceCents != null && (!Number.isFinite(priceCents) || priceCents < 0)) {
    return fail("Preço inválido.", 400);
  }

  const existingPhotoUrls = parseJsonArray(formData.get("existingPhotoUrls")).map(stableUrl);
  const existingVideoUrls = parseJsonArray(formData.get("existingVideoUrls")).map(stableUrl);
  const deletedUrls = [
    ...parseJsonArray(formData.get("deletedPhotoUrls")),
    ...parseJsonArray(formData.get("deletedVideoUrls")),
  ].map(stableUrl);
  const photoOrder = stableOrder(parseOrder(formData.get("photoOrder")));
  const videoOrder = stableOrder(parseOrder(formData.get("videoOrder")));

  const checkedPhotos: CheckedFile[] = [];
  for (const item of formData.getAll("photos")) {
    if (!(item instanceof File)) continue;
    const checked = await checkFile(item, "image");
    if ("error" in checked) return fail(checked.error, 400);
    checkedPhotos.push(checked);
  }
  const checkedVideos: CheckedFile[] = [];
  for (const item of formData.getAll("videos")) {
    if (!(item instanceof File)) continue;
    const checked = await checkFile(item, "video");
    if ("error" in checked) return fail(checked.error, 400);
    checkedVideos.push(checked);
  }

  let current: StatusDates | null = null;
  if (id) {
    const read = await readStatusDates(sb, id);
    if ("response" in read) return read.response;
    current = read.current;
  }

  // 2. Subir os arquivos novos. Se um falhar, os que ja subiram sao removidos.
  const uploadedUrls: string[] = [];
  const uploadedPhotos = new Map<string, string>();
  const uploadedVideos = new Map<string, string>();
  try {
    for (const file of checkedPhotos) {
      const url = await uploadMediaFile(sb, file, "image");
      uploadedUrls.push(url);
      uploadedPhotos.set(file.token, url);
    }
    for (const file of checkedVideos) {
      const url = await uploadMediaFile(sb, file, "video");
      uploadedUrls.push(url);
      uploadedVideos.set(file.token, url);
    }
  } catch (error) {
    await deleteMedia(sb, uploadedUrls);
    return fail(error instanceof Error ? error.message : "Falha ao salvar os arquivos.", 500);
  }

  const orderedPhotoUrls = buildOrderedList(photoOrder, existingPhotoUrls, uploadedPhotos);
  const orderedVideoUrls = buildOrderedList(videoOrder, existingVideoUrls, uploadedVideos);
  const media: PuppyMedia[] = [
    ...orderedPhotoUrls.map((url) => ({ url, type: "image" as const })),
    ...orderedVideoUrls.map((url) => ({ url, type: "video" as const })),
  ];

  // 3. Gravar no banco, so com colunas que existem.
  const payload = buildPuppyWritePayload(
    {
      name,
      color: formText(formData, "color") || null,
      ...(rawSex ? { sex: rawSex } : {}),
      city: formText(formData, "city") || null,
      state: formText(formData, "state").toUpperCase() || null,
      priceCents,
      ...(status ? { status } : {}),
      description: formText(formData, "description") || null,
      media,
    },
    { nowIso: new Date().toISOString(), isInsert: !id, current },
  );

  const query = id
    ? sb.from("puppies").update(payload).eq("id", id).select("id").maybeSingle()
    : sb.from("puppies").insert(payload).select("id").maybeSingle();
  const { data, error } = await query;
  if (error || !data) {
    await deleteMedia(sb, uploadedUrls);
    if (error) return fail(error.message, 500);
    return fail("Filhote não encontrado.", 404);
  }

  // 4. So agora apagar o que a pessoa removeu, e nunca um arquivo que continua em uso.
  const stillUsed = new Set(media.map((item) => item.url));
  await deleteMedia(
    sb,
    deletedUrls.filter((url) => !stillUsed.has(url)),
  );

  return NextResponse.json({ ok: true, puppy: data });
}
