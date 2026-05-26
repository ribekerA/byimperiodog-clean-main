import type { Metadata } from "next";
import Link from "next/link";
import NextDynamic from "next/dynamic";
import { notFound } from "next/navigation";
import Script from "next/script";

import PuppyCinematicGallery from "@/components/catalog/PuppyCinematicGallery";
import PuppyDetailPanel from "@/components/catalog/PuppyDetailPanel";
import PuppyViewerCount from "@/components/catalog/PuppyViewerCount";
import { TiltCard } from "@/components/motion/TiltCard";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { StaggerContainer, StaggerItem } from "@/components/motion/StaggerContainer";
import { staticPuppies } from "@/content/puppies-static";
import { formatPrice, getPuppyBySlug } from "@/lib/catalog-utils";
import { buildBreadcrumbLD, buildLocalBusinessLD, buildPuppyProductLD } from "@/lib/structured-data";
import { buildWhatsAppLink } from "@/lib/whatsapp";

// Sistema de reviews (client-only)
const PuppyReviews = NextDynamic(
  () => import("@/components/reviews/PuppyReviews"),
  { ssr: false, loading: () => null }
);

// Componentes client-only (sem SSR)
const PuppyStickyFloatingCTA = NextDynamic(
  () => import("@/components/catalog/PuppyStickyFloatingCTA"),
  { ssr: false }
);
const UrgencyCountdown = NextDynamic(
  () => import("@/components/catalog/UrgencyCountdown"),
  { ssr: false }
);
const VisitorActivityToast = NextDynamic(
  () => import("@/components/catalog/VisitorActivityToast"),
  { ssr: false }
);

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Props = { params: { slug: string } };

// ─── Static params ────────────────────────────────────────────────────────────

export function generateStaticParams() {
  return staticPuppies.map((p) => ({ slug: p.slug }));
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export function generateMetadata({ params }: Props): Metadata {
  const puppy = getPuppyBySlug(params.slug);
  if (!puppy) return { title: "Filhote não encontrado | By Império Dog" };

  const sexLabel = puppy.sex === "female" ? "Fêmea" : "Macho";
  const corLabel = (puppy as any).cor ?? puppy.color ?? "";
  const title = `${puppy.name} — Spitz Alemão Anão (Lulu da Pomerânia) ${corLabel} ${sexLabel} | By Império Dog`;
  const description =
    (puppy as any).description ??
    `Filhote Spitz Alemão Anão (Lulu da Pomerânia) ${corLabel} ${sexLabel} em Bragança Paulista, SP. Registro oficial, laudos veterinários e mentoria vitalícia. By Império Dog.`;
  const firstImage = puppy.images?.find((img: string) => !img.endsWith(".mp4"));

  const ogImage = `/og/filhote/${puppy.slug}`;

  return {
    title,
    description: description.slice(0, 160),
    alternates: { canonical: `/filhotes/${puppy.slug}` },
    openGraph: {
      title,
      description,
      type:   "website",
      url:    `/filhotes/${puppy.slug}`,
      images: [{ url: ogImage, width: 1200, height: 630, alt: puppy.name }],
    },
    twitter: {
      card:        "summary_large_image",
      title,
      description,
      images:      [ogImage],
    },
  };
}

// ─── Mapa de cor → glow (TiltCard dos relacionados) ──────────────────────────

const COLOR_GLOW: Record<string, string> = {
  creme:        "rgba(243,181,98,0.45)",
  laranja:      "rgba(249,115,22,0.40)",
  preto:        "rgba(161,161,170,0.30)",
  "wolf-sable": "rgba(99,102,241,0.35)",
  branco:       "rgba(255,255,255,0.30)",
};
const DEFAULT_GLOW = "rgba(52,211,153,0.30)";

const STATUS_LABEL: Record<string, string> = {
  available:  "Disponível",
  disponivel: "Disponível",
  reserved:   "Reservado",
  reservado:  "Reservado",
  sold:       "Vendido",
  vendido:    "Vendido",
};

// ─── Página ────────────────────────────────────────────────────────────────────

export default function PuppyPage({ params }: Props) {
  const puppy = getPuppyBySlug(params.slug);
  if (!puppy) notFound();

  const sexLabel  = puppy.sex === "female" ? "Fêmea" : "Macho";
  const sexSlug   = puppy.sex === "female" ? "femea" : "macho";
  const corLabel  = (puppy as any).cor ?? puppy.color ?? "";
  const colorSlug = (puppy.color ?? (puppy as any).cor ?? "").toLowerCase();
  const description =
    (puppy as any).description ??
    `Filhote Spitz Alemão Anão (Lulu da Pomerânia) ${corLabel} ${sexLabel} em Bragança Paulista, SP. Registro oficial, laudos veterinários e mentoria vitalícia inclusa.`;

  const status = ((puppy.status ?? "available") as string) as "available" | "reserved" | "sold";
  const isSold = status === "sold" || status === "vendido" as string;

  const waLink = buildWhatsAppLink({
    message: `Olá! Vi o filhote ${puppy.name} (${corLabel}, ${sexLabel}) no site e quero saber disponibilidade e condições.`,
    utmSource: "site",
    utmMedium: "puppy_page",
    utmCampaign: "filhote_detalhe",
    utmContent: puppy.slug,
  });

  const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br").replace(/\/$/, "");

  const productLd    = buildPuppyProductLD(puppy as any);
  const breadcrumbLd = buildBreadcrumbLD([
    { name: "Início",    url: `${SITE_URL}/` },
    { name: "Filhotes",  url: `${SITE_URL}/filhotes` },
    { name: puppy.name,  url: `${SITE_URL}/filhotes/${puppy.slug}` },
  ]);
  const businessLd = buildLocalBusinessLD();

  const related = staticPuppies
    .filter((p) => p.slug !== puppy.slug && p.color === puppy.color && p.status !== "sold")
    .slice(0, 3);

  const availableOfSameColor = staticPuppies.filter(
    (p) => p.color === puppy.color && p.status !== "sold" && p.status !== "vendido"
  ).length;

  const coverImage = puppy.images?.find((img: string) => !img.endsWith(".mp4"));

  return (
    <>
      {/* JSON-LD */}
      <Script id="ld-product"    type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />
      <Script id="ld-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <Script id="ld-business"   type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessLd) }} />

      <main className="mx-auto max-w-6xl px-4 py-6 pb-28 sm:px-6 sm:py-8 lg:px-10 lg:pb-16">

        {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
        <nav aria-label="Navegação estrutural" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-zinc-500">
            <li><Link href="/" className="hover:text-emerald-700 hover:underline">Início</Link></li>
            <li aria-hidden="true" className="text-zinc-300">/</li>
            <li><Link href="/filhotes" className="hover:text-emerald-700 hover:underline">Filhotes</Link></li>
            <li aria-hidden="true" className="text-zinc-300">/</li>
            <li className="font-medium text-zinc-900" aria-current="page">{puppy.name}</li>
          </ol>
        </nav>

        {/* ── Grid principal ─────────────────────────────────────────────── */}
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">

          {/* Galeria cinematográfica */}
          <PuppyCinematicGallery
            images={puppy.images ?? []}
            puppyName={puppy.name}
            puppyColor={corLabel}
            puppySex={sexLabel}
            puppyId={puppy.slug}
          />

          {/* Painel de detalhes */}
          <div className="flex flex-col gap-4">
            <PuppyDetailPanel
              name={puppy.name}
              corLabel={corLabel}
              colorSlug={colorSlug}
              sexLabel={sexLabel}
              sexSlug={sexSlug}
              status={status}
              priceCents={(puppy as any).priceCents ?? (puppy as any).price_cents}
              description={description}
              availableOfSameColor={availableOfSameColor}
              waLink={waLink}
              slug={puppy.slug}
            />

            {/* Social proof — viewer count */}
            {!isSold && <PuppyViewerCount puppyId={puppy.slug} />}

            {/* Countdown de reserva */}
            <UrgencyCountdown puppyId={puppy.slug} status={puppy.status ?? "available"} />
          </div>
        </div>

        {/* ── Avaliações das famílias ────────────────────────────────────── */}
        <PuppyReviews puppySlug={puppy.slug} puppyName={puppy.name} />

        {/* ── Filhotes relacionados ──────────────────────────────────────── */}
        {related.length > 0 && (
          <section className="mt-14 sm:mt-20" aria-labelledby="related-heading">
            <ScrollReveal>
              <h2
                id="related-heading"
                className="mb-6 text-xl font-bold text-zinc-900"
              >
                Outros filhotes {corLabel} disponíveis
              </h2>
            </ScrollReveal>

            <StaggerContainer stagger={0.1} delay={0.05} margin="-40px">
              <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
                {related.map((rel) => {
                  const relSex    = rel.sex === "female" ? "Fêmea" : "Macho";
                  const relCor    = (rel as any).cor ?? rel.color ?? "";
                  const relCorKey = (rel.color ?? relCor).toLowerCase();
                  const relImg    = rel.images?.find((img: string) => !img.endsWith(".mp4"));
                  const relStatus = rel.status ?? "available";
                  const glowColor = COLOR_GLOW[relCorKey] ?? DEFAULT_GLOW;

                  return (
                    <StaggerItem key={rel.slug}>
                      <li>
                        <TiltCard glowColor={glowColor} maxTilt={7}>
                          <Link
                            href={`/filhotes/${rel.slug}`}
                            className="group block overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm transition hover:shadow-md"
                          >
                            <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100">
                              {relImg && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={relImg}
                                  alt={`Filhote ${rel.name}`}
                                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.06]"
                                  loading="lazy"
                                />
                              )}
                              <div
                                className="absolute inset-0"
                                style={{ background: "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.45) 100%)" }}
                                aria-hidden="true"
                              />
                              <span className="absolute bottom-2 left-3 text-sm font-bold text-white drop-shadow">
                                {rel.name}
                              </span>
                            </div>
                            <div className="p-3">
                              <span className={`mb-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                relStatus === "available" || relStatus === "disponivel"
                                  ? "bg-emerald-50 text-emerald-800"
                                  : "bg-amber-50 text-amber-800"
                              }`}>
                                {STATUS_LABEL[relStatus] ?? "Disponível"}
                              </span>
                              <p className="mt-1 text-sm text-zinc-500">{relCor} · {relSex}</p>
                              {(rel as any).priceCents > 0 && (
                                <p className="mt-1 text-sm font-bold text-emerald-700">
                                  {formatPrice((rel as any).priceCents)}
                                </p>
                              )}
                            </div>
                          </Link>
                        </TiltCard>
                      </li>
                    </StaggerItem>
                  );
                })}
              </ul>
            </StaggerContainer>
          </section>
        )}

        {/* ── Voltar ────────────────────────────────────────────────────── */}
        <div className="mt-12 text-center">
          <Link
            href="/filhotes"
            className="inline-flex items-center gap-2 rounded-full border-2 border-zinc-200 px-6 py-3 text-sm font-semibold text-zinc-700 transition hover:border-emerald-500 hover:text-emerald-700"
          >
            ← Ver todos os filhotes disponíveis
          </Link>
        </div>
      </main>

      {/* ── Toasts de atividade de visitantes ─────────────────────────── */}
      <VisitorActivityToast puppyId={puppy.slug} isSold={isSold} initialDelay={20000} />

      {/* ── CTA flutuante (desktop card + mobile barra) ────────────────── */}
      <PuppyStickyFloatingCTA
        name={puppy.name}
        coverImage={coverImage}
        priceCents={(puppy as any).priceCents ?? (puppy as any).price_cents}
        waLink={waLink}
        status={puppy.status ?? "available"}
      />
    </>
  );
}
