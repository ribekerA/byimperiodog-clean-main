"use client";

/**
 * PuppyCardPremium v5
 * Card premium e persuasivo para marketplace de filhotes
 * - Foto hero é o elemento #1 (aspect ratio estável, overlay leve)
 * - Badges inteligentes + preço em chip premium
 * - CTA principal WhatsApp com microcopy clara e aria-label detalhado
 * - CTA secundário discreto
 * - Acessibilidade AA: role, aria-labels, foco visível, alt obrigatório
 * - JSON-LD de Product embutido para SEO
 */

import { Calendar, ChevronRight, Heart, MapPin, MessageCircle, ShieldCheck, Video, Wand2 } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";

import { Badge, Button, Card, CardContent, CardHeader, StatusBadge } from "@/components/ui";
import type { CatalogBadge } from "@/lib/ai/catalog-badges";
import type { CatalogSeoOutput } from "@/lib/ai/catalog-seo";
import { getNextImageProps } from "@/lib/images";
import { optimizePuppyCardImage } from "@/lib/optimize-image";
import { BLUR_DATA_URL } from "@/lib/placeholders";
import track from "@/lib/track";
import { buildWhatsAppLink } from "@/lib/whatsapp";

type PuppyCardData = {
  id: string;
  name?: string | null;
  slug?: string | null;
  color?: string | null;
  sex?: "male" | "female" | string | null;
  gender?: "male" | "female" | string | null;
  status?: "available" | "reserved" | "sold" | string | null;
  price_cents?: number | null;
  priceCents?: number | null;
  birthDate?: string | Date | null;
  city?: string | null;
  state?: string | null;
  weightKg?: number | null;
  images?: string[] | null;
  aiSeo?: CatalogSeoOutput | null;
  catalogSeo?: CatalogSeoOutput | null;
};

type PuppyCardProps = {
  puppy: PuppyCardData;
  coverImage?: string | null;
  badges?: CatalogBadge[];
  priority?: boolean;
  onOpenDetails?: () => void;
  onWhatsAppClick?: () => void;
};

const formatPrice = (cents?: number | null) =>
  typeof cents === "number" && cents > 0
    ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(cents / 100)
    : "Sob consulta";

function formatAge(birth?: string | Date | null): { label: string; months?: number } {
  if (!birth) return { label: "Idade a confirmar" };
  const d = new Date(birth);
  if (Number.isNaN(d.getTime())) return { label: "Idade a confirmar" };
  const diffDays = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: `Nasce ${d.toLocaleDateString("pt-BR")}` };
  if (diffDays < 30) return { label: `${diffDays} dias` };
  const months = Math.floor(diffDays / 30);
  return { label: months === 1 ? "1 mês" : `${months} meses`, months };
}

function normalizeStatus(status?: string | null) {
  const v = (status || "available").toLowerCase();
  if (v === "sold" || v === "vendido") return { label: "Vendido", color: "bg-rose-100 text-rose-800" };
  if (v === "reserved" || v === "reservado") return { label: "Reservado", color: "bg-amber-100 text-amber-800" };
  return { label: "Disponível", color: "bg-emerald-100 text-emerald-800" };
}

function normalizeSex(sex?: string | null) {
  const v = (sex || "").toLowerCase();
  if (v.includes("male") || v.includes("macho")) return "Macho";
  if (v.includes("female") || v.includes("fêmea") || v.includes("femea")) return "Fêmea";
  return "A definir";
}

function buildSeo(puppy: PuppyCardData, fallbacks: { name: string; color: string; gender: string; location: string; priceCents: number }) {
  const aiSeo = puppy.aiSeo || puppy.catalogSeo || null;
  const shortTitle = aiSeo?.shortTitle || `${fallbacks.name} - ${fallbacks.color} ${fallbacks.gender}`;
  const shortDescription =
    aiSeo?.shortDescription ||
    `Spitz Alemão Anão ${fallbacks.gender}, cor ${fallbacks.color}, ${fallbacks.location}. ${formatPrice(fallbacks.priceCents)}.`;
  const altText =
    aiSeo?.altText ||
    `Filhote Spitz Alemão Anão ${fallbacks.gender.toLowerCase()} na cor ${fallbacks.color}, localizado em ${fallbacks.location}.`;
  const seoKeywords = aiSeo?.seoKeywords || aiSeo?.focusedKeywords || [];
  const structured = aiSeo?.structuredDataSnippets;

  return { shortTitle, shortDescription, altText, seoKeywords, structured };
}

export default function PuppyCardPremium({
  puppy,
  coverImage,
  badges = [],
  priority = false,
  onOpenDetails,
  onWhatsAppClick,
}: PuppyCardProps) {
  const [liked, setLiked] = useState(false);
  const priceCents = puppy.priceCents ?? puppy.price_cents ?? 0;
  const status = normalizeStatus(puppy.status);
  const gender = normalizeSex(puppy.sex || puppy.gender);
  const color = puppy.color || "Cor em avaliação";
  const name = puppy.name || "Spitz Alemão Anão";
  const age = formatAge(puppy.birthDate);
  const location = [puppy.city, puppy.state].filter(Boolean).join(", ") || "São Paulo, SP";
  const priceLabel = formatPrice(priceCents);
  const mainImage = coverImage || puppy.images?.[0] || null;

  const seo = buildSeo(puppy, {
    name,
    color,
    gender,
    location,
    priceCents,
  });

  const promoBadge = useMemo(() => {
    if (badges.length > 0) return badges[0];
    if (age.months !== undefined && age.months < 1) return {
      key: "new",
      label: "Recém-chegado",
      icon: "🌱",
      priority: 50,
      ariaLabel: "Filhote recém-chegado",
      color: "#0f766e",
      bgColor: "#ecfeff",
      textColor: "#0f172a"
    };
    return null;
  }, [badges, age.months]);

  const imgProps = useMemo(() => {
    if (mainImage) return { src: optimizePuppyCardImage(mainImage), width: 800, height: 600 };
    if (puppy.slug) {
      try {
        return getNextImageProps(puppy.slug, "card", { priority });
      } catch {
        return null;
      }
    }
    return null;
  }, [mainImage, puppy.slug, priority]);

  const whatsappUrl = useMemo(
    () =>
      buildWhatsAppLink({
        message: `Olá! Quero falar sobre o filhote ${name} (${color}, ${gender}). Pode me ajudar com disponibilidade e condições?`,
        utmSource: "site",
        utmMedium: "catalog_card",
        utmCampaign: "puppies_premium",
        utmContent: "cta_main",
      }),
    [name, color, gender],
  );

  const productLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: seo.shortTitle,
    description: seo.shortDescription,
    brand: { "@type": "Brand", name: "By Império Dog" },
    image: mainImage,
    url: puppy.slug ? `/filhotes/${puppy.slug}` : undefined,
    color,
    gender,
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      price: priceCents / 100,
      availability:
        status.label === "Disponível"
          ? "https://schema.org/InStock"
          : status.label === "Reservado"
            ? "https://schema.org/PreOrder"
            : "https://schema.org/OutOfStock",
    },
  };

  const ctaLabel = "Falar no WhatsApp — resposta imediata";
  const conciseDescription = `${color} · ${gender} · ${age.label}`;

  return (
    <Card
      role="article"
      itemScope
      itemType="https://schema.org/Product"
      variant="elevated"
      interactive
      className="group relative h-full overflow-hidden rounded-3xl border border-[var(--border)] shadow-sm focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-2"
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />

      <CardHeader noPadding>
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-b-none rounded-t-3xl">
          {imgProps && typeof imgProps.src === "string" ? (
            <Image
              src={imgProps.src}
              width={imgProps.width}
              height={imgProps.height}
              alt={seo.altText}
              priority={priority}
              fetchPriority={priority ? "high" : "auto"}
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-[var(--surface-2)] text-sm text-[var(--text-muted)]">
              Sem imagem
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/10 to-transparent" aria-hidden />

          <div className="absolute left-3 right-3 top-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <StatusBadge status={puppy.status as any} className="text-xs font-semibold" />
              {promoBadge && (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold shadow-sm"
                  style={{
                    backgroundColor: ("bgColor" in promoBadge && promoBadge.bgColor) ? promoBadge.bgColor : "#ecfeff",
                    color: ("textColor" in promoBadge && promoBadge.textColor) ? promoBadge.textColor : "#0f172a"
                  }}
                  aria-label={"ariaLabel" in promoBadge && promoBadge.ariaLabel ? promoBadge.ariaLabel : promoBadge.label}
                >
                  <span aria-hidden>{("icon" in promoBadge && promoBadge.icon) ? promoBadge.icon : "⭐"}</span>
                  {promoBadge.label}
                </span>
              )}
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-[var(--text)] shadow-sm ring-1 ring-[var(--border)]">
              {priceLabel}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setLiked((v) => !v)}
            aria-pressed={liked}
            aria-label={liked ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            className="absolute right-3 bottom-3 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-rose-500 shadow-sm ring-1 ring-[var(--border)] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            <Heart className={`h-5 w-5 ${liked ? "fill-rose-500" : ""}`} aria-hidden />
          </button>

          <span
            className="absolute left-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-black/50 px-3 py-1 text-xs font-semibold text-white backdrop-blur"
            aria-label="Foto real e atualizada"
          >
            <ShieldCheck className="h-4 w-4" aria-hidden />
            Foto real / atualizada
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3 px-4 py-4 sm:px-5">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--text-muted)]">By Império Dog</p>
          <h3 className="text-lg font-semibold leading-tight text-[var(--text)]" itemProp="name">
            {seo.shortTitle}
          </h3>
          <p className="text-sm text-[var(--text-muted)]" itemProp="description">
            {conciseDescription}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--text)]">
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--surface)] px-3 py-1">{color}</span>
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--surface)] px-3 py-1">{gender}</span>
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--surface)] px-3 py-1">{age.label}</span>
          {puppy.weightKg ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--surface)] px-3 py-1">
              {puppy.weightKg.toFixed(1)} kg
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-[var(--text)]">
          <span className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 py-2 shadow-xs">
            <Calendar className="h-4 w-4" aria-hidden />
            <span className="flex flex-col leading-tight">
              <strong className="font-semibold">
                {puppy.birthDate ? new Date(puppy.birthDate).toLocaleDateString("pt-BR") : "Nascimento"}
              </strong>
              <span className="text-[12px] text-[var(--text-muted)]">{age.label}</span>
            </span>
          </span>
          <span className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 py-2 shadow-xs">
            <MapPin className="h-4 w-4" aria-hidden />
            <span className="flex flex-col leading-tight">
              <strong className="font-semibold capitalize">{location}</strong>
              <span className="text-[12px] text-[var(--text-muted)]">Entrega combinada</span>
            </span>
          </span>
        </div>

        <div className="mt-2 flex flex-col gap-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            onClick={() => {
              onWhatsAppClick?.();
              track.event?.("cta_whatsapp", { id: puppy.id, source: "card_premium" });
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            aria-label={`Falar com atendente sobre o filhote ${name}`}
            itemProp="offers"
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            {ctaLabel}
          </a>
          <button
            type="button"
            onClick={onOpenDetails}
            className="inline-flex items-center justify-between gap-2 rounded-full px-3 py-2 text-sm font-semibold text-[var(--text)] transition hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            aria-label={`Ver detalhes e condições do filhote ${name}`}
          >
            <span className="inline-flex items-center gap-2">
              <ChevronRight className="h-4 w-4" aria-hidden /> Ver detalhes e condições
            </span>
            <span className="text-[var(--text-muted)]">{priceLabel}</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 ring-1 ring-[var(--border)]">
            <Video className="h-4 w-4" aria-hidden /> Vídeo ao vivo
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 ring-1 ring-[var(--border)]">
            <ShieldCheck className="h-4 w-4" aria-hidden /> Mentoria vitalícia
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 ring-1 ring-[var(--border)]">
            <Wand2 className="h-4 w-4" aria-hidden /> Socialização guiada
          </span>
        </div>

        {seo.seoKeywords.length > 0 && (
          <meta itemProp="keywords" content={seo.seoKeywords.join(", ")} />
        )}
      </CardContent>
    </Card>
  );
}
