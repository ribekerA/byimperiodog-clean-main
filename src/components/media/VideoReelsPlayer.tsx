"use client";

/**
 * VideoReelsPlayer — feed vertical de vídeos em tela cheia.
 *
 * Um vídeo por tela, parada seca no scroll, só o slide visível toca, som
 * desligado por padrão e CTA fixo no rodapé. É a dinâmica de Reels/Shorts,
 * aplicada aqui porque o material é vertical na origem: dos 13 vídeos da
 * galeria, 12 são 9:16 (352x640, 360x640 ou 720x1280). Dentro do card 16:9
 * antigo, com `object-cover`, aparecia só 31% da altura do quadro — o filhote
 * ficava fora do corte.
 *
 * O 13º (apresentação do canil) é 16:9 de verdade. O ajuste de encaixe é lido
 * do próprio arquivo em `loadedmetadata`, então ele aparece inteiro em vez de
 * ser cortado pelas laterais.
 *
 * Usado em dois lugares: na /galeria e nos vídeos do filhote
 * (PuppyCinematicGallery). Os dois tinham a mesma tela escrita duas vezes.
 */

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Play, Volume2, VolumeX, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

export type ReelItem = {
  src: string;
  title: string;
  description?: string;
  /** Etiqueta curta acima do título (cor, categoria…). */
  badge?: string;
  /** Link de WhatsApp já montado, com a mensagem e as UTMs do item. */
  waLink: string;
  /** Capa mostrada antes do arquivo carregar. Sem ela o slide fica preto. */
  poster?: string;
};

type Props = {
  items: ReelItem[];
  initialIndex: number;
  onClose: () => void;
  /** Texto do botão que fecha o player e volta para a lista. */
  backLabel?: string;
  /** Texto do botão de WhatsApp. */
  ctaLabel?: string;
  ariaLabel?: string;
};

// ─── Um slide ────────────────────────────────────────────────────────────────
function ReelSlide({
  item,
  index,
  total,
  muted,
  reduced,
  onToggleMute,
  onClose,
  backLabel,
  ctaLabel,
}: {
  item: ReelItem;
  index: number;
  total: number;
  muted: boolean;
  reduced: boolean;
  onToggleMute: () => void;
  onClose: () => void;
  backLabel: string;
  ctaLabel: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(true);
  const [progress, setProgress] = useState(0);
  // Encaixe decidido pelo arquivo, não pelo palpite: vertical preenche a tela
  // sem corte; horizontal fica inteiro, com tarja, em vez de perder as laterais.
  const [fit, setFit] = useState<"cover" | "contain">("cover");

  // Só o slide que está na tela toca. Sem isto os 13 vídeos (4 a 25 MB cada)
  // baixariam e tocariam juntos no mesmo scroll.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          v.preload = "auto";
          if (!reduced) {
            v.play().then(() => setPaused(false)).catch(() => setPaused(true));
          }
        } else {
          v.pause();
          v.currentTime = 0;
          setPaused(true);
          setProgress(0);
        }
      },
      { threshold: 0.6 }
    );
    obs.observe(v);
    return () => obs.disconnect();
  }, [reduced]);

  // O atributo `muted` do JSX não acompanha mudanças de estado no DOM.
  useEffect(() => {
    const v = videoRef.current;
    if (v) v.muted = muted;
  }, [muted]);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().then(() => setPaused(false)).catch(() => {});
    else {
      v.pause();
      setPaused(true);
    }
  }

  return (
    <section className="relative h-[100dvh] w-full snap-start snap-always overflow-hidden bg-black">
      <video
        ref={videoRef}
        src={item.src}
        poster={item.poster}
        className={`absolute inset-0 h-full w-full ${fit === "cover" ? "object-cover" : "object-contain"}`}
        loop
        muted
        playsInline
        // Nada é baixado até o slide entrar na tela — quando existe `poster`,
        // é ele que segura a primeira vista, de graça.
        preload="none"
        aria-label={`Vídeo: ${item.title}`}
        onLoadedMetadata={(e) => {
          const v = e.currentTarget;
          if (v.videoWidth && v.videoHeight) {
            setFit(v.videoWidth / v.videoHeight < 0.9 ? "cover" : "contain");
          }
        }}
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          if (v.duration) setProgress(v.currentTime / v.duration);
        }}
      />

      {/* Toque em qualquer lugar pausa — como no Reels. Fica abaixo dos
          controles para não roubar o clique deles. */}
      <button
        type="button"
        onClick={togglePlay}
        className="absolute inset-0 z-10 h-full w-full cursor-default focus-visible:outline-none"
        aria-label={paused ? "Reproduzir vídeo" : "Pausar vídeo"}
      />

      {/* Degradês: sem eles o texto branco some sobre pelo claro. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-32 bg-gradient-to-b from-black/70 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-72 bg-gradient-to-t from-black/90 via-black/45 to-transparent" />

      {paused && (
        <span className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm">
            <Play className="ml-1 h-7 w-7 fill-white text-white" aria-hidden />
          </span>
        </span>
      )}

      {/* Barra de progresso no estilo stories */}
      <div
        className="pointer-events-none absolute inset-x-3 z-30 h-0.5 overflow-hidden rounded-full bg-white/25"
        style={{ top: "max(0.75rem, env(safe-area-inset-top))" }}
        aria-hidden
      >
        <div
          className="h-full bg-white transition-[width] duration-150 ease-linear"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>

      {/* Topo: fechar · contador · som */}
      <div
        className="absolute inset-x-0 z-30 flex items-center justify-between px-3"
        style={{ top: "max(1.5rem, calc(env(safe-area-inset-top) + 0.75rem))" }}
      >
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-label="Fechar vídeos"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>

        {/* Com um vídeo só, "1 / 1" é ruído. */}
        {total > 1 ? (
          <span className="rounded-full bg-black/45 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-sm">
            {index + 1} / {total}
          </span>
        ) : (
          <span aria-hidden />
        )}

        <button
          type="button"
          onClick={onToggleMute}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-label={muted ? "Ativar som" : "Desativar som"}
        >
          {muted ? <VolumeX className="h-5 w-5" aria-hidden /> : <Volume2 className="h-5 w-5" aria-hidden />}
        </button>
      </div>

      {/* Rodapé: contexto + CTA */}
      <div
        className="absolute inset-x-0 bottom-0 z-30 space-y-3 px-4"
        style={{ paddingBottom: "max(1.5rem, calc(env(safe-area-inset-bottom) + 1rem))" }}
      >
        {item.badge && (
          <span className="inline-block rounded-full bg-white/15 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
            {item.badge}
          </span>
        )}
        <div>
          <h3 className="text-xl font-bold leading-tight text-white drop-shadow">{item.title}</h3>
          {item.description && (
            <p className="mt-1 line-clamp-2 text-sm leading-snug text-white/75">{item.description}</p>
          )}
        </div>

        <div className="flex gap-2">
          <a
            href={item.waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full bg-emerald-500 px-4 text-sm font-bold text-white shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <WhatsAppIcon size={18} aria-hidden />
            {ctaLabel}
          </a>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[48px] items-center justify-center rounded-full border border-white/30 bg-white/10 px-4 text-sm font-semibold text-white backdrop-blur-sm active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {backLabel}
          </button>
        </div>
      </div>

      {/* Só no primeiro: sem isto ninguém descobre que há mais vídeos abaixo. */}
      {index === 0 && total > 1 && !reduced && (
        <span className="pointer-events-none absolute bottom-52 left-1/2 z-20 -translate-x-1/2 animate-bounce text-white/70">
          <ChevronDown className="h-6 w-6" aria-hidden />
        </span>
      )}
    </section>
  );
}

// ─── Player ──────────────────────────────────────────────────────────────────
export function VideoReelsPlayer({
  items,
  initialIndex,
  onClose,
  backLabel = "Ver lista",
  ctaLabel = "Tenho interesse",
  ariaLabel = "Vídeos",
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(true);
  const reduced = useReducedMotion();

  // Abre no vídeo que foi tocado, não sempre no primeiro.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = initialIndex * el.clientHeight;
  }, [initialIndex]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="reels"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        // Acima do botão flutuante de WhatsApp (z-9998), que senão ficaria
        // boiando sobre o vídeo. O `data-wa-safe-zone` manda o botão sumir.
        className="fixed inset-0 z-[9999] bg-black"
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        data-wa-safe-zone
      >
        <div
          ref={scrollRef}
          // `overscroll-contain` impede que o fim da lista puxe a página atrás;
          // `snap-mandatory` dá a parada seca de um vídeo por tela.
          className="h-[100dvh] snap-y snap-mandatory overflow-y-scroll overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item, i) => (
            <ReelSlide
              key={item.src}
              item={item}
              index={i}
              total={items.length}
              muted={muted}
              reduced={!!reduced}
              onToggleMute={() => setMuted((m) => !m)}
              onClose={onClose}
              backLabel={backLabel}
              ctaLabel={ctaLabel}
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default VideoReelsPlayer;
