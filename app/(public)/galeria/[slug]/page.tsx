import { ArrowLeft, MessageCircleMore } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  GALLERY_VIDEOS,
  medidaDoVideo,
  videoDaGaleria,
} from "@/domain/gallery-videos";
import { buildWebPageLD } from "@/lib/structured-data";
import { buildWhatsAppLink } from "@/lib/whatsapp";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://byimperiodog.com.br").replace(/\/$/, "");

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return GALLERY_VIDEOS.map((video) => ({ slug: video.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const video = videoDaGaleria(slug);
  if (!video) return {};

  const medida = medidaDoVideo(video.slug);
  const canonical = `${SITE_URL}/galeria/${video.slug}`;

  return {
    // O layout global acrescenta a marca a strings simples; aqui o título já
    // é descritivo e precisa caber inteiro no resultado de busca.
    title: { absolute: video.title },
    description: video.description,
    alternates: { canonical },
    openGraph: {
      type: "video.other",
      url: canonical,
      title: `${video.title} | By Império Dog`,
      description: video.description,
      images: [
        {
          url: `${SITE_URL}${video.poster}`,
          ...(medida ? { width: medida.width, height: medida.height } : {}),
          alt: `Capa do vídeo: ${video.title}`,
        },
      ],
      videos: [
        {
          url: `${SITE_URL}${video.src}`,
          type: "video/mp4",
          ...(medida ? { width: medida.width, height: medida.height } : {}),
        },
      ],
    },
  };
}

export default async function GaleriaVideoPage({ params }: Props) {
  const { slug } = await params;
  const video = videoDaGaleria(slug);
  if (!video) notFound();

  const medida = medidaDoVideo(video.slug);
  const pageUrl = `${SITE_URL}/galeria/${video.slug}`;
  const whatsappUrl = buildWhatsAppLink({
    message: `Olá! Assisti ao vídeo "${video.title}" na galeria da By Império Dog. Quero conhecer os filhotes atuais, os valores e como funciona a reserva.`,
    utmSource: "galeria",
    utmMedium: "video_page",
    utmCampaign: "video_interest",
    utmContent: video.slug,
  });

  const videoLd = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "@id": `${pageUrl}#video`,
    name: video.title,
    description: video.description,
    url: pageUrl,
    contentUrl: `${SITE_URL}${video.src}`,
    thumbnailUrl: [`${SITE_URL}${video.poster}`],
    uploadDate: video.uploadDate,
    ...(medida
      ? {
          duration: medida.duration,
          width: medida.width,
          height: medida.height,
        }
      : {}),
    isFamilyFriendly: true,
    inLanguage: "pt-BR",
    mainEntityOfPage: { "@id": `${pageUrl}#webpage` },
    publisher: { "@id": `${SITE_URL}/#business` },
  };

  const webpageLd = {
    ...buildWebPageLD({
      path: `/galeria/${video.slug}`,
      name: video.title,
      description: video.description,
      image: video.poster,
      imageWidth: medida?.width,
      imageHeight: medida?.height,
    }),
    isPartOf: { "@type": "CollectionPage", "@id": `${SITE_URL}/galeria#webpage` },
    mainEntity: { "@id": `${pageUrl}#video` },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Galeria de vídeos", item: `${SITE_URL}/galeria` },
      { "@type": "ListItem", position: 3, name: video.title, item: pageUrl },
    ],
  };

  return (
    <div className="min-h-screen bg-zinc-950 px-5 py-10 text-white sm:py-16">
      <script
        id="ld-video"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoLd) }}
      />
      <script
        id="ld-video-webpage"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webpageLd) }}
      />
      <script
        id="ld-video-breadcrumb"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <article className="mx-auto max-w-5xl">
        <Link
          href="/galeria"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-emerald-300 transition hover:text-emerald-200"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Voltar à galeria de vídeos
        </Link>

        <header className="mt-6 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400">
            Vídeo real · By Império Dog
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
            {video.title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-zinc-300 sm:text-lg">
            {video.description}
          </p>
        </header>

        <div className="mt-8 overflow-hidden rounded-3xl border border-zinc-800 bg-black shadow-2xl">
          {/* Os arquivos não possuem diálogo falado; o título e a descrição
              visíveis fornecem a alternativa textual equivalente. */}
          <video
            src={video.src}
            poster={video.poster}
            controls
            playsInline
            preload="metadata"
            className="mx-auto max-h-[78vh] w-full object-contain"
            aria-label={`Vídeo: ${video.title}`}
          />
        </div>

        <section className="mt-8 rounded-3xl border border-emerald-900/70 bg-emerald-950/40 p-6 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-8">
          <div>
            <h2 className="text-xl font-bold">Quer conhecer os filhotes atuais?</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-300">
              Fale diretamente com a criadora para consultar opções, valores e como funciona a reserva.
            </p>
          </div>
          <a
            href={whatsappUrl}
            data-wa-placement="gallery"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 text-sm font-bold text-white transition hover:bg-emerald-500 sm:mt-0"
          >
            <MessageCircleMore className="h-5 w-5" aria-hidden />
            Quero conhecer os filhotes
          </a>
        </section>
      </article>
    </div>
  );
}
