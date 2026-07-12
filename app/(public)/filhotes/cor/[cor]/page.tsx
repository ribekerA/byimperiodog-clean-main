import type { Metadata } from "next";
import Script from "next/script";
import { notFound } from "next/navigation";

import ColorPageContent from "@/components/color-page/ColorPageContent";
import { ALL_COLORS, COLOR_SEO, getPuppiesByColor } from "@/lib/catalog-utils";
import { buildBreadcrumbLD, buildFAQLD, buildLocalBusinessLD } from "@/lib/structured-data";
import { buildWhatsAppLink } from "@/lib/whatsapp";

type Props = { params: { cor: string } };

export function generateStaticParams() {
  return ALL_COLORS.map((cor) => ({ cor }));
}

export function generateMetadata({ params }: Props): Metadata {
  const seo = COLOR_SEO[params.cor];
  if (!seo) return { title: "Filhotes por Cor | By Império Dog" };
  const ogImage = `/og/cor/${params.cor}`;

  return {
    title:       seo.seoTitle,
    description: seo.metaDescription,
    alternates:  { canonical: `/filhotes/cor/${params.cor}` },
    openGraph: {
      title:       seo.seoTitle,
      description: seo.metaDescription,
      type:        "website",
      images:      [{ url: ogImage, width: 1200, height: 630, alt: seo.h1 }],
    },
    twitter: {
      card:   "summary_large_image",
      title:  seo.seoTitle,
      images: [ogImage],
    },
  };
}

export default function ColorLandingPage({ params }: Props) {
  const seo = COLOR_SEO[params.cor];
  if (!seo) notFound();

  const puppies  = getPuppiesByColor(params.cor);
  const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br").replace(/\/$/, "");

  const breadcrumbLd = buildBreadcrumbLD([
    { name: "Início",   url: `${SITE_URL}/` },
    { name: "Filhotes", url: `${SITE_URL}/filhotes` },
    { name: seo.h1,     url: `${SITE_URL}/filhotes/cor/${params.cor}` },
  ]);
  const faqLd       = buildFAQLD(seo.faqs);
  const businessLd  = buildLocalBusinessLD();

  const waLink = buildWhatsAppLink({
    message:     `Olá! Tenho interesse em filhotes Spitz Alemão Anão (Lulu da Pomerânia) ${seo.h1}. Pode me informar disponibilidade?`,
    utmSource:   "site",
    utmMedium:   "color_page",
    utmCampaign: "filhote_cor",
    utmContent:  params.cor,
  });

  return (
    <>
      <Script id="ld-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <Script id="ld-faq"        type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <Script id="ld-business"   type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessLd) }} />

      <main>
        <ColorPageContent
          color={params.cor}
          seo={seo}
          puppies={puppies}
          waLink={waLink}
        />
      </main>
    </>
  );
}
