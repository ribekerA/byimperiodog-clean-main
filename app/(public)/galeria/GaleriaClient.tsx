"use client";

/**
 * GaleriaClient — grade de vídeos da /galeria.
 *
 * No celular a grade é 9:16 em duas colunas e o toque abre o player vertical
 * em tela cheia (VideoReelsPlayer). No desktop continua a grade 16:9 com o
 * lightbox de sempre.
 *
 * Motivo do 9:16: 12 dos 13 arquivos desta página são verticais na origem
 * (352x640, 360x640, 720x1280). No card 16:9 com `object-cover` aparecia só
 * 31% da altura do quadro — era por isso que o vídeo da dupla creme mostrava
 * quase só grama.
 */

import { Play } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { MediaLikeButton } from "@/components/media/MediaLikeButton";
import { VideoLightbox } from "@/components/media/VideoLightbox";
import { VideoReelsPlayer, type ReelItem } from "@/components/media/VideoReelsPlayer";
import type { GalleryVideo } from "@/domain/gallery-videos";
import { useMediaLikes, type Curtidas } from "@/hooks/useMediaLikes";
import { useWhatsAppLink, useWhatsAppLinks } from "@/hooks/useWhatsAppLink";
import { buildWhatsAppLink } from "@/lib/whatsapp";


type Props = {
  videos: GalleryVideo[];
};

const CATEGORY_LABELS: Record<string, string> = {
  canil: "Canil",
  creme: "Creme",
  laranja: "Laranja",
  ninhada: "Ninhadas",
  raça: "Raça",
  branco: "Branco",
};

const CATEGORY_COLORS: Record<string, string> = {
  canil: "bg-emerald-900/60 text-emerald-300 border-emerald-800",
  creme: "bg-amber-900/60 text-amber-300 border-amber-800",
  laranja: "bg-orange-900/60 text-orange-300 border-orange-800",
  ninhada: "bg-violet-900/60 text-violet-300 border-violet-800",
  raça: "bg-blue-900/60 text-blue-300 border-blue-800",
  branco: "bg-zinc-800/60 text-zinc-200 border-zinc-700",
};

function waFor(video: GalleryVideo) {
  return buildWhatsAppLink({
    message: `Olá! Assisti ao vídeo "${video.title}" na galeria da By Império Dog. Quero conhecer os filhotes atuais, os valores e como funciona a reserva.`,
    utmSource: "galeria",
    utmMedium: "video_gallery",
    utmCampaign: "video_interest",
    utmContent: video.slug,
  });
}

function VideoCard({
  video,
  index,
  onPlay,
  curtidas,
}: {
  video: GalleryVideo;
  index: number;
  onPlay: () => void;
  curtidas: Curtidas;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const [hovered, setHovered] = useState(false);
  // Os quatro primeiros já entram com `src`; o resto só ganha arquivo quando
  // chega perto da tela. Antes eram dois <video preload="metadata"> por card,
  // 26 no total, todos pedindo cabeçalho de arquivos de 4 a 25 MB no load.
  const [near, setNear] = useState(index < 4);
  const categoryColor = CATEGORY_COLORS[video.category] ?? "bg-zinc-800/60 text-zinc-300 border-zinc-700";
  const categoryLabel = CATEGORY_LABELS[video.category] ?? video.category;
  const waLink = useWhatsAppLink(waFor(video));

  useEffect(() => {
    if (near) return;
    const el = cardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          obs.disconnect();
        }
      },
      { rootMargin: "400px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [near]);

  // Prévia silenciosa só onde existe mouse de verdade. No celular o toque abre
  // o player em tela cheia, então nada disso roda lá.
  function handleMouseEnter() {
    setHovered(true);
    videoRef.current?.play().catch(() => {});
  }

  function handleMouseLeave() {
    setHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0.5;
    }
  }

  return (
    <article
      ref={cardRef}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-700/60 hover:shadow-2xl"
    >
      <button
        onClick={onPlay}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        // 9:16 em toda largura de tela: é o formato do arquivo. O desktop
        // ficou com mais colunas em vez de cards deitados — num card 16:9 o
        // corte engolia dois terços do quadro lá também, não só no celular.
        className="relative aspect-[9/16] w-full overflow-hidden bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        aria-label={`Reproduzir: ${video.title}`}
      >
        {near && (
          <video
            ref={videoRef}
            src={video.src}
            // Cada vídeo tem capa própria agora (scripts/gen-video-posters.mts
            // extrai um quadro real de cada arquivo). Antes o card carregava os
            // metadados do MP4 só para parar em `#t=0.5` e usar aquele quadro
            // como capa — doze downloads para mostrar doze imagens estáticas.
            // Com o poster pronto, o arquivo só é buscado quando alguém pede.
            poster={video.poster}
            muted
            playsInline
            preload="none"
            className={`absolute inset-0 h-full w-full object-cover transition-transform duration-300 ${hovered ? "scale-105" : "scale-100"}`}
            aria-hidden
            tabIndex={-1}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/30 sm:from-black/60 sm:to-transparent" />

        <span
          className={`absolute inset-0 flex items-center justify-center transition-transform duration-300 ${hovered ? "scale-110" : "scale-100"}`}
          aria-hidden
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600/90 text-white shadow-xl backdrop-blur-sm transition group-hover:bg-emerald-500 sm:h-14 sm:w-14">
            <Play className="ml-0.5 h-5 w-5 fill-current sm:h-6 sm:w-6" />
          </span>
        </span>

        <span
          className={`absolute left-2 top-2 rounded-full border px-2 py-0.5 text-[10px] font-semibold sm:left-3 sm:top-3 sm:px-2.5 sm:text-xs ${categoryColor}`}
        >
          {categoryLabel}
        </span>

        <span className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-zinc-300 sm:right-3 sm:top-3 sm:text-xs">
          {String(index + 1).padStart(2, "0")}
        </span>

        {/* Título sobre o vídeo — só no celular, onde o corpo do card não
            aparece. Em duas colunas não cabem título, descrição e dois botões. */}
        <span className="absolute inset-x-2 bottom-2 text-left text-[13px] font-semibold leading-tight text-white drop-shadow sm:hidden">
          {video.title}
        </span>
      </button>

      {/* Curtida — IRMÃ do botão de reproduzir, nunca filha: <button> dentro de
          <button> é HTML inválido e o navegador desmancha a árvore, o que
          derrubaria o próprio clique de abrir o vídeo.

          Trilho da direita, logo abaixo do número: no rodapé ela bateria no
          título, que no celular ocupa a largura toda do card. */}
      <div className="absolute right-1.5 top-9 z-10 sm:right-2.5 sm:top-10">
        <MediaLikeButton
          curtidas={curtidas}
          alvo={{
            mediaId: video.id,
            mediaType: "video",
            contextType: "gallery",
            contextId: video.slug,
          }}
          rotulo={`o vídeo ${video.title}`}
        />
      </div>

      {/* Corpo do card — desktop */}
      <div className="hidden flex-1 flex-col gap-2 p-4 sm:flex">
        <h2 className="text-sm font-semibold leading-snug text-white transition group-hover:text-emerald-400">
          <Link href={`/galeria/${video.slug}`}>{video.title}</Link>
        </h2>
        {video.description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-zinc-400">{video.description}</p>
        )}
        {/* Empilhados: lado a lado os dois rótulos não cabem na coluna
            estreita que o card vertical deixou. */}
        <div className="mt-auto flex flex-col gap-2 pt-3">
          <button
            onClick={onPlay}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:border-emerald-700 hover:bg-emerald-900 hover:text-emerald-300"
          >
            <Play className="h-3.5 w-3.5" aria-hidden />
            Assistir
          </button>
          <a
            href={waLink}
            data-wa-placement="gallery"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-full bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500"
            aria-label={`Interesse em ${video.title} pelo WhatsApp`}
          >
            <WhatsAppIcon size={14} aria-hidden />
            Quero conhecer os filhotes
          </a>
        </div>
      </div>
    </article>
  );
}

export default function GaleriaClient({ videos }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [reelsIndex, setReelsIndex] = useState<number | null>(null);

  // Decide para onde o toque no card vai. Renderiza `false` no servidor e
  // corrige depois de montar: como só afeta um handler, não há divergência
  // visual na hidratação.
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Girar o aparelho para a horizontal não pode deixar o player preso aberto.
  useEffect(() => {
    if (isDesktop) setReelsIndex(null);
  }, [isDesktop]);

  function open(index: number) {
    if (isDesktop) setLightboxIndex(index);
    else setReelsIndex(index);
  }

  const reelWaLinks = useWhatsAppLinks(videos.map(waFor));
  const videoItems = videos.map((v, index) => ({
    src: v.src,
    title: v.title,
    description: v.description,
    poster: v.poster,
    waLink: reelWaLinks[index],
    detailUrl: `/galeria/${v.slug}`,
  }));

  const reelItems: ReelItem[] = videos.map((v, index) => ({
    src: v.src,
    title: v.title,
    description: v.description,
    badge: CATEGORY_LABELS[v.category] ?? v.category,
    waLink: reelWaLinks[index],
    poster: v.poster,
    mediaId: v.id,
    contextType: "gallery",
    contextId: v.slug,
  }));

  // Uma única leitura de contagens para a página inteira — os mesmos ids servem
  // à grade e ao player, porque o card e o slide são o mesmo arquivo. Quem
  // curtiu na grade abre o feed com o coração já aceso.
  const curtidas = useMediaLikes(videos.map((v) => v.id));

  return (
    <>
      <div className="mb-6 flex flex-col gap-2 sm:mb-8">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">{videos.length} vídeos do nosso canil</h2>
        <p className="text-sm text-zinc-400">
          <span className="sm:hidden">Toque para assistir em tela cheia e deslize para o próximo.</span>
          <span className="hidden sm:inline">Toque ou clique para assistir em tela cheia.</span>
        </p>
        {/* Entrada direta para o feed — no celular ninguém adivinha que a grade
            vira player de tela cheia até tocar em alguma coisa. */}
        <button
          type="button"
          onClick={() => setReelsIndex(0)}
          className="mt-1 inline-flex min-h-[44px] items-center justify-center gap-2 self-start rounded-full bg-emerald-600 px-5 text-sm font-semibold text-white active:scale-95 sm:hidden"
        >
          <Play className="h-4 w-4 fill-current" aria-hidden />
          Assistir todos em tela cheia
        </button>
      </div>

      {/* Card vertical pede coluna estreita: com três colunas de 9:16 o card
          passaria de 700px de altura no desktop. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
        {videos.map((video, index) => (
          <VideoCard
            key={video.src}
            video={video}
            index={index}
            onPlay={() => open(index)}
            curtidas={curtidas}
          />
        ))}
      </div>

      {lightboxIndex !== null && (
        <VideoLightbox
          videos={videoItems}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {reelsIndex !== null && (
        <VideoReelsPlayer
          items={reelItems}
          initialIndex={reelsIndex}
          onClose={() => setReelsIndex(null)}
          backLabel="Ver grade"
          ariaLabel="Vídeos da By Império Dog"
          ctaLabel="Quero conhecer os filhotes"
          curtidas={curtidas}
        />
      )}
    </>
  );
}
