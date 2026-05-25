"use client";

import { ChevronDown, Volume2, VolumeX } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import PuppyDetailsModal from "@/components/PuppyDetailsModal";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { buildWhatsAppLink } from "@/lib/whatsapp";

type ReelPuppy = {
  id: string;
  name: string;
  cor?: string;
  color?: string;
  priceCents?: number;
  price_cents?: number;
  status?: string;
  videoSrc: string;
  thumbnail?: string;
  description?: string;
  slug?: string;
  images: string[];
  [key: string]: unknown;
};

function fmt(cents?: number | null) {
  if (!cents) return "Sob consulta";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function statusLabel(s?: string) {
  if (!s) return null;
  const v = s.toLowerCase();
  if (v === "reserved" || v === "reservado")
    return { label: "Reservado", cls: "bg-amber-400/90 text-amber-900" };
  if (v === "sold" || v === "vendido")
    return { label: "Vendido", cls: "bg-rose-500/90 text-white" };
  return null;
}

// ─── Slide individual ────────────────────────────────────────────────────────
function ReelSlide({
  puppy,
  isMuted,
  onToggleMute,
  onOpenDetails,
  isFirst,
}: {
  puppy: ReelPuppy;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenDetails: () => void;
  isFirst: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const price = puppy.priceCents ?? (puppy.price_cents as number | undefined);
  const cor = puppy.cor ?? puppy.color ?? "";
  const badge = statusLabel(puppy.status);

  // Auto-play / pause via IntersectionObserver
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
          setPlaying(true);
        } else {
          video.pause();
          video.currentTime = 0;
          setPlaying(false);
        }
      },
      { threshold: 0.75 }
    );
    obs.observe(video);
    return () => obs.disconnect();
  }, []);

  // Sync muted state
  useEffect(() => {
    const v = videoRef.current;
    if (v) v.muted = isMuted;
  }, [isMuted]);

  const waLink = buildWhatsAppLink({
    message: `Olá! Vi o vídeo do ${puppy.name} (${cor}) no site da By Império Dog e quero saber sobre disponibilidade.`,
    utmSource: "site",
    utmMedium: "reels",
    utmCampaign: "puppy_reel",
    utmContent: puppy.id,
  });

  return (
    <div className="relative h-[100dvh] w-full snap-start overflow-hidden bg-black">
      {/* Vídeo */}
      <video
        ref={videoRef}
        src={puppy.videoSrc}
        poster={puppy.thumbnail}
        className="absolute inset-0 h-full w-full object-cover"
        loop
        muted
        playsInline
        preload="metadata"
        aria-label={`Vídeo do ${puppy.name}`}
      />

      {/* Gradiente */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/30" />

      {/* Topo: marca + mute */}
      <div className="absolute left-0 right-0 top-0 flex items-start justify-between px-4 pt-safe-top pt-4">
        <span className="rounded-full bg-black/40 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white/90 backdrop-blur-sm">
          By Império Dog
        </span>
        <button
          type="button"
          onClick={onToggleMute}
          aria-label={isMuted ? "Ativar som" : "Silenciar"}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm active:scale-95"
        >
          {isMuted ? (
            <VolumeX className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Volume2 className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Rodapé: info + CTAs */}
      <div className="absolute bottom-0 left-0 right-0 space-y-3 px-4 pb-safe-bottom pb-8">
        {/* Badge de status */}
        {badge && (
          <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-bold ${badge.cls}`}>
            {badge.label}
          </span>
        )}

        {/* Nome e preço */}
        <div>
          <h3 className="text-2xl font-bold leading-tight text-white drop-shadow-sm">
            {puppy.name}
          </h3>
          {cor && (
            <p className="text-sm font-medium text-white/70">{cor}</p>
          )}
          <p className="mt-1 text-2xl font-extrabold text-emerald-400 drop-shadow-sm">
            {fmt(price)}
          </p>
        </div>

        {/* Descrição */}
        {puppy.description && (
          <p className="line-clamp-2 text-sm leading-snug text-white/75">
            {puppy.description}
          </p>
        )}

        {/* Botões */}
        <div className="flex gap-3">
          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-lg active:scale-95"
          >
            <WhatsAppIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
            Falar no WhatsApp
          </a>
          <button
            type="button"
            onClick={onOpenDetails}
            className="rounded-full border border-white/30 bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur-sm active:scale-95"
          >
            Ver mais
          </button>
        </div>
      </div>

      {/* Indicador de scroll (só no primeiro) */}
      {isFirst && (
        <div className="absolute bottom-[220px] right-5 animate-bounce opacity-70">
          <ChevronDown className="h-6 w-6 text-white" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}

// ─── Container principal ─────────────────────────────────────────────────────
type Props = {
  puppies: any[];
};

export default function PuppyReels({ puppies }: Props) {
  const [isMuted, setIsMuted] = useState(true);
  const [openPuppy, setOpenPuppy] = useState<any | null>(null);

  const toggleMute = useCallback(() => setIsMuted((m) => !m), []);

  const reels: ReelPuppy[] = puppies
    .map((p) => {
      const images: string[] = Array.isArray(p.images) ? p.images : [];
      const videoSrc = images.find((i) => /\.mp4$/i.test(i));
      const thumbnail = images.find((i) => !/\.mp4$/i.test(i));
      if (!videoSrc) return null;
      return { ...p, videoSrc, thumbnail } as ReelPuppy;
    })
    .filter((p): p is ReelPuppy => p !== null);

  if (reels.length === 0) return null;

  return (
    <>
      <div
        className="h-[100dvh] overflow-y-scroll snap-y snap-mandatory [scroll-snap-type:y_mandatory] [&::-webkit-scrollbar]:hidden"
        aria-label="Vídeos dos filhotes"
      >
        {reels.map((puppy, i) => (
          <ReelSlide
            key={puppy.id}
            puppy={puppy}
            isMuted={isMuted}
            onToggleMute={toggleMute}
            onOpenDetails={() => setOpenPuppy(puppy)}
            isFirst={i === 0}
          />
        ))}
      </div>

      {openPuppy && (
        <PuppyDetailsModal puppy={openPuppy} onClose={() => setOpenPuppy(null)} />
      )}
    </>
  );
}
