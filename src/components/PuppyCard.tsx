"use client";

import {
  Calendar,
  ChevronRight,
  GraduationCap,
  Heart,
  MapPin,
  MessageCircle,
  PawPrint,
  Video,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { AI_BADGE_MAP, type AiBadgeConfig, type AiBadgeId } from "@/components/catalog/ai-badges";
import { PUPPY_CARD_SIZES } from "@/lib/image-sizes";
import { optimizePuppyCardImage } from "@/lib/optimize-image";
import { BLUR_DATA_URL } from "@/lib/placeholders";
import track from "@/lib/track";
import { buildWhatsAppLink } from "@/lib/whatsapp";

type AiSeoCopy = {
  shortTitle?: string | null;
  shortDescription?: string | null;
  altText?: string | null;
  seoKeywords?: string[] | null;
};

type Puppy = {
  id: string;
  nome?: string | null;
  name?: string | null;
  cor?: string | null;
  color?: string | null;
  gender?: "male" | "female" | string | null;
  sex?: "male" | "female" | string | null;
  sexo?: string | null;
  status?: "disponivel" | "reservado" | "vendido" | string | null;
  price_cents?: number | null;
  priceCents?: number | null;
  birthDate?: string | Date | null;
  nascimento?: string | null;
  city?: string | null;
  state?: string | null;
  slug?: string | null;
  video_url?: string | null;
  videoUrl?: string | null;
  shortTitle?: string | null;
  shortDescription?: string | null;
  altText?: string | null;
  seoKeywords?: string[] | null;
  aiSeo?: AiSeoCopy | null;
  catalogSeo?: AiSeoCopy | null;
};

const statusStyles: Record<string, { label: string; className: string }> = {
  disponivel: { label: "Disponível", className: "bg-emerald-100 text-emerald-800 ring-emerald-200" },
  available: { label: "Disponível", className: "bg-emerald-100 text-emerald-800 ring-emerald-200" },
  reservado: { label: "Reservado", className: "bg-amber-100 text-amber-800 ring-amber-200" },
  reserved: { label: "Reservado", className: "bg-amber-100 text-amber-800 ring-amber-200" },
  vendido: { label: "Vendido", className: "bg-rose-100 text-rose-800 ring-rose-200" },
  sold: { label: "Vendido", className: "bg-rose-100 text-rose-800 ring-rose-200" },
};

function formatPrice(cents?: number | null) {
  return typeof cents === "number"
    ? new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 0,
      }).format(cents / 100)
    : "Sob consulta";
}

function formatBirthDate(value?: string | Date | null) {
  if (!value) return "Data a confirmar";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data a confirmar";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatAge(value?: string | Date | null) {
  if (!value) return "Idade a confirmar";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Idade a confirmar";
  const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    return `Nasce ${date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`;
  }
  if (diffDays < 30) return `${diffDays} ${diffDays === 1 ? "dia" : "dias"}`;
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} ${months === 1 ? "mês" : "meses"}`;
  }
  const years = Math.floor(diffDays / 365);
  return `${years} ${years === 1 ? "ano" : "anos"}`;
}

const normalizeGender = (value?: string | null) => {
  const gender = (value || "").toLowerCase();
  if (gender === "male" || gender === "macho") return "Macho";
  if (gender === "female" || gender === "femea" || gender === "fêmea") return "Fêmea";
  return "Sexo a definir";
};

type InfoChipProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  helper?: string;
  ariaLabel: string;
};

const InfoChip = ({ icon: Icon, label, value, helper, ariaLabel }: InfoChipProps) => (
  <div
    role="group"
    aria-label={ariaLabel}
    className="inline-flex flex-1 min-w-[180px] items-start gap-2 rounded-2xl border border-zinc-200/80 bg-white/90 px-3 py-2 text-left shadow-sm"
  >
    <span className="mt-0.5 text-emerald-600" aria-hidden="true">
      <Icon className="h-4 w-4" aria-hidden="true" />
    </span>
    <div className="flex flex-col leading-tight">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{label}</span>
      <span className="text-sm font-semibold text-zinc-900">{value}</span>
      {helper ? <span className="text-xs text-zinc-500">{helper}</span> : null}
    </div>
  </div>
);

type RankingFlag = "hot" | "normal" | "slow";

type PuppyCardProps = {
  p: Puppy;
  cover?: string;
  onOpen?: () => void;
  priority?: boolean;
  rankingFlags?: RankingFlag;
  aiBadges?: AiBadgeId[];
};

export default function PuppyCard({ p, cover, onOpen, priority = false, rankingFlags = "normal", aiBadges }: PuppyCardProps) {
  const baseName = p.nome || p.name || "Filhote";
  const color = p.cor || p.color || "Cor em avaliação";
  const gender = normalizeGender(p.sexo || p.sex || p.gender);
  const price = formatPrice(p.priceCents ?? p.price_cents);
  const status = statusStyles[p.status || "disponivel"] || statusStyles.disponivel;
  const birthSource = p.nascimento || p.birthDate;
  const birthDateLabel = formatBirthDate(birthSource);
  const ageLabel = formatAge(birthSource);
  const location = [p.city, p.state].filter(Boolean).join(", ") || "Bragança Paulista, SP";
  const hasVideo = Boolean(p.video_url || p.videoUrl);

  const aiSeo = (p.aiSeo || p.catalogSeo || null) as AiSeoCopy | null;
  const rawShortTitle = aiSeo?.shortTitle || p.shortTitle || null;
  const cardTitle = rawShortTitle && rawShortTitle.trim().length > 0 ? rawShortTitle.trim() : baseName;
  const rawShortDescription = aiSeo?.shortDescription || p.shortDescription || null;
  const shortDescription =
    typeof rawShortDescription === "string" && rawShortDescription.trim().length > 0
      ? rawShortDescription.trim()
      : null;
  const rawSeoKeywords = aiSeo?.seoKeywords || p.seoKeywords;
  const seoKeywords = useMemo(() => {
    if (!Array.isArray(rawSeoKeywords)) return [] as string[];
    return rawSeoKeywords.map((keyword) => keyword?.trim()).filter((keyword): keyword is string => Boolean(keyword));
  }, [rawSeoKeywords]);
  const fallbackAlt = `Filhote Spitz Alemão Anão ${baseName} na cor ${color}, ${gender}, localizado em ${location}. Status ${status.label}.`;
  const imageAlt = aiSeo?.altText || p.altText || fallbackAlt;

  const whatsappLink = useMemo(
    () =>
      buildWhatsAppLink({
        message: `Olá! Vi o filhote ${baseName} (${color}, ${gender}) e quero entender disponibilidade, valor e condições.`,
        utmSource: "site",
        utmMedium: "grid_filhotes",
        utmCampaign: "puppies_cta",
        utmContent: "cta_whatsapp",
      }),
    [baseName, color, gender]
  );

  const optimizedCover = useMemo(() => optimizePuppyCardImage(cover), [cover]);
  const resolvedBadges = useMemo<AiBadgeConfig[]>(() => {
    if (!aiBadges || aiBadges.length === 0) return [];
    return aiBadges
      .map((badge) => AI_BADGE_MAP[badge])
      .filter((badge): badge is AiBadgeConfig => Boolean(badge));
  }, [aiBadges]);

  const [imgLoaded, setImgLoaded] = useState(false);
  const [liked, setLiked] = useState(false);
  const [isPopping, setIsPopping] = useState(false);
  const likeAnimationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<HTMLElement | null>(null);
  const viewTrackedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (likeAnimationTimeout.current) clearTimeout(likeAnimationTimeout.current);
    };
  }, []);

  useEffect(() => {
    viewTrackedRef.current = false;
  }, [p.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!seoKeywords.length) return;
    const target = cardRef.current;
    if (!target || viewTrackedRef.current) return;

    const emitViewEvent = () => {
      if (viewTrackedRef.current) return;
      viewTrackedRef.current = true;
      track.event?.("view_item", {
        placement: "grid",
        puppy_id: p.id,
        seo_keywords: seoKeywords,
        seo_keywords_csv: seoKeywords.join(", "),
      });
    };

    if (!("IntersectionObserver" in window)) {
      emitViewEvent();
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          emitViewEvent();
          observer.disconnect();
        }
      });
    }, { threshold: 0.4 });

    observer.observe(target);
    return () => observer.disconnect();
  }, [p.id, seoKeywords]);

  const cardAriaLabel = `Filhote ${cardTitle}, ${color}, ${gender}, ${status.label.toLowerCase()}`;

  return (
    <article
      role="article"
      aria-label={cardAriaLabel}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-emerald-100/80 bg-white shadow-sm transition duration-200 hover:scale-[1.02] hover:shadow-xl focus-within:shadow-xl"
      data-ranking-flag={rankingFlags}
      ref={cardRef}
    >
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            onOpen?.();
            track.event?.("open_details", { placement: "card", puppy_id: p.id });
          }}
          className="relative block w-full overflow-hidden text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
          data-evt="card_click"
          data-id={p.id}
          aria-label={`Abrir detalhes do filhote ${cardTitle}`}
        >
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100">
            {!imgLoaded && optimizedCover ? <div className="absolute inset-0 animate-pulse bg-zinc-200" aria-hidden="true" /> : null}
            {optimizedCover ? (
              <Image
                src={optimizedCover}
                alt={imageAlt}
                fill
                priority={priority}
                sizes={PUPPY_CARD_SIZES}
                loading={priority ? "eager" : "lazy"}
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                className={`object-cover transition duration-500 ${
                  imgLoaded ? "opacity-100 group-hover:scale-105" : "opacity-0"
                }`}
                onLoad={() => setImgLoaded(true)}
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center gap-2 text-sm text-zinc-500">
                <PawPrint className="h-6 w-6" aria-hidden="true" />
                <span>Imagem em atualização</span>
              </div>
            )}
          </div>
        </button>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            const nextLiked = !liked;
            setLiked(nextLiked);
            setIsPopping(true);
            if (likeAnimationTimeout.current) clearTimeout(likeAnimationTimeout.current);
            likeAnimationTimeout.current = setTimeout(() => setIsPopping(false), 250);
            track.event?.("puppy_like_toggle", { puppy_id: p.id, liked: nextLiked, placement: "grid" });
          }}
          aria-label={liked ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          aria-pressed={liked}
          className={`absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white text-rose-500 shadow-lg ring-1 ring-black/5 transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 ${
            isPopping ? "scale-110" : "scale-100"
          }`}
        >
          <Heart className={`h-5 w-5 ${liked ? "fill-rose-500" : "fill-none"}`} aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-5 pb-5 pt-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${status.className}`}
            aria-label={`Status: ${status.label}`}
          >
            {status.label}
          </span>
          <span className="text-base font-semibold text-emerald-700" aria-label={`Preço ${price}`}>
            {price}
          </span>
        </div>

        {resolvedBadges.length > 0 && (
          <div className="flex flex-wrap gap-2" aria-label="Sinais de interesse previstos pela IA">
            {resolvedBadges.map((badge) => {
              const Icon = badge.icon;
              return (
                <span
                  key={badge.label}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ${badge.className}`}
                  role="status"
                  aria-label={badge.ariaLabel}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{badge.label}</span>
                </span>
              );
            })}
          </div>
        )}

        <div className="space-y-1">
          <h3 className="text-lg font-semibold leading-snug text-zinc-900">
            {cardTitle}
          </h3>
          <p className="text-sm text-zinc-600">
            <span className="font-medium text-zinc-800">{color}</span>
            <span className="mx-1 text-zinc-400" aria-hidden="true">
              •
            </span>
            <span>{gender}</span>
          </p>
          {shortDescription ? (
            <p className="text-xs text-zinc-500 line-clamp-1" aria-label={`Resumo: ${shortDescription}`}>
              {shortDescription}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2" aria-label="Informações do filhote">
          <InfoChip icon={Calendar} label="Nascimento" value={birthDateLabel} helper={ageLabel} ariaLabel={`Nascimento em ${birthDateLabel}, idade ${ageLabel}`} />
          <InfoChip icon={MapPin} label="Local" value={location} helper="Entrega combinada" ariaLabel={`Localização ${location}`} />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Destaques</p>
          <ul className="flex flex-wrap gap-2" aria-label="Destaques do filhote">
            {hasVideo ? (
              <li className="flex flex-1 min-w-[180px] items-center gap-3 rounded-2xl border border-zinc-200/80 bg-white px-3 py-2 shadow-sm" key="video" aria-label="Vídeo ao vivo disponível">
                <span role="img" aria-label="Vídeo ao vivo disponível" className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <Video className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="text-sm">
                  <p className="font-semibold text-zinc-900">Vídeo ao vivo</p>
                  <p className="text-xs text-zinc-500">Atualize em tempo real</p>
                </div>
              </li>
            ) : null}

            <li className="flex flex-1 min-w-[180px] items-center gap-3 rounded-2xl border border-zinc-200/80 bg-white px-3 py-2 shadow-sm" key="mentoria" aria-label="Mentoria vitalícia inclusa">
              <span role="img" aria-label="Mentoria vitalícia inclusa" className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <GraduationCap className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="text-sm">
                <p className="font-semibold text-zinc-900">Mentoria vitalícia</p>
                <p className="text-xs text-zinc-500">Suporte do time By Império</p>
              </div>
            </li>
          </ul>
        </div>

        <div className="mt-auto space-y-3">
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track.event?.("whatsapp_click", { placement: "card", action: "info", puppy_id: p.id })}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-base font-semibold text-white shadow-lg transition duration-200 hover:bg-emerald-500 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
            data-evt="share_click"
            data-id={`wa_info_${p.id}`}
            aria-label={`Conversar no WhatsApp sobre o filhote ${cardTitle}`}
          >
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
            Falar no WhatsApp
          </a>

          {p.slug ? (
            <Link
              href={`/filhotes/${p.slug}`}
              onClick={() => {
                onOpen?.();
                track.event?.("open_details", { placement: "card", puppy_id: p.id, target: "cta_link" });
              }}
              className="inline-flex w-full items-center justify-between text-sm font-semibold text-emerald-700 transition hover:text-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
              data-evt="card_click"
              data-id={p.id}
              aria-label={`Ver detalhes completos do filhote ${cardTitle}`}
            >
              <span>Ver detalhes do filhote</span>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                onOpen?.();
                track.event?.("open_details", { placement: "card", puppy_id: p.id, target: "cta_link" });
              }}
              className="inline-flex w-full items-center justify-between text-sm font-semibold text-emerald-700 transition hover:text-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
              data-evt="card_click"
              data-id={p.id}
              aria-label={`Ver detalhes completos do filhote ${cardTitle}`}
            >
              <span>Ver detalhes do filhote</span>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
