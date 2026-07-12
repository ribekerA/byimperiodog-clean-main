"use client";

import { Play } from "lucide-react";
import { useRef, useState } from "react";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { VideoLightbox } from "@/components/media/VideoLightbox";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import type { GalleryVideo } from "./page";

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
  wolf: "Wolf Sable",
};

const CATEGORY_COLORS: Record<string, string> = {
  canil: "bg-emerald-900/60 text-emerald-300 border-emerald-800",
  creme: "bg-amber-900/60 text-amber-300 border-amber-800",
  laranja: "bg-orange-900/60 text-orange-300 border-orange-800",
  ninhada: "bg-violet-900/60 text-violet-300 border-violet-800",
  raça: "bg-blue-900/60 text-blue-300 border-blue-800",
  branco: "bg-zinc-800/60 text-zinc-200 border-zinc-700",
  wolf: "bg-stone-800/60 text-stone-300 border-stone-700",
};

function VideoCard({ video, index, onPlay }: { video: GalleryVideo; index: number; onPlay: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hovered, setHovered] = useState(false);
  const categoryColor = CATEGORY_COLORS[video.category] ?? "bg-zinc-800/60 text-zinc-300 border-zinc-700";
  const categoryLabel = CATEGORY_LABELS[video.category] ?? video.category;

  const waLink = buildWhatsAppLink({
    message: `Olá! Vi o vídeo "${video.title}" na galeria da By Império Dog e tenho interesse nesta cor.`,
    utmSource: "galeria",
    utmContent: video.category,
  });

  function handleMouseEnter() {
    setHovered(true);
    videoRef.current?.play().catch(() => {});
  }

  function handleMouseLeave() {
    setHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-emerald-700/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Thumbnail / preview */}
      <button
        onClick={onPlay}
        className="relative aspect-video w-full overflow-hidden bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        aria-label={`Reproduzir: ${video.title}`}
      >
        {/* Silent preview on hover */}
        <video
          ref={videoRef}
          src={video.src}
          muted
          playsInline
          preload="metadata"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${hovered ? "opacity-100" : "opacity-0"}`}
          aria-hidden
          tabIndex={-1}
        />

        {/* Static poster frame */}
        <video
          src={`${video.src}#t=0.5`}
          preload="metadata"
          muted
          playsInline
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${hovered ? "opacity-0" : "opacity-100"}`}
          aria-hidden
          tabIndex={-1}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Play button */}
        <span
          className={`absolute inset-0 flex items-center justify-center transition-transform duration-300 ${hovered ? "scale-110" : "scale-100"}`}
          aria-hidden
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600/90 text-white shadow-xl backdrop-blur-sm group-hover:bg-emerald-500 transition">
            <Play className="h-6 w-6 fill-current ml-0.5" />
          </span>
        </span>

        {/* Category badge */}
        <span
          className={`absolute top-3 left-3 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${categoryColor}`}
        >
          {categoryLabel}
        </span>

        {/* Index */}
        <span className="absolute top-3 right-3 rounded-full bg-black/50 px-2 py-0.5 text-xs text-zinc-300">
          {String(index + 1).padStart(2, "0")}
        </span>
      </button>

      {/* Card body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h2 className="font-semibold text-white text-sm leading-snug group-hover:text-emerald-400 transition">
          {video.title}
        </h2>
        {video.description && (
          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
            {video.description}
          </p>
        )}
        <div className="mt-auto pt-3 flex gap-2">
          <button
            onClick={onPlay}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-full bg-zinc-800 hover:bg-emerald-900 border border-zinc-700 hover:border-emerald-700 transition px-3 py-2 text-xs font-semibold text-zinc-300 hover:text-emerald-300"
          >
            <Play className="h-3.5 w-3.5" aria-hidden />
            Assistir
          </button>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 transition px-3 py-2 text-xs font-semibold text-white"
            aria-label={`Interesse em ${video.title} pelo WhatsApp`}
          >
            <WhatsAppIcon size={14} aria-hidden />
            Tenho interesse
          </a>
        </div>
      </div>
    </article>
  );
}

export default function GaleriaClient({ videos }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const videoItems = videos.map((v) => ({ src: v.src, title: v.title, description: v.description }));

  return (
    <>
      <div className="mb-8 flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          {videos.length} vídeos do nosso canil
        </h2>
        <p className="text-zinc-400 text-sm">
          Passe o mouse para pré-visualizar. Clique para assistir em tela cheia.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video, index) => (
          <VideoCard
            key={video.src}
            video={video}
            index={index}
            onPlay={() => setLightboxIndex(index)}
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
    </>
  );
}
