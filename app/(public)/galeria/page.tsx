import type { Metadata } from "next";
import Link from "next/link";

import { GALLERY_VIDEOS, medidaDoVideo } from "@/domain/gallery-videos";
import { OG_DEFAULT_IMAGE } from "@/lib/seo";

import GaleriaClient from "./GaleriaClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://byimperiodog.com.br";

export const metadata: Metadata = {
  title: "Galeria de Vídeos do Spitz Alemão Anão",
  description:
    "Assista aos nossos Spitz Alemão Anão em movimento. Vídeos reais dos filhotes, ninhadas e do canil By Império Dog em Bragança Paulista, SP.",
  keywords: [
    "vídeos Spitz Alemão Anão",
    "galeria Lulu da Pomerânia",
    "filhotes Spitz vídeo",
    "By Império Dog galeria",
    "canil Spitz vídeos",
  ],
  alternates: { canonical: `${SITE_URL}/galeria` },
  openGraph: {
    images: [OG_DEFAULT_IMAGE],
    type: "website",
    url: `${SITE_URL}/galeria`,
    title: "Galeria de Vídeos do Spitz Alemão Anão | By Império Dog",
    description:
      "Veja nossos Spitz Alemão Anão em movimento. Filhotes, ninhadas e muito mais.",
  },
};

// JSON-LD VideoObject.
//
// Cada VideoObject apontava para `${SITE_URL}/og-image.jpg` — arquivo que não
// existe em public/ — e declarava `uploadDate: "2024-01-01"` nos doze. Miniatura
// 404 e data igual para tudo é metadado que o Google descarta.
//
// Agora a capa é a do próprio vídeo, a data é a de cada um (quando aquele
// arquivo passou a ser servido pelo site) e largura/altura/duração são
// medidas do arquivo, não digitadas.
const videoObjectLd = GALLERY_VIDEOS.map((v) => {
  const medida = medidaDoVideo(v.slug);
  return {
    "@type": "VideoObject",
    "@id": `${SITE_URL}/galeria#${v.slug}`,
    name: v.title,
    description: v.description,
    contentUrl: `${SITE_URL}${v.src}`,
    thumbnailUrl: `${SITE_URL}${v.poster}`,
    uploadDate: v.uploadDate,
    // Omitidos enquanto o poster do vídeo não tiver sido gerado: campo ausente
    // é melhor do que campo chutado.
    ...(medida ? { duration: medida.duration, width: medida.width, height: medida.height } : {}),
    isFamilyFriendly: true,
    inLanguage: "pt-BR",
    publisher: {
      "@type": "Organization",
      name: "By Império Dog",
      url: SITE_URL,
    },
  };
});

const breadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Início", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "Galeria de Vídeos", item: `${SITE_URL}/galeria` },
  ],
};

export default function GaleriaPage() {
  return (
    <>
      <script
        id="ld-galeria-breadcrumb"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        id="ld-galeria-videos"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": videoObjectLd }) }}
      />

      <div className="min-h-screen bg-zinc-950 pb-24">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-emerald-950 via-zinc-900 to-zinc-950 px-5 py-20 text-center sm:py-28">
          <div className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage: "radial-gradient(circle at 30% 50%, #059669 0%, transparent 60%), radial-gradient(circle at 70% 50%, #065f46 0%, transparent 60%)",
            }}
          />
          <div className="relative mx-auto max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-800/60 bg-emerald-900/40 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-400">
              Galeria Oficial
            </span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Conheça nossos filhotes de Spitz Alemão Anão (Lulu da Pomerânia) em movimento{" "}
              <span aria-hidden>🐾</span>
            </h1>
            {/* "estrutura" prometia instalações que não existem — mesmo caso da
                legenda do primeiro vídeo. Fica só o que os vídeos mostram. */}
            <p className="mt-4 text-lg text-zinc-300">
              Vídeos reais dos filhotes e das ninhadas da By Império Dog.
              Sem filtro — exatamente como eles são.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/filhotes"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-500 transition px-6 py-3 text-sm font-semibold text-white shadow-lg"
              >
                Ver filhotes disponíveis →
              </Link>
              <Link
                href="/sobre"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-700 hover:border-emerald-700 transition px-6 py-3 text-sm font-semibold text-zinc-300"
              >
                Conhecer o canil
              </Link>
            </div>
          </div>
        </section>

        {/* Video grid */}
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <GaleriaClient videos={[...GALLERY_VIDEOS]} />
        </section>

        {/* Sticky bottom CTA — `data-wa-safe-zone` faz o botão flutuante de
            WhatsApp sumir enquanto ele estiver por cima: na tela do celular os
            dois se sobrepunham no canto direito. */}
        <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pb-4 px-4 pointer-events-none">
          <Link
            href="/filhotes"
            data-wa-safe-zone
            className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-500 transition shadow-2xl px-8 py-3 text-sm font-bold text-white"
          >
            Ver filhotes disponíveis →
          </Link>
        </div>
      </div>
    </>
  );
}
