"use client";

/**
 * PuppyCinematicGallery — Galeria cinematográfica com lightbox
 *
 * Features:
 *  • Slide direcional animado entre fotos (AnimatePresence + drag direction)
 *  • Setas de navegação com spring physics
 *  • Lightbox fullscreen com drag-to-swipe e keyboard (←/→/Esc)
 *  • Thumbnails com stagger entrance
 *  • Vídeo: inline no desktop, player vertical em tela cheia no celular
 *  • Zoom hint no hover
 */

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

import { VideoReelsPlayer, type ReelItem } from "@/components/media/VideoReelsPlayer";
import { optimizePuppyGalleryImage, optimizePuppyThumb } from "@/lib/optimize-image";
import { buildWhatsAppLink } from "@/lib/whatsapp";

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

// Acima disso as bolinhas nao cabem na largura do celular e o contador
// numerico passa a ser o indicador.
const MAX_DOTS = 12;

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
      // Escondidas no mobile: ali a navegacao ja tem swipe, bolinhas e
      // miniaturas, e duas setas por cima da foto so tiravam espaco dela.
      // No desktop viram 44px, o alvo minimo de toque.
      className={`absolute ${dir === -1 ? "left-2" : "right-2"} top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white
        sm:flex sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100`}
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
  puppyId,
}: Props) {
  const photos  = images.filter((img) => !img.endsWith(".mp4"));
  const videos  = images.filter((img) => img.endsWith(".mp4"));
  const reduced = useReducedMotion();
  const VARS    = slideVariants(!!reduced);

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [direction,   setDirection]   = useState(0);
  const [showVideo,   setShowVideo]   = useState(false);
  const [videoIdx,    setVideoIdx]    = useState(0);
  const [lightbox,    setLightbox]    = useState(false);
  const [swipeHint,   setSwipeHint]   = useState(true);

  // Player vertical — só no celular. A tela em si é o VideoReelsPlayer, o
  // mesmo componente da /galeria: som, progresso, scroll e trava de rolagem
  // são dele. Aqui fica só quando abre e em qual vídeo.
  const [reelsOpen, setReelsOpen] = useState(false);
  const [reelStart, setReelStart] = useState(0);

  // `useReducedMotion` já devolve a preferência real do aparelho no primeiro
  // render do cliente, mas no servidor é sempre `false`. Quem usa "reduzir
  // movimento" recebia do servidor um aviso de swipe que o cliente não
  // desenhava — divergência de hidratação de verdade, e o React descarta o
  // HTML do servidor quando isso acontece. Só desenha depois de montar.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Decide para onde o clique no vídeo vai. Renderiza `false` no servidor e
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
    if (isDesktop) setReelsOpen(false);
  }, [isDesktop]);

  const openVideo = useCallback(
    (i: number) => {
      if (isDesktop) { setVideoIdx(i); setShowVideo(true); return; }
      setReelStart(i);
      setReelsOpen(true);
    },
    [isDesktop]
  );

  const waLink = buildWhatsAppLink({
    message: `Olá! Vi o vídeo do ${puppyName} (Spitz Alemão Anão ${puppyColor} ${puppySex}) no site e quero saber sobre disponibilidade.`,
    utmSource: "site",
    utmMedium: "galeria-video",
    utmCampaign: "puppy_video",
    utmContent: puppyId,
  });

  // A capa é a primeira foto do filhote: sem ela o slide abre preto enquanto
  // o arquivo não começa a chegar.
  const reelItems: ReelItem[] = videos.map((v) => ({
    src: v,
    title: puppyName,
    description: `Spitz Alemão Anão · ${puppyColor} · ${puppySex}`,
    waLink,
    poster: photos[0] ? optimizePuppyGalleryImage(photos[0]) || photos[0] : undefined,
  }));

  // Oculta hint de swipe após 2.5s ou na primeira navegação
  useEffect(() => {
    if (!swipeHint) return;
    const t = setTimeout(() => setSwipeHint(false), 2500);
    return () => clearTimeout(t);
  }, [swipeHint]);

  const alt = `${puppyName} — Spitz Alemão Anão (Lulu da Pomerânia) ${puppyColor} ${puppySex}`;

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

  // ── Lock scroll do lightbox ──────────────────────────────────────────────
  // O player de vídeo tranca a rolagem por conta própria; se os dois mexessem
  // no mesmo `body.style.overflow` um destrancaria o outro ao fechar.
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
    <div className="min-w-0 flex flex-col gap-3 lg:sticky lg:top-24">

      {/* ── Imagem principal ─────────────────────────────────────────────── */}
      <div
        // As fotos dos filhotes sao verticais. Num quadro 4/3 (deitado) o
        // `object-cover` cortava cabeca e patas e sobrava so uma faixa do meio.
        // 4/5 acompanha o formato da foto e o `object-contain` abaixo mostra a
        // imagem inteira — o fundo escuro faz a sobra parecer proposital.
        className="group relative aspect-[4/5] cursor-zoom-in overflow-hidden rounded-2xl bg-zinc-900 shadow-xl ring-1 ring-zinc-900/8 sm:aspect-square"
        onClick={onClickGallery}
        role="button"
        tabIndex={0}
        aria-label="Ampliar foto"
        onKeyDown={(e) => e.key === "Enter" && !showVideo && setLightbox(true)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Fundo desfocado. As fotos vao de 0.56 a 0.96 de proporcao, entao
            nenhuma caixa fixa cabe em todas: ou corta as altas ou sobra nas
            quadradas. O `object-contain` abaixo mostra a foto inteira e esta
            camada preenche a sobra com a propria imagem borrada, no lugar de
            duas faixas pretas mortas. Usa a miniatura, que ja foi baixada
            para a tira de baixo — nao custa download novo.
            Vale tambem para o video inline do desktop: ele e 9:16 dentro de
            uma caixa quadrada, entao sobra faixa dos dois lados. */}
        {photos[showVideo ? 0 : selectedIdx] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={
              optimizePuppyThumb(photos[showVideo ? 0 : selectedIdx]) ||
              photos[showVideo ? 0 : selectedIdx]
            }
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover blur-2xl brightness-[0.55] saturate-150"
          />
        )}

        <AnimatePresence custom={direction} mode="popLayout" initial={false}>
          {!showVideo && photos[selectedIdx] && (
            <motion.img
              // A `key` continua sendo a URL original: e ela que da identidade
              // ao frame para o AnimatePresence. So o `src` e redimensionado.
              key={photos[selectedIdx]}
              src={optimizePuppyGalleryImage(photos[selectedIdx]) || photos[selectedIdx]}
              alt={alt}
              className="h-full w-full object-contain"
              custom={direction}
              variants={VARS}
              initial="enter"
              animate="center"
              exit="exit"
              loading="eager"
            />
          )}
        </AnimatePresence>

        {/* Vídeo inline — desktop. No celular o clique abre o player vertical. */}
        {showVideo && videos[videoIdx] && (
          <video
            key={videos[videoIdx]}
            src={videos[videoIdx]}
            poster={photos[0] ? optimizePuppyGalleryImage(photos[0]) || photos[0] : undefined}
            controls
            autoPlay
            // Sem `muted` o navegador recusa o autoplay e o quadro fica
            // parado; os controles continuam ali para ligar o som.
            muted
            playsInline
            className="relative h-full w-full object-contain"
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

        {/* Contador. No desktop sempre; no mobile so quando ha fotos demais
            para caber em bolinhas, senao os dois indicadores brigam. */}
        {photos.length > 1 && !showVideo && (
          <div
            className={`absolute bottom-3 right-3 z-10 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm sm:block ${
              photos.length > MAX_DOTS ? "block" : "hidden"
            }`}
          >
            {selectedIdx + 1} / {photos.length}
          </div>
        )}

        {/* Bolinhas — só no mobile. Uma por foto: o corte antigo em 8 deixava
            a nona foto sem indicador e sem nenhuma bolinha acesa nela. */}
        {photos.length > 1 && photos.length <= MAX_DOTS && !showVideo && (
          <div className="absolute bottom-0 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 sm:hidden">
            {photos.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => { e.stopPropagation(); setSelectedIdx(i); setDirection(i > selectedIdx ? 1 : -1); setShowVideo(false); }}
                // A bolinha desenhada tem 6px, mas o botao ocupa 44px de
                // altura: alvo de toque acessivel sem engordar o visual.
                className="flex h-11 w-6 items-center justify-center focus-visible:outline-none"
                aria-label={`Ir para foto ${i + 1}`}
                aria-current={i === selectedIdx ? "true" : undefined}
              >
                <span
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === selectedIdx ? "w-5 bg-white" : "w-1.5 bg-white/50"
                  }`}
                />
              </button>
            ))}
          </div>
        )}

        {/* Zoom hint */}
        {!showVideo && (
          <div
            // Celular nao tem hover: preso em `opacity-0 group-hover` este
            // aviso nunca aparecia justamente para quem so pode tocar.
            className="pointer-events-none absolute left-3 top-3 flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-medium text-white/90 opacity-100 backdrop-blur-sm transition-opacity duration-300 sm:opacity-0 sm:group-hover:opacity-100"
            aria-hidden="true"
          >
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
            </svg>
            Ampliar
          </div>
        )}

        {/* Atalho para o vídeo. Antes ele só existia na tira de miniaturas,
            abaixo da dobra no celular: quem não rolava nem sabia que havia
            vídeo do filhote. */}
        {videos.length > 0 && !showVideo && (
          <motion.button
            type="button"
            onClick={(e) => { e.stopPropagation(); openVideo(0); }}
            className="absolute right-3 top-3 z-10 flex h-9 items-center gap-1.5 rounded-full bg-black/55 pl-2.5 pr-3 text-[11px] font-semibold text-white backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label={videos.length > 1 ? `Ver ${videos.length} vídeos de ${puppyName}` : `Ver vídeo de ${puppyName}`}
            whileTap={{ scale: 0.93 }}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
              <svg className="ml-[1px] h-2.5 w-2.5" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M6 3.5l7 4.5-7 4.5V3.5z" />
              </svg>
            </span>
            {videos.length > 1 ? `${videos.length} vídeos` : "Vídeo"}
          </motion.button>
        )}

        {/* Swipe hint — mobile apenas, some após 2.5s */}
        <AnimatePresence>
          {mounted && photos.length > 1 && !showVideo && swipeHint && !reduced && (
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
          {/* Sem corte: a tira ja rola na horizontal, e o `slice(0, 9)`
              antigo escondia a decima foto deste filhote. */}
          {photos.map((img, i) => (
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
              {/* Miniatura aparece com 62px; sem o resize cada uma das nove
                  baixava a foto original inteira. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={optimizePuppyThumb(img) || img}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
                aria-hidden="true"
              />
            </motion.button>
          ))}

          {/* Miniaturas de vídeo — uma por vídeo. O botão único antigo abria
              sempre `videos[0]`, e há filhote aqui com três vídeos: os outros
              dois estavam no catálogo mas não tinham como ser vistos.
              A capa é a primeira foto do filhote em vez de um quadro do vídeo:
              extrair o quadro exigiria baixar o arquivo (4 a 9 MB) só para
              montar a tira. O selo de play deixa claro que é vídeo. */}
          {videos.map((v, i) => (
            <motion.button
              key={v}
              type="button"
              onClick={() => openVideo(i)}
              className={`relative aspect-square h-[62px] shrink-0 overflow-hidden rounded-lg bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                showVideo && videoIdx === i
                  ? "opacity-100 ring-2 ring-emerald-500 ring-offset-1"
                  : "opacity-55 hover:opacity-100"
              }`}
              aria-label={videos.length > 1 ? `Ver vídeo ${i + 1} de ${videos.length}` : "Ver vídeo do filhote"}
              whileHover={{ opacity: 1, scale: 1.04 }}
              whileTap={{ scale: 0.94 }}
            >
              {photos[0] && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={optimizePuppyThumb(photos[0]) || photos[0]}
                  alt=""
                  className="h-full w-full object-cover brightness-[0.6]"
                  loading="lazy"
                  decoding="async"
                  aria-hidden="true"
                />
              )}
              <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/55 backdrop-blur-sm">
                  <svg className="ml-[1px] h-3 w-3 text-white" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M6 3.5l7 4.5-7 4.5V3.5z" />
                  </svg>
                </span>
              </span>
              {videos.length > 1 && (
                <span
                  className="absolute bottom-0.5 right-1 text-[9px] font-bold text-white/85 drop-shadow"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
              )}
            </motion.button>
          ))}
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

      {/* ── Player vertical de vídeo (celular) ───────────────────────────── */}
      {reelsOpen && videos.length > 0 && (
        <VideoReelsPlayer
          items={reelItems}
          initialIndex={reelStart}
          onClose={() => setReelsOpen(false)}
          backLabel="Ver fotos"
          ctaLabel="Falar no WhatsApp"
          ariaLabel={`Vídeos de ${puppyName}`}
        />
      )}
    </div>
  );
}
