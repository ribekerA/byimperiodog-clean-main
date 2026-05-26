import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";

import GaleriaClient from "./GaleriaClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.byimperiodog.com.br";

export const metadata: Metadata = {
  title: "Galeria de Vídeos | Spitz Alemão Anão By Império Dog",
  description:
    "Assista aos nossos Spitz Alemão Anão (Lulu da Pomerânia) em movimento. Vídeos reais dos filhotes, ninhadas e do canil By Império Dog em Bragança Paulista, SP.",
  keywords: [
    "vídeos Spitz Alemão Anão",
    "galeria Lulu da Pomerânia",
    "filhotes Spitz vídeo",
    "By Império Dog galeria",
    "canil Spitz vídeos",
  ],
  alternates: { canonical: `${SITE_URL}/galeria` },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/galeria`,
    title: "Galeria de Vídeos | Spitz Alemão Anão By Império Dog",
    description:
      "Veja nossos Spitz Alemão Anão em movimento. Filhotes, ninhadas e muito mais.",
  },
};

// Curated videos with humanized titles and descriptions
export const GALLERY_VIDEOS = [
  {
    src: "/filhotes/videos/apresentacao-canil.mp4",
    title: "Apresentação do Canil",
    description: "Conheça a estrutura da By Império Dog: maternidade, área de socialização e muito afeto.",
    category: "canil",
  },
  {
    src: "/filhotes/videos/creme-dupla.mp4",
    title: "Dupla Creme",
    description: "Dois Spitz creme juntos — pura fofura em dobro.",
    category: "creme",
  },
  {
    src: "/filhotes/videos/laranja-femea-jardim.mp4",
    title: "Fêmea Laranja no Jardim",
    description: "Nossa Spitz laranja explorando o jardim com toda a energia da raça.",
    category: "laranja",
  },
  {
    src: "/filhotes/videos/laranja-macho-jardim.mp4",
    title: "Macho Laranja no Jardim",
    description: "Spitz laranja macho brincando livremente no espaço externo.",
    category: "laranja",
  },
  {
    src: "/filhotes/videos/ninhada-creme-01.mp4",
    title: "Ninhada Creme",
    description: "Uma ninhada inteira de Spitz creme — veja como são criados desde os primeiros dias.",
    category: "ninhada",
  },
  {
    src: "/filhotes/videos/ninhada-jun22-01.mp4",
    title: "Ninhada Junho 2022 — Vol. 1",
    description: "Ninhada especial de junho de 2022, cheia de personalidade e saúde.",
    category: "ninhada",
  },
  {
    src: "/filhotes/videos/ninhada-jun22-02.mp4",
    title: "Ninhada Junho 2022 — Vol. 2",
    description: "Continuação da ninhada de junho — momentos únicos de crescimento.",
    category: "ninhada",
  },
  {
    src: "/filhotes/videos/ninhada-laranja-01.mp4",
    title: "Ninhada Laranja",
    description: "Ninhada com filhotes laranja — uma das cores mais cobiçadas da raça.",
    category: "ninhada",
  },
  {
    src: "/filhotes/videos/spitz-anao.mp4",
    title: "Spitz Alemão Anão",
    description: "O Spitz Alemão Anão em todo o seu esplendor — temperamento alegre e pelagem densa.",
    category: "raça",
  },
  {
    src: "/filhotes/videos/spitz-branco.mp4",
    title: "Spitz Branco",
    description: "Beleza e elegância do Spitz branco — pelagem imponente e olhar expressivo.",
    category: "branco",
  },
  {
    src: "/filhotes/videos/spitz-creme.mp4",
    title: "Spitz Creme",
    description: "O creme é uma das tonalidades mais queridas pelos tutores. Veja a diferença.",
    category: "creme",
  },
  {
    src: "/filhotes/videos/spitz-laranja-macho.mp4",
    title: "Spitz Laranja Macho",
    description: "Macho laranja com toda a vivacidade típica do Spitz Alemão Anão.",
    category: "laranja",
  },
  {
    src: "/filhotes/videos/wolf-sable-jardim.mp4",
    title: "Wolf Sable no Jardim",
    description: "O wolf sable é raro e incrível — pelagem única que lembra um mini lobo.",
    category: "wolf",
  },
] as const;

export type GalleryVideo = (typeof GALLERY_VIDEOS)[number];

// JSON-LD VideoObject for SEO
const videoObjectLd = GALLERY_VIDEOS.map((v) => ({
  "@type": "VideoObject",
  name: v.title,
  description: v.description,
  contentUrl: `${SITE_URL}${v.src}`,
  thumbnailUrl: `${SITE_URL}/og-image.jpg`,
  uploadDate: "2024-01-01",
  publisher: {
    "@type": "Organization",
    name: "By Império Dog",
    url: SITE_URL,
  },
}));

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
      <Script
        id="ld-galeria-breadcrumb"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <Script
        id="ld-galeria-videos"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": videoObjectLd }) }}
      />

      <main className="min-h-screen bg-zinc-950 pb-24">
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
              Conheça os nossos Spitz em movimento{" "}
              <span aria-hidden>🐾</span>
            </h1>
            <p className="mt-4 text-lg text-zinc-300">
              Vídeos reais dos filhotes, ninhadas e estrutura da By Império Dog.
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
          <GaleriaClient videos={GALLERY_VIDEOS as unknown as GalleryVideo[]} />
        </section>

        {/* Sticky bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pb-4 px-4 pointer-events-none">
          <Link
            href="/filhotes"
            className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-500 transition shadow-2xl px-8 py-3 text-sm font-bold text-white"
          >
            Ver filhotes disponíveis →
          </Link>
        </div>
      </main>
    </>
  );
}
