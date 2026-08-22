import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ColorPageContent from "@/components/color-page/ColorPageContent";
import { ALL_COLORS, COLOR_SEO, getPuppiesByColor } from "@/lib/catalog-utils";
import { OG_DEFAULT_IMAGE } from "@/lib/seo";
import { buildBreadcrumbLD, buildFAQLD, buildLocalBusinessLD } from "@/lib/structured-data";
import { buildWhatsAppLink } from "@/lib/whatsapp";

type Props = { params: { cor: string } };

export function generateStaticParams() {
  return ALL_COLORS.map((cor) => ({ cor }));
}

export function generateMetadata({ params }: Props): Metadata {
  const seo = COLOR_SEO[params.cor];
  if (!seo) return { title: "Filhotes por Cor" };
  // A rota /og/cor/[cor] nunca chegou a devolver imagem: quebrava no Satori
  // ("Expected <div> to have explicit display: flex"), buscava a foto em outro
  // domínio (canilspitzalemao.com.br) e baixava fonte de emoji em tempo de
  // requisição. Estas 4 páginas ficavam sem og:image no WhatsApp. A foto de um
  // filhote da própria cor é arquivo estático e sempre responde.
  const colorPhoto = getPuppiesByColor(params.cor)
    .flatMap((p) => p.images ?? [])
    .find((img) => !img.endsWith(".mp4"));
  // Sem width/height: a foto do filhote não é 1200×630, e declarar essa medida
  // fazia o WhatsApp recortar errado.
  const ogImages = colorPhoto ? [{ url: colorPhoto, alt: seo.h1 }] : [OG_DEFAULT_IMAGE];

  return {
    title:       seo.seoTitle,
    description: seo.metaDescription,
    alternates:  { canonical: `/filhotes/cor/${params.cor}` },
    openGraph: {
      title:       seo.seoTitle,
      description: seo.metaDescription,
      type:        "website",
      images:      ogImages,
    },
    twitter: {
      card:   "summary_large_image",
      title:  seo.seoTitle,
      images: ogImages,
    },
  };
}

export default function ColorLandingPage({ params }: Props) {
  const seo = COLOR_SEO[params.cor];
  if (!seo) notFound();

  const puppies  = getPuppiesByColor(params.cor);
  const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://byimperiodog.com.br").replace(/\/$/, "");

  const breadcrumbLd = buildBreadcrumbLD([
    { name: "Início",   url: `${SITE_URL}/` },
    { name: "Filhotes", url: `${SITE_URL}/filhotes` },
    { name: seo.h1,     url: `${SITE_URL}/filhotes/cor/${params.cor}` },
  ]);
  const faqLd       = buildFAQLD(seo.faqs);
  const businessLd  = buildLocalBusinessLD();

  const waLink = buildWhatsAppLink({
    message:     `Olá! Tenho interesse em filhotes Spitz Alemão Anão ${seo.h1}. Pode me informar disponibilidade?`,
    utmSource:   "site",
    utmMedium:   "color_page",
    utmCampaign: "filhote_cor",
    utmContent:  params.cor,
  });

  return (
    <>
      <script id="ld-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script id="ld-faq"        type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script id="ld-business"   type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessLd) }} />

      <div>
        <ColorPageContent
          color={params.cor}
          seo={seo}
          puppies={puppies}
          waLink={waLink}
        />
      </div>
    </>
  );
}
