"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useToast } from "@/components/ui/toast";
import type { Puppy } from "@/domain/puppy";
import { CITIES, PUPPY_COLORS, type Color, type City, type PuppyStatus } from "@/domain/taxonomies";
import type { RawPuppy } from "@/types/puppy";

import { MediaManager } from "./MediaManager";

function generateSlug(name: string, color: string, sex: string) {
  return `${name}-${color}-${sex}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

type MediaItem = {
  id: string;
  type: "image" | "video";
  url: string;
  file?: File;
  order: number;
};

type PuppyFormRecord = (Partial<Puppy> & RawPuppy) & {
  images?: string[] | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  created_at?: string | null;
};

type FormValues = {
  name: string;
  slug: string;
  color: Color;
  sex: "male" | "female";
  city: City;
  state: string;
  priceCents: number;
  status: PuppyStatus;
  description: string;
};

type OrderEntry = {
  type: "existing" | "new";
  ref: string;
};

const DEFAULT_COLOR: Color = "creme";
const DEFAULT_CITY: City = "sao-paulo";
const DEFAULT_STATE = "SP";
const DEFAULT_STATUS: PuppyStatus = "available";

const COLOR_ALIASES: Record<string, Color> = {
  creme: "creme",
  champagne: "creme",
  branco: "branco",
  white: "branco",
  laranja: "laranja",
  orange: "laranja",
  caramelo: "laranja",
  preto: "preto",
  black: "preto",
  particolor: "particolor",
  chocolate: "chocolate",
  sable: "sable",
  azul: "azul",
};

const COLOR_OPTIONS = Object.entries(PUPPY_COLORS).map(([value, meta]) => ({
  value: value as Color,
  label: meta.label,
}));

const formatBRL = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Math.max(0, cents) / 100);

const COLOR_RARITY: Record<Color, number> = {
  creme: 1,
  branco: 1.08,
  laranja: 1,
  preto: 1.05,
  particolor: 1.12,
  chocolate: 1.15,
  sable: 1.1,
  azul: 1.2,
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeColor(value: unknown): Color {
  if (typeof value === "string" && value.trim()) {
    const slug = slugify(value);
    if (slug in PUPPY_COLORS) return slug as Color;
    if (COLOR_ALIASES[slug]) return COLOR_ALIASES[slug];
  }
  return DEFAULT_COLOR;
}

function normalizeSex(value: unknown): "male" | "female" {
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    if (normalized.includes("mach") || normalized === "male") return "male";
  }
  return "female";
}

function normalizeStatus(value: unknown): PuppyStatus {
  if (typeof value === "string" && value.trim()) {
    const normalized = value.toLowerCase();
    if (normalized.startsWith("reserv")) return "reserved";
    if (normalized.startsWith("vend")) return "sold";
    if (normalized.includes("pending") || normalized.startsWith("pend")) return "pending";
    if (normalized.includes("indisp") || normalized === "unavailable") return "unavailable";
    if (normalized.startsWith("dispon") || normalized === "available") return "available";
  }
  return DEFAULT_STATUS;
}

function normalizeCity(value: unknown): City {
  if (typeof value === "string" && value.trim()) {
    const slug = slugify(value);
    if (slug in CITIES) return slug as City;
    const match = Object.entries(CITIES).find(([, data]) => slugify(data.name) === slug);
    if (match) return match[0] as City;
    if (slug) return slug as City;
  }
  return DEFAULT_CITY;
}

function normalizeState(value: unknown, city?: City): string {
  const fallback = city && CITIES[city]?.state ? CITIES[city].state : DEFAULT_STATE;
  if (typeof value === "string" && value.trim()) {
    const cleaned = value.trim().toUpperCase();
    if (/^[A-Z]{2}$/.test(cleaned)) return cleaned;
    if (cleaned.length >= 2) return cleaned.slice(0, 2);
  }
  return fallback;
}

function normalizePrice(record?: PuppyFormRecord | null): number {
  if (!record) return 0;
  const centsCandidates = [record.priceCents, record.price_cents];
  for (const candidate of centsCandidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate) && candidate > 0) {
      return Math.round(candidate);
    }
  }

  if (typeof record.preco === "number" && Number.isFinite(record.preco)) {
    return Math.round(record.preco * 100);
  }

  if (typeof record.preco === "string" && record.preco.trim()) {
    const numeric = record.preco
      .replace(/R\$/gi, "")
      .replace(/\s+/g, "")
      .replace(/\.(?=\d{3}(\D|$))/g, "")
      .replace(/,/g, ".");
    const parsed = Number(numeric);
    if (Number.isFinite(parsed)) return Math.round(parsed * 100);
  }

  return 0;
}

function normalizeUrl(input: unknown): string {
  const raw = typeof input === "string" ? input : input == null ? "" : String(input);
  let url = raw.trim();
  if (!url) return "";

  if (url.startsWith("//")) url = `https:${url}`;

  const supabaseBase = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (supabaseBase) {
    if (url.startsWith(`${supabaseBase}/storage/v1/object/sign/`)) {
      const path = url.replace(`${supabaseBase}/storage/v1/object/sign/`, "").split("?")[0];
      url = `${supabaseBase}/storage/v1/object/public/${path}`;
    }

    if (/^(public\/)?puppies\//.test(url) || /^storage\//.test(url)) {
      const path = url.replace(/^public\//, "").replace(/^storage\/v1\/object\/public\//, "");
      url = `${supabaseBase}/storage/v1/object/public/${path}`;
    }
  }

  const driveMatch = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    const id = driveMatch[1];
    return `https://drive.google.com/uc?export=view&id=${id}`;
  }

  if (url.includes("dropbox.com")) {
    try {
      const dropboxUrl = new URL(url);
      if (dropboxUrl.hostname === "www.dropbox.com" && dropboxUrl.searchParams.get("dl") !== "1") {
        dropboxUrl.searchParams.set("dl", "1");
        return dropboxUrl.toString();
      }
    } catch {
      // ignore
    }
  }

  try {
    const parsed = new URL(url);
    parsed.pathname = parsed.pathname
      .split(" ")
      .map((segment) => encodeURIComponent(segment))
      .join("/")
      .replace(/%2F/g, "/");
    url = parsed.toString();
  } catch {
    url = encodeURI(url);
  }

  return url;
}

function parseLegacyArray(input: unknown): string[] {
  if (Array.isArray(input)) {
    return uniqueList(
      input
        .map((item) => {
          if (!item) return null;
          if (typeof item === "string") return normalizeUrl(item);
          if (typeof item === "object" && (item as { url?: string }).url) return normalizeUrl((item as { url?: string }).url);
          if (typeof item === "object" && (item as { src?: string }).src) return normalizeUrl((item as { src?: string }).src);
          return null;
        })
        .filter((url): url is string => Boolean(url))
    );
  }

  if (typeof input === "string" && input.trim()) {
    const trimmed = input.trim();
    if ((trimmed.startsWith("[") && trimmed.endsWith("]")) || (trimmed.startsWith("\"") && trimmed.endsWith("\""))) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parseLegacyArray(parsed);
      } catch {
        // ignore JSON parsing errors
      }
    }

    return uniqueList(
      trimmed
        .split(/\n|;|,|\|/)
        .map((chunk) => chunk.replace(/^\"|\"$/g, "").trim())
        .map(normalizeUrl)
        .filter(Boolean)
    );
  }

  return [];
}

function inferTypeFromUrl(url: string): MediaItem["type"] {
  return /\.(mp4|webm|mov|m4v|avi)$/i.test(url) ? "video" : "image";
}

function uniqueList(list: string[]): string[] {
  const seen = new Set<string>();
  return list.filter((item) => {
    if (!item) return false;
    if (seen.has(item)) return false;
    seen.add(item);
    return true;
  });
}

function extractStructuredMedia(record?: PuppyFormRecord | null): Array<{ url: string; type: MediaItem["type"] }> {
  if (!record) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sources: unknown[] = [record.midia, (record as any).media];
  for (const source of sources) {
    if (!Array.isArray(source) || source.length === 0) continue;
    const entries = source
      .map((entry) => {
        if (!entry) return null;
        const rawUrl = typeof entry === "string" ? entry : (entry as { url?: string | null; src?: string | null }).url ?? (entry as { src?: string | null }).src ?? "";
        if (!rawUrl) return null;
        const url = normalizeUrl(rawUrl);
        if (!url) return null;
        const declaredType = typeof entry === "object" && (entry as { type?: string }).type === "video" ? "video" : null;
        return { url, type: declaredType ?? inferTypeFromUrl(url) };
      })
      .filter((item): item is { url: string; type: MediaItem["type"] } => Boolean(item));
    if (entries.length) return entries;
  }
  return [];
}

function buildInitialValues(record?: PuppyFormRecord | null): FormValues {
  if (!record) {
    return {
      name: "",
      slug: "",
      color: DEFAULT_COLOR,
      sex: "female",
      city: DEFAULT_CITY,
      state: DEFAULT_STATE,
      priceCents: 0,
      status: DEFAULT_STATUS,
      description: "",
    };
  }

  const color = normalizeColor(record.color ?? record.cor);
  const sex = normalizeSex(record.sex ?? record.gender ?? record.sexo);
  const city = normalizeCity(record.city ?? record.cidade);
  const state = normalizeState(record.state ?? record.estado, city);
  const status = normalizeStatus(record.status);
  const priceCents = normalizePrice(record);
  const name = (record.name ?? record.nome ?? "").trim();
  const slug = (record.slug ?? "") || (name ? generateSlug(name, color, sex) : "");
  const description = (record.description ?? record.descricao ?? "").trim();

  return {
    name,
    slug,
    color,
    sex,
    city,
    state,
    priceCents,
    status,
    description,
  };
}

function buildOrderPayload(items: MediaItem[]): OrderEntry[] {
  return items.map((item) => ({
    type: item.file ? "new" : "existing",
    ref: item.file ? item.id : item.url,
  }));
}

function buildUploadFilename(item: MediaItem) {
  const fallbackName = `${item.type}-${item.id}.${item.type === "image" ? "jpg" : "mp4"}`;
  const original = item.file?.name?.trim() ? item.file.name : fallbackName;
  return `${item.id}::${original}`;
}

export default function PuppyForm({
  mode,
  record,
  onCompleted,
}: {
  mode: "create" | "edit";
  record?: PuppyFormRecord | null;
  onCompleted?: () => void;
}) {
  const isEdit = mode === "edit";
  const { push } = useToast();
  const router = useRouter();

  const [values, setValues] = useState<FormValues>(() => buildInitialValues(record));

  const [photos, setPhotos] = useState<MediaItem[]>([]);
  const [videos, setVideos] = useState<MediaItem[]>([]);
  const [deletedPhotoUrls, setDeletedPhotoUrls] = useState<string[]>([]);
  const [deletedVideoUrls, setDeletedVideoUrls] = useState<string[]>([]);

  // Carregar fotos e vídeos existentes ao editar
  useEffect(() => {
    if (!isEdit || !record) return;

    const structured = extractStructuredMedia(record);
    const structuredPhotos = structured.filter((entry) => entry.type === "image").map((entry) => entry.url);
    const structuredVideos = structured.filter((entry) => entry.type === "video").map((entry) => entry.url);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const legacyMedia = parseLegacyArray(record.midia ?? (record as any).media);
    const legacyPhotos = legacyMedia.filter((url) => inferTypeFromUrl(url) === "image");
    const legacyVideos = legacyMedia.filter((url) => inferTypeFromUrl(url) === "video");

    const imageLibrary = Array.isArray(record.images)
      ? record.images.map(normalizeUrl).filter(Boolean)
      : [];

    let photoUrls = structuredPhotos.length ? structuredPhotos : imageLibrary.length ? imageLibrary : legacyPhotos;
    const coverCandidate = normalizeUrl(record.image_url ?? record.imageUrl);
    if (coverCandidate) {
      photoUrls = [coverCandidate, ...photoUrls.filter((url) => url !== coverCandidate)];
    }

    let videoUrls = structuredVideos.length ? structuredVideos : legacyVideos;
    if (!videoUrls.length) {
      const directVideo = normalizeUrl(record.video_url ?? record.videoUrl);
      if (directVideo) videoUrls = [directVideo];
    }

    const finalPhotos = uniqueList(photoUrls);
    const finalVideos = uniqueList(videoUrls);

    setPhotos(
      finalPhotos.map((url, index) => ({
        id: `existing-photo-${index}`,
        type: "image" as const,
        url,
        order: index,
      })),
    );
    setVideos(
      finalVideos.map((url, index) => ({
        id: `existing-video-${index}`,
        type: "video" as const,
        url,
        order: index,
      })),
    );
    setDeletedPhotoUrls([]);
    setDeletedVideoUrls([]);

    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.debug("[PuppyForm] mídia carregada", { photos: finalPhotos, videos: finalVideos });
    }
  }, [isEdit, record]);

  useEffect(() => {
    if (!isEdit && values.name && values.color && values.sex) {
      setValues((s) => ({
        ...s,
        slug: generateSlug(values.name, values.color, values.sex),
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.name, values.color, values.sex]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [copySeed, setCopySeed] = useState(1);

  const mainImage = photos[0]?.url || record?.imageUrl || "";

  const demandScore = useMemo(() => {
    const ageDays = (() => {
      if (!record?.nascimento) return 30;
      const birth = new Date(record.nascimento);
      if (Number.isNaN(birth.getTime())) return 30;
      return Math.max(0, (Date.now() - birth.getTime()) / (1000 * 60 * 60 * 24));
    })();
    const freshness = Math.max(0, 30 - ageDays) / 30;
    const colorBoost = COLOR_RARITY[values.color] ?? 1;
    const availabilityBoost = values.status === "available" ? 1 : 0.5;
    const base = 50;
    const score = base + freshness * 25 + (colorBoost - 1) * 40 + availabilityBoost * 10;
    return Math.min(100, Math.max(0, Math.round(score)));
  }, [record?.nascimento, values.color, values.status]);

  const demandBadge = demandScore >= 75 ? "Muito procurado" : demandScore >= 45 ? "Normal" : "Baixa procura";

  const priceSuggestionCents = useMemo(() => {
    const base = 750000;
    const colorMult = COLOR_RARITY[values.color] ?? 1;
    const sexMult = values.sex === "female" ? 1.05 : 1;
    const demandMult = 0.9 + demandScore / 120;
    const ageDiscount = (() => {
      if (!record?.nascimento) return 1;
      const birth = new Date(record.nascimento);
      if (Number.isNaN(birth.getTime())) return 1;
      const months = Math.max(0, (Date.now() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30));
      if (months < 3) return 1.08;
      if (months < 5) return 1;
      if (months < 7) return 0.96;
      return 0.9;
    })();
    const suggested = base * colorMult * sexMult * demandMult * ageDiscount;
    return Math.max(300000, Math.round(suggested));
  }, [demandScore, record?.nascimento, values.color, values.sex]);

  const copyVariants = useMemo(() => {
    const name = values.name || record?.nome || record?.name || "Filhote";
    const colorLabel = PUPPY_COLORS[values.color]?.label || values.color;
    const sexLabel = values.sex === "female" ? "fêmea" : "macho";
    const priceLabel =
      values.priceCents > 0
        ? (values.priceCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
        : (priceSuggestionCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const variants = [
      {
        id: "conversao",
        title: "Conversão",
        short: `Pronto para morar? ${name} é um ${sexLabel} ${colorLabel} incrível e está disponível por ${priceLabel}.`,
        long: `${name} é um ${sexLabel} ${colorLabel} super sociável e habituado ao colo. Vacinas e vermífugo em dia, pronto para ir para casa por ${priceLabel}. Vamos agendar uma visita ou enviar mais fotos?`,
      },
      {
        id: "tecnico",
        title: "Técnico",
        short: `${name}: ${sexLabel} ${colorLabel}, pedigree, vacinação atualizada.`,
        long: `${name} (${sexLabel}, cor ${colorLabel}) possui pedigree, microchip, carteira de vacinação e acompanhamento veterinário. Ótima densidade de pelagem e estrutura compacta. Valor sugerido ${priceLabel}.`,
      },
      {
        id: "emocional",
        title: "Emocional",
        short: `${name} é o companheiro perfeito: pelagem ${colorLabel}, olhar doce e temperamento carinhoso.`,
        long: `${name} conquista com o olhar e o temperamento carinhoso. ${sexLabel} ${colorLabel} que adora colo, ideal para quem busca um Spitz de companhia. Proposta especial de ${priceLabel} com suporte pós-entrega.`,
      },
    ];
    if (copySeed % 2 === 0) {
      variants.push({
        id: `social-${copySeed}`,
        title: "Social",
        short: `${name} adora pessoas e outros pets. Pelagem ${colorLabel}, ${sexLabel} equilibrado.`,
        long: `${name} já convive com crianças e outros cães. ${sexLabel} ${colorLabel} com temperamento estável, ideal para famílias. ${priceLabel} com check-up e kit inicial inclusos.`,
      });
    }
    return variants;
  }, [copySeed, priceSuggestionCents, record?.name, record?.nome, values.color, values.name, values.priceCents, values.sex]);

  const photoQuality = useMemo(() => {
    const hasPhoto = Boolean(mainImage);
    const qualityScore = hasPhoto ? Math.min(95, 70 + photos.length * 5) : 30;
    const suggestions = [
      "Ajustar brilho e contraste para destacar a pelagem.",
      "Garantir foco no rosto do filhote.",
      "Centralizar o corpo e evitar cortes nas orelhas.",
      "Usar fundo neutro ou claro para destacar a cor.",
      "Adicionar uma foto em pé e outra no colo.",
    ];
    return { hasPhoto, qualityScore, suggestions };
  }, [mainImage, photos.length]);

  const tags = useMemo(() => {
    const base: string[] = [];
    base.push(values.color);
    base.push(values.sex === "female" ? "femea" : "macho");
    if (values.status === "available") base.push("disponivel");
    if (priceSuggestionCents > 1000000) base.push("premium");
    if (COLOR_RARITY[values.color] && COLOR_RARITY[values.color] > 1.1) base.push("raro");
    return Array.from(new Set(base));
  }, [priceSuggestionCents, values.color, values.sex, values.status]);

  const applyPriceSuggestion = () => {
    setValues((prev) => ({ ...prev, priceCents: priceSuggestionCents }));
    push({ type: "success", message: "Preço sugerido aplicado" });
  };

  const applyCopy = (variantId: string) => {
    const variant = copyVariants.find((v) => v.id === variantId) ?? copyVariants[0];
    setValues((prev) => ({ ...prev, description: variant.long }));
    push({ type: "success", message: `Copy ${variant.title} aplicada` });
  };

  const applyAllSuggestions = () => {
    applyPriceSuggestion();
    applyCopy(copyVariants[0].id);
  };

  function set<K extends keyof typeof values>(k: K, v: (typeof values)[K]) {
    setValues((s) => ({ ...s, [k]: v }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!values.name.trim()) e.name = "Obrigatório";
    if (!values.slug.trim()) e.slug = "Obrigatório";
    if (!values.color.trim()) e.color = "Obrigatório";
    if (!values.sex) e.sex = "Obrigatório";
    if (!values.city.trim()) e.city = "Obrigatório";
    if (!values.state.trim()) e.state = "Obrigatório";
    if (!values.status) e.status = "Obrigatório";
    if (!values.priceCents || values.priceCents <= 0) e.priceCents = "Preço deve ser > 0";
    if (photos.length === 0) e.photos = "Adicione pelo menos 1 foto";
    setErrors(e);
    return e;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const eMap = validate();
    if (Object.keys(eMap).length) {
      push({ type: "error", message: "Corrija os campos destacados." });
      return;
    }
    try {
      setSubmitting(true);

      const normalizedName = values.name.trim();
      const normalizedSlug = values.slug.trim() || generateSlug(values.name, values.color, values.sex);
      const normalizedColor = normalizeColor(values.color);
      const normalizedSex = normalizeSex(values.sex);
      const normalizedCity = normalizeCity(values.city);
      const normalizedState = normalizeState(values.state, normalizedCity);
      const normalizedStatus = normalizeStatus(values.status);
      const normalizedPrice = Math.max(0, Math.round(values.priceCents));
      const normalizedDescription = values.description?.trim() ?? "";

      // Upload de mídia via FormData
      const formData = new FormData();
      formData.append("id", record?.id || "");
      formData.append("name", normalizedName);
      formData.append("slug", normalizedSlug);
      formData.append("color", normalizedColor);
      formData.append("sex", normalizedSex);
      formData.append("city", normalizedCity);
      formData.append("state", normalizedState);
      formData.append("priceCents", normalizedPrice.toString());
      formData.append("status", normalizedStatus);
      formData.append("description", normalizedDescription);

      // Adicionar URLs de mídias deletadas
      const deletedPhotos = uniqueList(deletedPhotoUrls);
      const deletedVideos = uniqueList(deletedVideoUrls);
      if (deletedPhotos.length > 0) {
        formData.append("deletedPhotoUrls", JSON.stringify(deletedPhotos));
      }
      if (deletedVideos.length > 0) {
        formData.append("deletedVideoUrls", JSON.stringify(deletedVideos));
      }

      // Separar fotos existentes (URLs) das novas (Files)
      const existingPhotoUrls = uniqueList(photos.filter((p) => !p.file).map((p) => p.url));
      const newPhotoFiles = photos.filter((p) => p.file);

      // Enviar ordem das fotos existentes
      if (existingPhotoUrls.length > 0) {
        formData.append("existingPhotoUrls", JSON.stringify(existingPhotoUrls));
      }

      const photoOrder = buildOrderPayload(photos);
      if (photoOrder.length > 0) {
        formData.append("photoOrder", JSON.stringify(photoOrder));
      }

      // Adicionar novas fotos
      newPhotoFiles.forEach((photo) => {
        if (photo.file) {
          formData.append("photos", photo.file, buildUploadFilename(photo));
        }
      });

      // Separar vídeos existentes das novas
      const existingVideoUrls = uniqueList(videos.filter((v) => !v.file).map((v) => v.url));
      const newVideoFiles = videos.filter((v) => v.file);

      // Enviar URLs de vídeos existentes
      if (existingVideoUrls.length > 0) {
        formData.append("existingVideoUrls", JSON.stringify(existingVideoUrls));
      }

      const videoOrder = buildOrderPayload(videos);
      if (videoOrder.length > 0) {
        formData.append("videoOrder", JSON.stringify(videoOrder));
      }

      // Adicionar novos vídeos
      newVideoFiles.forEach((video) => {
        if (video.file) {
          formData.append("videos", video.file, buildUploadFilename(video));
        }
      });

      const res = await fetch("/api/admin/puppies/manage", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Erro ao salvar");
      push({ type: "success", message: isEdit ? "Filhote atualizado." : "Filhote criado." });
      onCompleted?.();
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao salvar";
      push({ type: "error", message });
    } finally {
      setSubmitting(false);
    }
  }

  const isAttention = values.status === "reserved" || values.status === "sold";

  return (
    <form onSubmit={onSubmit} className="space-y-[var(--space-6)]">
      <div className="grid gap-[var(--space-6)] md:grid-cols-2">
        <div className="space-y-[var(--space-4)] rounded-[var(--radius-2xl)] border border-[var(--border)] bg-white p-[var(--space-4)] shadow-[var(--elevation-2)]">
          <h2 className="text-lg font-semibold text-[var(--text)]">Dados principais</h2>

          <Field label="Nome *" value={values.name} onChange={(v) => set("name", v)} error={errors.name} />
          <Field label="Slug *" value={values.slug} onChange={(v) => set("slug", v)} error={errors.slug} placeholder="spitz-lulu-fofo" />

          <div className="grid grid-cols-2 gap-[var(--space-3)]">
            <Select
              label="Cor *"
              value={values.color}
              onChange={(v) => set("color", v as Color)}
              options={COLOR_OPTIONS}
              error={errors.color}
            />

            <Select
              label="Sexo *"
              value={values.sex}
              onChange={(v) => set("sex", v as "male" | "female")}
              options={[
                { value: "male", label: "Macho" },
                { value: "female", label: "Fêmea" },
              ]}
              error={errors.sex}
            />
          </div>

          <div className="grid grid-cols-2 gap-[var(--space-3)]">
            <Field label="Cidade *" value={values.city} onChange={(v) => set("city", v as City)} error={errors.city} />
            <Field
              label="UF *"
              value={values.state}
              onChange={(v) => set("state", v.toUpperCase().slice(0, 2))}
              error={errors.state}
              placeholder="SP"
            />
          </div>

          <div className="grid grid-cols-2 gap-[var(--space-3)]">
            <Field
              label="Preço (centavos) *"
              type="number"
              value={values.priceCents.toString()}
              onChange={(v) => set("priceCents", Number(v) || 0)}
              error={errors.priceCents}
            />

            <Select
              label="Status *"
              value={values.status}
              onChange={(v) => set("status", v as PuppyStatus)}
              options={[
                { value: "available", label: "Disponível" },
                { value: "reserved", label: "Reservado" },
                { value: "sold", label: "Vendido" },
                { value: "pending", label: "Pendente" },
                { value: "unavailable", label: "Indisponível" },
              ]}
              error={errors.status}
            />
          </div>

          <label className="block text-sm font-semibold text-[var(--text)]">
            Descrição
            <textarea
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              className="mt-2 w-full rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-[var(--space-3)] text-sm text-[var(--text)] shadow-[var(--elevation-1)] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              rows={4}
            />
          </label>

          {isAttention && (
            <div className="flex items-center gap-2 rounded-[var(--radius-lg)] bg-amber-50 px-[var(--space-3)] py-[var(--space-2)] text-sm text-amber-800">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Este filhote está marcado como {values.status === "reserved" ? "reservado" : "vendido"}.
            </div>
          )}
        </div>
      </div>

      {/* Painel IA */}
      <section className="grid gap-[var(--space-4)] lg:grid-cols-[2fr,1fr]">
        <div className="rounded-[var(--radius-2xl)] border border-[var(--border)] bg-[var(--surface)] px-[var(--space-4)] py-[var(--space-4)] shadow-[var(--elevation-2)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">Preco sugerido pela IA</p>
              <p className="text-xs text-[var(--text-muted)]">Baseado em cor, sexo, idade e demanda do funil.</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
              {demandBadge} - {demandScore} pts
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-[var(--radius-xl)] bg-white px-3 py-2 shadow-inner">
            <div>
              <p className="text-sm text-[var(--text-muted)]">Preco sugerido</p>
              <p className="text-xl font-bold text-[var(--text)]">{formatBRL(priceSuggestionCents)}</p>
            </div>
            <button
              type="button"
              onClick={applyPriceSuggestion}
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500"
            >
              Aplicar preco
            </button>
          </div>
          <div className="mt-3 text-xs text-[var(--text-muted)]">
            Considera raridade da cor, sexo, idade estimada e status de disponibilidade.
          </div>
        </div>

        <div className="space-y-3 rounded-[var(--radius-2xl)] border border-[var(--border)] bg-white px-[var(--space-4)] py-[var(--space-4)] shadow-[var(--elevation-2)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">Score de demanda</p>
              <p className="text-xs text-[var(--text-muted)]">Clicks/cores populares/recencia e disponibilidade.</p>
            </div>
            <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--text)]">
              {demandBadge}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface)]">
            <div className="h-full bg-emerald-500" style={{ width: `${demandScore}%` }} aria-valuenow={demandScore} />
          </div>
          <p className="text-xs text-[var(--text-muted)]">Quanto maior o score, mais urgente ajustar preco, fotos e copy.</p>
        </div>
      </section>

      <section className="grid gap-[var(--space-4)] lg:grid-cols-3">
        <div className="rounded-[var(--radius-2xl)] border border-[var(--border)] bg-white p-[var(--space-4)] shadow-[var(--elevation-2)]">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[var(--text)]">Copy sugerida (IA)</p>
            <button
              type="button"
              onClick={() => setCopySeed((s) => s + 1)}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              Gerar nova variacao
            </button>
          </div>
          <div className="mt-3 space-y-3">
            {copyVariants.map((variant) => (
              <div key={variant.id} className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-[var(--space-3)]">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[var(--text)]">{variant.title}</p>
                  <button
                    type="button"
                    onClick={() => applyCopy(variant.id)}
                    className="text-xs font-semibold text-emerald-700 hover:underline"
                  >
                    Usar
                  </button>
                </div>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{variant.short}</p>
                <p className="mt-2 text-xs text-[var(--text-muted)]">{variant.long}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 rounded-[var(--radius-2xl)] border border-[var(--border)] bg-white p-[var(--space-4)] shadow-[var(--elevation-2)]">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">Qualidade da foto</p>
              <p className="text-xs text-[var(--text-muted)]">Analise rapida da imagem principal.</p>
            </div>
            <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--text)]">
              {photoQuality.qualityScore} pts
            </span>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            {photoQuality.hasPhoto ? "Use as recomendacoes para deixar o anuncio mais atrativo." : "Adicione uma foto para obter recomendacoes."}
          </p>
          <ul className="space-y-1 text-xs text-[var(--text-muted)]">
            {photoQuality.suggestions.map((tip) => (
              <li key={tip}>- {tip}</li>
            ))}
          </ul>
          <div className="rounded-[var(--radius-lg)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text-muted)]">
            Sugestao IA de nova versao: gerar fundo claro, foco no rosto e contraste +10 (placeholder).
          </div>
        </div>

        <div className="space-y-3 rounded-[var(--radius-2xl)] border border-[var(--border)] bg-white p-[var(--space-4)] shadow-[var(--elevation-2)]">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[var(--text)]">Tags e categoria</p>
            <span className="text-xs text-[var(--text-muted)]">IA sugere automaticamente</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--text)]">
                {tag}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={applyAllSuggestions}
            className="w-full rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500"
          >
            Aplicar todas sugestoes
          </button>
        </div>
      </section>
      {/* Media Section */}
      <MediaManager
        photos={photos}
        videos={videos}
        onPhotosChange={setPhotos}
        onVideosChange={setVideos}
        onPhotoDelete={(url: string) => setDeletedPhotoUrls(prev => [...prev, url])}
        onVideoDelete={(url: string) => setDeletedVideoUrls(prev => [...prev, url])}
      />

      {errors.photos && (
        <p className="rounded-[var(--radius-lg)] bg-rose-50 px-[var(--space-4)] py-[var(--space-2)] text-sm text-rose-600">
          ⚠️ {errors.photos}
        </p>
      )}

      {/* Submit Actions */}
      <div className="flex items-center justify-end gap-[var(--space-3)] rounded-[var(--radius-2xl)] border border-[var(--border)] bg-white px-[var(--space-6)] py-[var(--space-4)] shadow-[var(--elevation-2)]">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-[var(--radius-full)] border border-[var(--border)] px-[var(--space-4)] py-[var(--space-2)] text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-[var(--radius-full)] bg-emerald-600 px-[var(--space-4)] py-[var(--space-2)] text-sm font-semibold text-white shadow-[var(--elevation-2)] transition hover:bg-emerald-700 hover:shadow-[var(--elevation-3)] disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {submitting ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  error?: string;
}) {
  return (
    <label className="block text-sm font-semibold text-[var(--text)]">
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`mt-2 w-full rounded-[var(--radius-lg)] border px-[var(--space-3)] py-[var(--space-2)] text-sm text-[var(--text)] shadow-[var(--elevation-1)] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
          error ? "border-rose-300 bg-rose-50" : "border-[var(--border)] bg-[var(--surface)]"
        }`}
      />
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<string | { value: string; label: string }>;
  error?: string;
}) {
  return (
    <label className="block text-sm font-semibold text-[var(--text)]">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-2 h-10 w-full rounded-[var(--radius-lg)] border px-[var(--space-3)] text-sm text-[var(--text)] shadow-[var(--elevation-1)] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
          error ? "border-rose-300 bg-rose-50" : "border-[var(--border)] bg-[var(--surface)]"
        }`}
      >
        {options.map((opt) => {
          const val = typeof opt === "string" ? opt : opt.value;
          const label = typeof opt === "string" ? opt : opt.label;
          return (
            <option key={val} value={val}>
              {label}
            </option>
          );
        })}
      </select>
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </label>
  );
}


