"use client";

/**
 * PuppyCinematicGallery — Galeria cinematográfica com lightbox
 *
 * Features:
 *  • Slide direcional animado entre fotos (AnimatePresence + drag direction)
 *  • Setas de navegação com spring physics
 *  • Lightbox fullscreen com drag-to-swipe e keyboard (←/→/Esc)
 *  • Thumbnails com stagger entrance
 *  • Vídeo inline (autoplay muted no thumb, play ao clicar)
 *  • Zoom hint no hover
 */

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Props {
  images: string[];
  puppyName: string;
  puppyColor: string;
  puppySex: string;
  puppyId: string;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const EASE = [0.21, 0.47, 0.32, 0.98] as [number, number, number, number];

// ─── Variants de slide direcional ─────────────────────────────────────────────

function slideVariants(reduced: boolean) {
  return {
    enter: (dir: number) => ({ x: reduced ? 0 : dir * 80, opacity: 0 }),
    center: { x: 0, opacity: 1, transition: { duration: 0.4, ease: EASE } },
    exit:   (dir: number) => ({ x: reduced ? 0 : dir * -80, opacity: 0, transition: { duration: 0.28, ease: EASE } }),
  };
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function ChevronButton({
  dir,
  onClick,
}: {
  dir: -1 | 1;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <motion.button
      type="button"
      aria-label={dir === -1 ? "Foto anterior" : "Próxima foto"}
      onClick={onClick}
      className={`absolute ${dir === -1 ? "left-2" : "right-2"} top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white
        opacity-70 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100`}
      whileHover={{ scale: 1.1, backgroundColor: "rgba(0,0,0,0.65)" }}
      whileTap={{ scale: 0.90 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      <svg
        width={18} height={18}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ transform: dir === -1 ? "none" : "rotate(180deg)" }}
      >
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </motion.button>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function PuppyCinematicGallery({
  images,
  puppyName,
  puppyColor,
  puppySex,
}: Props) {
  const photos  = images.filter((img) => !img.endsWith(".mp4"));
  const videos  = images.filter((img) => img.endsWith(".mp4"));
  const reduced = useReducedMotion();
  const VARS    = slideVariants(!!reduced);

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [direction,   setDirection]   = useState(0);
  const [showVideo,   setShowVideo]   = useState(false);
  const [lightbox,    setLightbox]    = useState(false);
  const [swipeHint,   setSwipeHint]   = useState(true);

  // Oculta hint de swipe após 2.5s ou na primeira navegação
  useEffect(() => {
    if (!swipeHint) return;
    const t = setTimeout(() => setSwipeHint(false), 2500);
    return () => clearTimeout(t);
  }, [swipeHint]);

  const alt = `${puppyName} — Spitz Alemão Anão ${puppyColor} ${puppySex}`;

  // ── Navegação ────────────────────────────────────────────────────────────
  const navigate = useCallback(
    (dir: 1 | -1) => {
      setDirection(dir);
      setSelectedIdx((prev) => (prev + dir + photos.length) % photos.length);
      setShowVideo(false);
      setSwipeHint(false); // Remove hint na primeira navegação
    },
    [photos.length]
  );

  // ── Touch swipe na galeria principal ────────────────────────────────────
  const touchStartX  = useRef<number | null>(null);
  const didSwipe     = useRef(false);
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1 || showVideo) return;
    touchStartX.current = e.touches[0].clientX;
    didSwipe.current = false;
  }, [showVideo]);
  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 40) return; // threshold: tap simples não vira swipe
    didSwipe.current = true;
    navigate(delta < 0 ? 1 : -1);
  }, [navigate]);
  const onClickGallery = useCallback(() => {
    if (didSwipe.current) { didSwipe.current = false; return; }
    if (!showVideo) setLightbox(true);
  }, [showVideo]);

  // ── Keyboard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") navigate(1);
      else if (e.key === "ArrowLeft") navigate(-1);
      else if (e.key === "Escape") setLightbox(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, navigate]);

  // ── Lock scroll quando lightbox aberto ───────────────────────────────────
  useEffect(() => {
    if (lightbox) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [lightbox]);

  // ── Drag swipe handler ────────────────────────────────────────────────────
  const onDragEnd = useCallback(
    (_: unknown, { offset, velocity }: { offset: { x: number }; velocity: { x: number } }) => {
      if (offset.x < -50 || velocity.x < -500) navigate(1);
      else if (offset.x > 50 || velocity.x > 500) navigate(-1);
    },
    [navigate]
  );

  return (
    <div className="flex flex-col gap-3 lg:sticky lg:top-24">

      {/* ── Imagem principal ─────────────────────────────────────────────── */}
      <div
        className="group relative aspect-[4/3] cursor-zoom-in overflow-hidden rounded-2xl bg-zinc-900 shadow-xl ring-1 ring-zinc-900/8"
        onClick={onClickGallery}
        role="button"
        tabIndex={0}
        aria-label="Ampliar foto"
        onKeyDown={(e) => e.key === "Enter" && !showVideo && setLightbox(true)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <AnimatePresence custom={direction} mode="popLayout" initial={false}>
          {!showVideo && photos[selectedIdx] && (
            <motion.img
              key={photos[selectedIdx]}
              src={photos[selectedIdx]}
              alt={alt}
              className="h-full w-full object-cover"
              custom={direction}
              variants={VARS}
              initial="enter"
              animate="center"
              exit="exit"
              loading="eager"
            />
          )}
        </AnimatePresence>

        {/* Vídeo inline */}
        {showVideo && videos[0] && (
          <video
            src={videos[0]}
            controls
            autoPlay
            playsInline
            className="h-full w-full object-cover"
            aria-label={`Vídeo de ${puppyName}`}
            onClick={(e) => e.stopPropagation()}
          />
        )}

        {/* Setas de navegação */}
        {photos.length > 1 && !showVideo && (
          <>
            <ChevronButton dir={-1} onClick={(e) => { e.stopPropagation(); navigate(-1); }} />
            <ChevronButton dir={1}  onClick={(e) => { e.stopPropagation(); navigate(1); }} />
          </>
        )}

        {/* Contador — só no desktop */}
        {photos.length > 1 && !showVideo && (
          <div className="absolute bottom-3 right-3 z-10 hidden rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm sm:block">
            {selectedIdx + 1} / {photos.length}
          </div>
        )}

        {/* Dot indicators — só no mobile */}
        {photos.length > 1 && !showVideo && (
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 sm:hidden" aria-hidden="true">
            {photos.slice(0, Math.min(photos.length, 8)).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => { e.stopPropagation(); setSelectedIdx(i); setDirection(i > selectedIdx ? 1 : -1); setShowVideo(false); }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === selectedIdx
                    ? "w-5 bg-white"
                    : "w-1.5 bg-white/50"
                }`}
                aria-label={`Ir para foto ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Zoom hint */}
        {!showVideo && (
          <div
            className="pointer-events-none absolute left-3 top-3 flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-medium text-white/90 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100"
            aria-hidden="true"
          >
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
            </svg>
            Ampliar
          </div>
        )}

        {/* Swipe hint — mobile apenas, some após 2.5s */}
        <AnimatePresence>
          {photos.length > 1 && !showVideo && swipeHint && !reduced && (
            <motion.div
              key="swipe-hint"
              className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 sm:hidden"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ delay: 0.8, duration: 0.35 }}
              aria-hidden="true"
            >
              <motion.div
                className="flex items-center gap-2 rounded-full bg-black/55 px-4 py-2 text-xs font-medium text-white backdrop-blur-sm"
                animate={{ x: [0, -10, 0, 10, 0] }}
                transition={{ delay: 1.2, duration: 1.1, ease: "easeInOut" }}
              >
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                deslize
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ transform: "rotate(180deg)" }}>
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gradiente inferior sutil */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-20"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.3), transparent)" }}
          aria-hidden="true"
        />
      </div>

      {/* ── Thumbnails ───────────────────────────────────────────────────── */}
      {(photos.length > 1 || videos.length > 0) && (
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {photos.slice(0, 9).map((img, i) => (
            <motion.button
              key={img}
              type="button"
              onClick={() => { setSelectedIdx(i); setShowVideo(false); }}
              className={`relative aspect-square h-[62px] shrink-0 overflow-hidden rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                selectedIdx === i && !showVideo
                  ? "opacity-100 ring-2 ring-emerald-500 ring-offset-1"
                  : "opacity-55 hover:opacity-100"
              }`}
              aria-label={`Ver foto ${i + 1}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: selectedIdx === i && !showVideo ? 1 : 0.55, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.04, ease: EASE }}
              whileHover={{ opacity: 1, scale: 1.04 }}
              whileTap={{ scale: 0.94 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt="" className="h-full w-full object-cover" aria-hidden="true" />
            </motion.button>
          ))}

          {/* Thumbnail de vídeo */}
          {videos.length > 0 && (
            <motion.button
              type="button"
              onClick={() => setShowVideo(true)}
              className={`relative aspect-square h-[62px] shrink-0 overflow-hidden rounded-lg bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                showVideo ? "ring-2 ring-emerald-500 ring-offset-1 opacity-100" : "opacity-55 hover:opacity-100"
              }`}
              aria-label="Ver vídeo do filhote"
              whileHover={{ opacity: 1, scale: 1.04 }}
              whileTap={{ scale: 0.94 }}
            >
              <div className="flex h-full w-full flex-col items-center justify-center gap-1">
                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M6 3.5l7 4.5-7 4.5V3.5z" />
                </svg>
                <span className="text-[9px] font-bold uppercase tracking-wide text-white/70">Vídeo</span>
              </div>
            </motion.button>
          )}
        </div>
      )}

      {/* ── Lightbox ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/96"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={() => setLightbox(false)}
            role="dialog"
            aria-modal="true"
            aria-label={`Galeria de ${puppyName}`}
          >
            {/* Conteúdo — não fechar ao clicar aqui */}
            <motion.div
              className="relative flex max-h-screen max-w-[95vw] items-center justify-center"
              initial={{ scale: 0.93, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.93, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              drag={photos.length > 1 ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.15}
              onDragEnd={onDragEnd}
            >
              <AnimatePresence custom={direction} mode="popLayout" initial={false}>
                <motion.img
                  key={`lb-${photos[selectedIdx]}`}
                  src={photos[selectedIdx]}
                  alt={`${alt} — foto ${selectedIdx + 1}`}
                  className="max-h-[90vh] max-w-[90vw] select-none rounded-lg object-contain shadow-2xl"
                  custom={direction}
                  variants={VARS}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  draggable={false}
                />
              </AnimatePresence>

              {/* Setas do lightbox */}
              {photos.length > 1 && (
                <>
                  <motion.button
                    type="button"
                    aria-label="Foto anterior"
                    onClick={(e) => { e.stopPropagation(); navigate(-1); }}
                    className="absolute -left-4 sm:-left-16 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.88 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden="true">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </motion.button>
                  <motion.button
                    type="button"
                    aria-label="Próxima foto"
                    onClick={(e) => { e.stopPropagation(); navigate(1); }}
                    className="absolute -right-4 sm:-right-16 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.88 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" style={{ transform: "rotate(180deg)" }} aria-hidden="true">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </motion.button>
                </>
              )}
            </motion.div>

            {/* Fechar */}
            <motion.button
              type="button"
              aria-label="Fechar galeria"
              onClick={() => setLightbox(false)}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.88 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </motion.button>

            {/* Contador lightbox */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm">
              {selectedIdx + 1} / {photos.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
