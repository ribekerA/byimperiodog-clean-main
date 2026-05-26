"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export type VideoItem = {
  src: string;
  title: string;
  description?: string;
};

type VideoLightboxProps = {
  videos: VideoItem[];
  initialIndex: number;
  onClose: () => void;
};

export function VideoLightbox({ videos, initialIndex, onClose }: VideoLightboxProps) {
  const [current, setCurrent] = useState(initialIndex);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const video = videos[current];

  const goNext = useCallback(() => {
    setCurrent((prev) => (prev + 1) % videos.length);
  }, [videos.length]);

  const goPrev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + videos.length) % videos.length);
  }, [videos.length]);

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, goNext, goPrev]);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Autoplay on video change
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [current]);

  // Swipe gesture
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    // Only swipe horizontally if horizontal movement is dominant
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }

  const waLink = buildWhatsAppLink({
    message: `Olá! Vi o vídeo "${video.title}" no site da By Império Dog e tenho interesse nesta cor.`,
    utmSource: "galeria",
    utmCampaign: "video-interest",
  });

  return (
    <AnimatePresence>
      <motion.div
        key="lightbox-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/95"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        role="dialog"
        aria-modal="true"
        aria-label={`Vídeo: ${video.title}`}
      >
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/70 to-transparent">
          <p className="text-white text-sm font-semibold truncate max-w-[70%]">{video.title}</p>
          <button
            onClick={onClose}
            className="flex items-center justify-center h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 transition text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Fechar vídeo"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {/* Video */}
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl px-4 sm:px-10"
        >
          <video
            ref={videoRef}
            src={video.src}
            controls
            autoPlay
            playsInline
            className="w-full rounded-xl shadow-2xl max-h-[70vh] bg-black object-contain"
            aria-label={video.title}
          />
        </motion.div>

        {/* Bottom bar */}
        <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col items-center gap-3 px-4 pb-6 pt-4 bg-gradient-to-t from-black/80 to-transparent">
          {video.description && (
            <p className="text-white/70 text-xs text-center max-w-md">{video.description}</p>
          )}
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-500 transition px-5 py-2.5 text-white text-sm font-semibold shadow-lg"
          >
            <WhatsAppIcon size={18} aria-hidden />
            Tenho interesse nesta cor
          </a>
          {/* Counter */}
          <p className="text-white/50 text-xs">
            {current + 1} / {videos.length}
          </p>
        </div>

        {/* Prev button */}
        {videos.length > 1 && (
          <button
            onClick={goPrev}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center h-10 w-10 rounded-full bg-white/10 hover:bg-white/25 transition text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Vídeo anterior"
          >
            <ChevronLeft className="h-6 w-6" aria-hidden />
          </button>
        )}

        {/* Next button */}
        {videos.length > 1 && (
          <button
            onClick={goNext}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center h-10 w-10 rounded-full bg-white/10 hover:bg-white/25 transition text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Próximo vídeo"
          >
            <ChevronRight className="h-6 w-6" aria-hidden />
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export default VideoLightbox;
