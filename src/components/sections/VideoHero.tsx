"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  useSpring,
} from "framer-motion";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { PawConfettiButton } from "@/components/motion/PawConfetti";
import { SpringButton } from "@/components/motion/SpringButton";

const waHero = buildWhatsAppLink({
  message: "Olá! Quero saber sobre os filhotes de Spitz Alemão Anão disponíveis na By Império Dog.",
  utmSource: "site",
  utmMedium: "video_hero",
  utmCampaign: "hero_cta",
});

// Palavras do título — cada uma entra com stagger individual
const HEADLINE_WORDS = ["Spitz", "Alemão", "Anão"];

// Curva de animação padrão do projeto — tupla para tipagem correta do Framer Motion
const EASE = [0.21, 0.47, 0.32, 0.98] as [number, number, number, number];
// Spring com overshoot leve — para os CTAs
const SPRING = { type: "spring", stiffness: 320, damping: 24 } as const;

export default function VideoHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoState, setVideoState] = useState<"loading" | "playing" | "paused" | "error">("loading");
  const reduced = useReducedMotion();

  // ── Scroll parallax ─────────────────────────────────────────────────────────
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // Background sobe mais rápido que o conteúdo → profundidade
  const rawBgY = useTransform(
    scrollYProgress, [0, 1],
    reduced ? ["0%", "0%"] : ["0%", "28%"]
  );
  const bgY = useSpring(rawBgY, { stiffness: 80, damping: 20, restDelta: 0.001 });

  // Conteúdo sobe mais suave
  const rawContentY = useTransform(
    scrollYProgress, [0, 1],
    reduced ? ["0%", "0%"] : ["0%", "10%"]
  );
  const contentY = useSpring(rawContentY, { stiffness: 80, damping: 20, restDelta: 0.001 });

  // Overlay escurece levemente ao rolar
  const overlayExtra = useTransform(scrollYProgress, [0, 0.6], [0, 0.25]);

  // ── Lógica de video ─────────────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let staleTimer: ReturnType<typeof setTimeout>;

    const onCanPlay = () => {
      clearTimeout(staleTimer);
      video.play().then(() => setVideoState("playing")).catch(() => setVideoState("paused"));
    };
    const onError = () => { clearTimeout(staleTimer); setVideoState("error"); };
    const onPlaying = () => setVideoState("playing");
    const onPause = () => setVideoState((s) => s !== "error" ? "paused" : s);

    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("error", onError);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("pause", onPause);

    staleTimer = setTimeout(() => {
      setVideoState((s) => s === "loading" ? "paused" : s);
    }, 6000);

    video.play()
      .then(() => { clearTimeout(staleTimer); setVideoState("playing"); })
      .catch(() => { /* Bloqueado — aguarda evento canplay */ });

    return () => {
      clearTimeout(staleTimer);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("error", onError);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("pause", onPause);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePlayClick = () => {
    const video = videoRef.current;
    if (!video) return;
    video.play().then(() => setVideoState("playing")).catch(() => {});
  };

  const showVideo = videoState !== "error";
  const videoVisible = videoState === "playing";
  const showPlayBtn = videoState === "paused";

  // Shortcut: sem animação no modo reduced
  const init = reduced ? false : undefined;

  return (
    <section
      ref={sectionRef}
      className="relative isolate flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-zinc-950"
      aria-labelledby="hero-heading"
    >
      {/* ── Fundo com parallax ───────────────────────────────────────────────── */}
      <motion.div className="absolute inset-0 will-change-transform" style={{ y: bgY }}>
        {/* Video */}
        {showVideo && (
          <video
            ref={videoRef}
            className={`h-full w-full object-cover transition-opacity duration-[1200ms] ${
              videoVisible ? "opacity-100" : "opacity-0"
            }`}
            src="/filhotes/videos/apresentacao-canil.mp4"
            poster="/filhotes/creme/creme-femea-01.jpg"
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
          />
        )}

        {/* Poster enquanto o vídeo carrega */}
        {!videoVisible && (
          <div
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
            style={{ backgroundImage: "url('/filhotes/creme/creme-femea-01.jpg')" }}
            aria-hidden="true"
          />
        )}

        {/* Fallback de erro */}
        {videoState === "error" && (
          <div
            className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-zinc-900 to-zinc-950"
            aria-hidden="true"
          />
        )}
      </motion.div>

      {/* ── Overlays de gradiente ────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.52) 0%, rgba(0,0,0,0.42) 35%, rgba(0,0,0,0.70) 72%, rgba(0,0,0,0.92) 100%)",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.52) 100%)",
        }}
        aria-hidden="true"
      />
      {/* Overlay extra scroll-driven */}
      <motion.div
        className="absolute inset-0 bg-black pointer-events-none"
        style={{ opacity: overlayExtra }}
        aria-hidden="true"
      />

      {/* ── Botão play (autoplay bloqueado) — desktop only ─────────────────── */}
      {showPlayBtn && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, ...SPRING }}
          type="button"
          onClick={handlePlayClick}
          aria-label="Reproduzir vídeo"
          className="absolute right-5 bottom-24 z-20 hidden sm:flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <svg className="h-5 w-5 translate-x-0.5" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M6 3.5l7 4.5-7 4.5V3.5z" />
          </svg>
        </motion.button>
      )}

      {/* ── Conteúdo com parallax suave ─────────────────────────────────────── */}
      <motion.div
        style={{ y: contentY }}
        className="relative z-10 w-full will-change-transform"
      >
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-5 px-5 py-20 text-center sm:gap-7 sm:py-28 sm:px-8">

          {/* Eyebrow — entra primeiro */}
          <motion.span
            initial={init ?? { opacity: 0, y: 18, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.65, delay: 0.2, ease: EASE }}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-1.5 text-xs font-bold uppercase tracking-[0.25em] text-white backdrop-blur-sm"
          >
            Criação especializada · Bragança Paulista, SP
          </motion.span>

          {/* Headline — palavra por palavra */}
          <h1
            id="hero-heading"
            className="text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-7xl"
          >
            {/* Linha 1: "Spitz Alemão Anão" — cada palavra com stagger */}
            <span className="inline-flex flex-wrap justify-center gap-x-[0.26em]">
              {HEADLINE_WORDS.map((word, i) => (
                <motion.span
                  key={word}
                  initial={init ?? { opacity: 0, y: 28, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{
                    duration: 0.6,
                    delay: 0.42 + i * 0.13,
                    ease: EASE,
                  }}
                  className="inline-block"
                >
                  {word}
                </motion.span>
              ))}
            </span>

            {/* Linha 2: "com alma familiar" — emerge com brilho esmeralda */}
            <motion.span
              initial={init ?? { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.82, ease: EASE }}
              className="block bg-gradient-to-r from-emerald-300 to-emerald-400 bg-clip-text text-transparent"
              style={{
                textShadow: "0 0 60px rgba(52,211,153,0.25), 0 0 120px rgba(52,211,153,0.12)",
              }}
            >
              com alma familiar
            </motion.span>
          </h1>

          {/* Parágrafo */}
          <motion.p
            initial={init ?? { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.98, ease: EASE }}
            className="mx-auto max-w-xl text-lg leading-relaxed text-white/80 sm:text-xl"
          >
            Saúde documentada, registro oficial e mentoria vitalícia.{" "}
            <strong className="font-semibold text-white">
              10 anos de criação responsável
            </strong>{" "}
            para a sua família.
          </motion.p>

          {/* CTAs — spring com overshoot */}
          <motion.div
            initial={init ?? { opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, delay: 1.12, ...SPRING }}
            className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center"
          >
            <PawConfettiButton
              href={waHero}
              rel="noreferrer"
              target="_blank"
              className="group inline-flex min-h-[54px] items-center justify-center gap-2.5 rounded-full bg-emerald-500 px-8 text-base font-bold text-white shadow-xl shadow-emerald-900/40 hover:bg-emerald-400 hover:shadow-emerald-400/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              emojis="mixed"
              count={16}
              aria-label="Falar com a criadora via WhatsApp"
            >
              <WhatsAppIcon className="h-5 w-5" aria-hidden="true" />
              Falar com a criadora
            </PawConfettiButton>

            <SpringButton
              as="a"
              preset="soft"
              href="/filhotes"
              className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-full border border-white/35 bg-white/10 px-8 text-base font-semibold text-white backdrop-blur-sm hover:border-white/55 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Ver filhotes disponíveis
            </SpringButton>
          </motion.div>

          {/* Trust bar — números */}
          <motion.dl
            initial={init ?? { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 1.28, ease: EASE }}
            className="mt-2 flex items-center justify-center gap-4 sm:mt-3 sm:gap-x-8"
          >
            {[
              { value: "10+", label: "anos" },
              { value: "180+", label: "famílias" },
              { value: "FCI", label: "registro" },
            ].map((item, i, arr) => (
              <div key={item.label} className="flex items-center gap-1.5 sm:gap-2.5">
                <dt className="text-xl font-bold text-white sm:text-2xl">{item.value}</dt>
                <dd className="text-xs text-white/65 sm:text-sm">{item.label}</dd>
                {i < arr.length - 1 && (
                  <span className="ml-2 h-4 w-px bg-white/25 sm:ml-8" aria-hidden="true" />
                )}
              </div>
            ))}
          </motion.dl>
        </div>
      </motion.div>

      {/* ── Scroll cue ────────────────────────────────────────────────────────── */}
      <motion.div
        initial={init ?? { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, delay: 1.55, ease: EASE }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40"
        aria-hidden="true"
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.3em]">Rolar</span>
        <motion.span
          animate={{ scaleY: [1, 0.4, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="h-8 w-px bg-white/40 origin-top block"
        />
      </motion.div>
    </section>
  );
}
