"use client";
import clsx from 'classnames';
import { Heart, Share2, X, ChevronLeft, ChevronRight, Phone } from 'lucide-react';
import Image from 'next/image';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { optimizePuppyGalleryImage } from '@/lib/optimize-image';
import passthroughImageLoader from '@/lib/passthrough-image-loader';
import track from '@/lib/track';
import { buildWhatsAppLink } from '@/lib/whatsapp';

// Tipagem básica (pode ser estendida conforme o backend evoluir)
export interface PuppyStoryItem {
  id: string;
  name?: string | null;
  nome?: string | null; // compat
  color?: string | null;
  cor?: string | null; // compat
  gender?: string | null; // 'male' | 'female'
  cover?: string | null; // URL principal
  whatsappOverrideLink?: string | null; // opcional
}

interface PuppyStoriesProps {
  items: PuppyStoryItem[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
  /**
   * Se true, avança automaticamente a cada autoAdvanceMs.
   * (Por padrão desativado; pode ser ligado depois se quiser comportamento mais parecido com IG Stories.)
   */
  autoPlay?: boolean;
  autoAdvanceMs?: number;
}

function buildWaMessage(p: PuppyStoryItem) {
  const name = p.nome || p.name || "Filhote";
  const color = p.cor || p.color || "cor em avaliação";
  const gender = p.gender === "male" ? "macho" : p.gender === "female" ? "fêmea" : "sexo em avaliação";
  return `Olá! Tenho interesse no filhote ${name} (${color}, ${gender}). Pode me enviar mais informações?`;
}

function buildWaLink(p: PuppyStoryItem) {
  if (p.whatsappOverrideLink) return p.whatsappOverrideLink;
  return buildWhatsAppLink({
    message: buildWaMessage(p),
    utmSource: "site",
    utmMedium: "stories",
    utmCampaign: "puppies_cta",
    utmContent: "stories_cta",
  });
}

export default function PuppyStories(props: PuppyStoriesProps) {
  const { items, initialIndex = 0, open, onClose, autoPlay = false, autoAdvanceMs = 9000 } = props;
  const [index, setIndex] = useState(initialIndex);
  const [likedSet, setLikedSet] = useState<Set<string>>(new Set());
  const [paused, setPaused] = useState(!autoPlay);
  const [uiVisible, setUiVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const touchStart = useRef<number | null>(null);
  const touchDiff = useRef<number>(0);
  const progressStart = useRef<number>(0);
  const [, force] = useState({});
  const inactivityTimer = useRef<number | null>(null);

  // Preload próxima e anterior
  useEffect(()=>{
    const nextItem = items[(index + 1) % items.length];
    const prevItem = items[(index - 1 + items.length) % items.length];
    [nextItem, prevItem].forEach(it => {
      if (it?.cover) {
        const imgEl = document.createElement('img');
        imgEl.decoding = 'async';
        imgEl.src = it.cover;
        imgEl.style.position = 'absolute';
        imgEl.style.width = '1px';
        imgEl.style.height = '1px';
        imgEl.style.opacity = '0';
        imgEl.alt = '';
        document.body.appendChild(imgEl);
        imgEl.addEventListener('load', () => {
          requestAnimationFrame(()=> imgEl.remove());
        });
      }
    });
  },[index, items]);

  const current = items[index];

  // Reset index quando itens mudam ou reabre
  useEffect(() => { if (open) setIndex(initialIndex); }, [open, initialIndex]);

  // Progress (apenas visual se autoplay desligado)
  useEffect(() => {
    if (!open) return;
    if (!autoPlay || paused) return;
    progressStart.current = performance.now();
    let raf: number;
    const tick = () => {
      const elapsed = performance.now() - progressStart.current;
      if (elapsed >= autoAdvanceMs) {
        next();
      } else {
        force({});
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, autoPlay, autoAdvanceMs, open, paused]);

  const ratioProgress = useMemo(() => {
    if (!autoPlay || paused) return 0;
    const elapsed = performance.now() - progressStart.current;
    return Math.min(1, elapsed / autoAdvanceMs);
  }, [autoPlay, autoAdvanceMs, paused]);

  const prev = useCallback(() => setIndex(i => (i === 0 ? items.length - 1 : i - 1)), [items.length]);
  const next = useCallback(() => setIndex(i => (i === items.length - 1 ? 0 : i + 1)), [items.length]);

  const toggleLike = useCallback((id: string) => {
    setLikedSet(s => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      track.event?.('puppy_like_toggle', { puppy_id: id, liked: n.has(id), placement: 'stories' });
      return n;
    });
  }, []);

  const handleShare = useCallback(async (p: PuppyStoryItem) => {
    const text = buildWaMessage(p);
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) {
        await navigator.share({ title: p.nome || p.name || 'Filhote', text, url });
        track.event?.('share_story', { puppy_id: p.id });
      } else {
        await navigator.clipboard.writeText(text + '\n' + url);
        alert('Texto copiado para compartilhar.');
      }
    } catch {/* noop */}
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, next, prev, onClose]);

  // Touch / swipe
  const onTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientX; };
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStart.current == null) return;
    touchDiff.current = e.touches[0].clientX - touchStart.current;
  };
  const onTouchEnd = () => {
    if (touchStart.current == null) return;
    if (touchDiff.current > 60) prev();
    else if (touchDiff.current < -60) next();
    touchStart.current = null; touchDiff.current = 0;
  };

  // Auto-hide UI após inatividade (apenas se não estiver interagindo com inputs)
  const bumpActivity = useCallback(() => {
    setUiVisible(true);
    if (inactivityTimer.current) window.clearTimeout(inactivityTimer.current);
    inactivityTimer.current = window.setTimeout(() => setUiVisible(false), 2500);
  }, []);

  useEffect(() => {
    if (!open) return;
    bumpActivity();
    const handleMove = () => bumpActivity();
    const node = containerRef.current;
    node?.addEventListener('mousemove', handleMove);
    node?.addEventListener('pointerdown', handleMove);
    node?.addEventListener('touchstart', handleMove, { passive: true });
    return () => {
      node?.removeEventListener('mousemove', handleMove);
      node?.removeEventListener('pointerdown', handleMove);
      node?.removeEventListener('touchstart', handleMove);
    };
  }, [open, bumpActivity]);

  // Pausar ao perder visibilidade (aba oculta) para evitar pular stories
  useEffect(()=>{
    if (!open) return;
    const vis = () => { if (document.hidden) setPaused(true); };
    document.addEventListener('visibilitychange', vis);
    return () => document.removeEventListener('visibilitychange', vis);
  }, [open]);

  // ESC para fechar
  useEffect(()=>{
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  // Anunciar mudança para tecnologias assistivas
  const liveRef = useRef<HTMLDivElement | null>(null);
  useEffect(()=>{
    if (!liveRef.current) return;
    const p = items[index];
    liveRef.current.textContent = `Story ${index+1} de ${items.length}: ${p?.nome || p?.name || 'Filhote'}`;
  },[index, items]);

  if (!open) return null;

  return createPortal(
    <div
      ref={containerRef}
      className="fixed inset-0 z-[200] flex flex-col bg-black/95 text-white"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop click to close */}
      <button
        aria-label="Fechar stories"
        onClick={onClose}
        className="absolute inset-0 z-10 cursor-default"
        tabIndex={-1}
      />

      <div className="absolute inset-0 z-20 flex items-center justify-center px-4 sm:px-8 select-none">
        <div
          className="relative w-full max-w-[90vw] sm:max-w-[480px] aspect-square bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden flex items-center justify-center"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {current?.cover ? (
            <Image
              loader={passthroughImageLoader}
              src={optimizePuppyGalleryImage(current.cover) || current.cover}
              alt={current.nome || current.name || 'Filhote'}
              fill
              priority
              sizes="(max-width: 640px) 90vw, 480px"
              className="object-contain"
            />
          ) : (
            <div className="text-zinc-400 text-sm">Sem imagem</div>
          )}

          {/* Gradient overlays */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/70 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 to-transparent" />

          {/* Progress bar segments */}
          <div className="absolute left-0 right-0 top-2 flex gap-1 px-3 transition-opacity" style={{ opacity: uiVisible ? 1 : 0 }}>
            {items.map((_, i) => (
              <div key={i} className="h-1 flex-1 rounded bg-white/30 overflow-hidden">
                <div
                  className={clsx('h-full bg-white transition-all', i < index && 'w-full', i === index && autoPlay && 'w-full')}
                  style={i === index && autoPlay ? { transformOrigin: 'left', animation: `pf-story-progress linear ${autoAdvanceMs}ms` } : i === index && !autoPlay ? { width: `${(ratioProgress * 100).toFixed(1)}%` } : undefined}
                />
              </div>
            ))}
          </div>

          {/* Top actions */}
          <div className={clsx("absolute top-4 left-4 right-4 flex items-start justify-between gap-3 text-sm transition-opacity", uiVisible ? 'opacity-100' : 'opacity-0')}>            
            <div className="space-y-1">
              <h3 className="text-base font-semibold leading-tight drop-shadow">{current?.nome || current?.name}</h3>
              <p className="text-xs text-zinc-200/90 leading-snug line-clamp-2">
                {(current?.cor || current?.color) && <><span>{current.cor || current.color}</span> â€¢ </>}
                {current?.gender === 'male' ? 'Macho' : current?.gender === 'female' ? 'Fêmea' : 'Sexo indef.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar stories"
              className="min-h-[48px] min-w-[48px] flex items-center justify-center rounded-full bg-black/90 hover:bg-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Bottom actions */}
          {current && (
            <div className={clsx("absolute bottom-4 left-0 right-0 z-20 flex flex-col items-center gap-3 px-3 transition-opacity", uiVisible ? 'opacity-100' : 'opacity-0')}>
              <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-center sm:gap-3">
                <button
                  type="button"
                  onClick={() => toggleLike(current.id)}
                  aria-label="Curtir"
                  className={clsx('flex items-center justify-center gap-1 rounded-full px-4 py-3 text-xs sm:text-sm font-medium transition min-h-[48px] min-w-[120px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2', likedSet.has(current.id) ? 'bg-rose-600 text-white focus-visible:ring-offset-rose-600' : 'bg-black/30 text-white hover:bg-black/50 focus-visible:ring-offset-black')}
                >
                  <Heart className={clsx('h-4 w-4 sm:h-5 sm:w-5', likedSet.has(current.id) && 'fill-current')} />
                  {likedSet.has(current.id) ? 'Curtido' : 'Curtir'}
                </button>
                <button
                  type="button"
                  onClick={() => handleShare(current)}
                  aria-label="Compartilhar"
                  className="flex items-center justify-center gap-1 rounded-full bg-black/30 px-4 py-3 text-xs sm:text-sm font-medium text-white hover:bg-black/50 transition min-h-[48px] min-w-[120px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  <Share2 className="h-4 w-4 sm:h-5 sm:w-5" /> Compartilhar
                </button>
                <a
                  href={buildWaLink(current)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track.event?.('whatsapp_click', { placement: 'stories', action: 'info', puppy_id: current.id })}
                  className="flex items-center justify-center gap-1 rounded-full bg-emerald-600 px-4 py-3 text-xs sm:text-sm font-medium text-white shadow hover:bg-emerald-700 transition min-h-[48px] min-w-[120px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-600"
                >
                  <Phone className="h-4 w-4 sm:h-5 sm:w-5" /> WhatsApp
                </a>
                <button
                  type="button"
                  onClick={()=> setPaused(p => !p)}
                  aria-label={paused ? 'Reproduzir stories' : 'Pausar stories'}
                  className="flex items-center justify-center gap-1 rounded-full bg-black/30 px-4 py-3 text-xs sm:text-sm font-medium text-white hover:bg-black/50 transition min-h-[48px] min-w-[120px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  {paused ? 'Play' : 'Pause'}
                </button>
              </div>
              <div className="flex w-full justify-between px-1 text-[10px] sm:text-[11px] text-zinc-300">
                <span>Story {index + 1}/{items.length}</span>
                <span>Tocar p/ UI â€¢ â† / â†’</span>
              </div>
            </div>
          )}

          {/* Navigation hotspots */}
          <div className="pointer-events-none absolute inset-x-0 top-0 bottom-32 z-10 grid grid-cols-2" aria-hidden="true">
            <button
              type="button"
              tabIndex={-1}
              aria-label="Story anterior"
              onClick={prev}
              className="pointer-events-auto h-full w-full bg-transparent"
            />
            <button
              type="button"
              tabIndex={-1}
              aria-label="Próximo story"
              onClick={next}
              className="pointer-events-auto h-full w-full bg-transparent"
            />
          </div>
          <button
            type="button"
            aria-label="Story anterior"
            onClick={prev}
            className={clsx("absolute left-3 top-1/2 -translate-y-1/2 min-h-[48px] min-w-[48px] flex items-center justify-center rounded-full bg-black/90 transition hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black", uiVisible ? 'opacity-100' : 'opacity-0')}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Próximo story"
            onClick={next}
            className={clsx("absolute right-3 top-1/2 -translate-y-1/2 min-h-[48px] min-w-[48px] flex items-center justify-center rounded-full bg-black/90 transition hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black", uiVisible ? 'opacity-100' : 'opacity-0')}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div ref={liveRef} className="sr-only" aria-live="polite" />

      {/* Backdrop button is rendered above, before the content wrapper */}
      <style jsx global>{`
        @keyframes pf-story-progress { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        /* Evita seleção acidental de texto durante taps rápidos */
        body.user-select-none * { user-select: none; }
      `}</style>
    </div>,
    document.body
  );
}

/*
Como integrar:
-----------------
1. Em um componente pai que já lista os filhotes:

  const [open, setOpen] = useState(false);
  const [storyIndex, setStoryIndex] = useState(0);

  <PuppyCard p={p} cover={p.cover_url} onOpen={() => { setStoryIndex(i); setOpen(true); }} />
  <PuppyStories items={puppies.map(p => ({ id: p.id, name: p.nome || p.name, cover: p.cover_url, color: p.cor, gender: p.gender }))}
                initialIndex={storyIndex}
                open={open}
                onClose={() => setOpen(false)} />

2. Ajustar fonte da imagem para garantir proporção 9:16 quando disponÃ­vel.
*/





