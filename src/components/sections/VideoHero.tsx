"use client";

import Image from "next/image";
import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { FOUNDING_YEAR } from "@/domain/config";
import { useWhatsAppLink } from "@/hooks/useWhatsAppLink";
import { buildWhatsAppLink } from "@/lib/whatsapp";

const waHero = buildWhatsAppLink({
  // Dizia "...filhotes de Spitz Alemão Anão disponíveis". O site não sabe o que
  // está disponível — quem sabe é o atendimento, e é exatamente isso que a
  // mensagem passou a perguntar.
  message: "Olá! Vi o site da By Império Dog e me interessei pelos filhotes de Spitz Alemão Anão. Pode me contar quais são as opções atuais e os valores?",
  utmSource: "site",
  utmMedium: "video_hero",
  utmCampaign: "hero_cta",
});

// Palavras do título — cada uma entra com stagger individual
const HEADLINE_WORDS = ["Spitz", "Alemão", "Anão"];

export default function VideoHero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoState, setVideoState] = useState<"loading" | "playing" | "paused" | "error">("paused");
  const [videoRequested, setVideoRequested] = useState(false);
  const trackedWaHero = useWhatsAppLink(waHero);

  // ── Lógica de video ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!videoRequested) return;
    const video = videoRef.current;
    if (!video) return;

    let staleTimer: ReturnType<typeof setTimeout>;

    // O elemento de video — e portanto seu src de 25,6 MB — só existe depois
    // deste clique. O poster otimizado permanece como primeira pintura/LCP.

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

    const startPlayback = () => {
      staleTimer = setTimeout(() => {
        setVideoState((s) => s === "loading" ? "paused" : s);
      }, 6000);

      video.play()
        .then(() => { clearTimeout(staleTimer); setVideoState("playing"); })
        .catch(() => { /* Aguarda canplay ou novo clique. */ });
    };

    startPlayback();

    return () => {
      clearTimeout(staleTimer);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("error", onError);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("pause", onPause);
    };
  }, [videoRequested]);

  const handlePlayClick = () => {
    setVideoState("loading");
    setVideoRequested(true);
  };

  const showVideo = videoState !== "error";
  const videoVisible = videoState === "playing";
  const showPlayBtn = videoState === "paused";

  return (
    <section
      // O header do site é `sticky top-0` e opaco: ele ocupa 73px do fluxo, e o
      // hero começa depois dele. Com `min-h-[100svh]` o hero media a tela inteira
      // a partir do 73 — terminava 73px depois da dobra. Duas consequências, e
      // nenhuma delas era intencional: sobrava vídeo preto sem nada logo abaixo
      // do último elemento, e a pista "Rolar", que é `bottom-8` desta section,
      // caía fora da primeira tela em todos os aparelhos — o indicador de rolagem
      // só aparecia depois de a pessoa já ter rolado.
      //
      // Descontando a altura do header o hero passa a terminar na dobra. São
      // dois valores porque o header tem dois tamanhos: 73px enquanto o bloco de
      // botões é `lg:flex` e não aparece, 87px a partir de lg, quando aparece.
      // No celular desconta-se mais 87px de propósito: é a próxima seção
      // aparecendo por baixo, que é a pista de rolagem que funciona sem precisar
      // de desenho nenhum — e a pista desenhada é `sm:flex`, não existe no
      // celular. Se o header mudar de altura, estes números mudam junto.
      className="relative isolate flex min-h-[calc(100svh_-_10rem)] flex-col items-center justify-center overflow-hidden bg-zinc-950 sm:min-h-[calc(100svh_-_73px)] lg:min-h-[calc(100svh_-_87px)]"
      aria-labelledby="hero-heading"
    >
      {/* ── Fundo ────────────────────────────────────────────────────────────── */}
      <div className="absolute inset-0">
        {/* Video */}
        {videoRequested && showVideo && (
          <video
            ref={videoRef}
            className={`absolute inset-0 z-10 h-full w-full object-cover transition-opacity duration-500 ${
              videoVisible ? "opacity-100" : "opacity-0"
            }`}
            src="/filhotes/videos/apresentacao-canil.mp4"
            muted
            loop
            playsInline
            preload="none"
            aria-hidden="true"
          />
        )}

        {/* Poster enquanto o vídeo carrega */}
        {!videoVisible && (
          <Image
            src="/filhotes/creme/creme-femea-01.jpg"
            alt=""
            fill
            priority
            fetchPriority="high"
            quality={45}
            sizes="100vw"
            className="object-cover object-center"
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
      </div>

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

      {/* ── Botão play (autoplay bloqueado) — desktop only ─────────────────── */}
      {showPlayBtn && (
        <button
          type="button"
          onClick={handlePlayClick}
          aria-label="Reproduzir vídeo"
          className="absolute right-5 bottom-24 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <svg className="h-5 w-5 translate-x-0.5" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M6 3.5l7 4.5-7 4.5V3.5z" />
          </svg>
        </button>
      )}

      {/* ── Conteúdo ─────────────────────────────────────────────────────────── */}
      <div className="relative z-10 w-full">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-5 px-5 py-8 text-center sm:gap-7 sm:py-16 sm:px-8">

          {/* Eyebrow — entra primeiro.
              A contagem ao vivo de filhotes saiu daqui a pedido da
              responsável, e com a vitrine evergreen ela nao volta: numero no topo
              da dobra vira promessa de estoque que o site teria que sustentar a
              cada ninhada. Disponibilidade se confirma no atendimento. */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-1.5 text-xs font-bold uppercase tracking-[0.25em] text-white backdrop-blur-sm">
              Criação especializada · Bragança Paulista, SP
            </span>
          </div>

          {/* Headline — palavra por palavra */}
          <h1
            id="hero-heading"
            className="text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-7xl"
          >
            {/* Linha 1: "Spitz Alemão Anão" — cada palavra com stagger */}
            <span className="inline-flex flex-wrap justify-center gap-x-[0.26em]">
              {HEADLINE_WORDS.map((word, i) => (
                <Fragment key={word}>
                <span className="inline-block">
                  {word}
                </span>
                {i < HEADLINE_WORDS.length - 1 ? " " : null}
                </Fragment>
              ))}
            </span>

            {/* Linha 1b: "(Lulu da Pomerânia)" — nome popular da raça, clarificador estático */}
            {" "}
            <span className="block text-xl font-semibold text-white/70 sm:text-2xl lg:text-3xl">
              (Lulu da Pomerânia)
            </span>

            {/* Linha 2: "com alma familiar" — emerge com brilho esmeralda */}
            {" "}
            <span
              className="block bg-gradient-to-r from-emerald-300 to-emerald-400 bg-clip-text text-transparent"
              style={{
                textShadow: "0 0 60px rgba(52,211,153,0.25), 0 0 120px rgba(52,211,153,0.12)",
              }}
            >
              com alma familiar
            </span>
          </h1>

          {/* Parágrafo */}
          <p className="mx-auto max-w-xl text-lg leading-relaxed text-white/80 sm:text-xl">
            Saúde documentada, registro oficial e mentoria pós-venda.{" "}
            <strong className="font-semibold text-white">
              Criação responsável desde {FOUNDING_YEAR}
            </strong>{" "}
            para a sua família.
          </p>

          {/* CTAs — spring com overshoot */}
          <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
            <a
              href={trackedWaHero}
              data-wa-placement="hero"
              rel="noreferrer"
              target="_blank"
              className="group inline-flex min-h-[54px] items-center justify-center gap-2.5 rounded-full bg-emerald-700 px-8 text-base font-bold text-white shadow-xl shadow-emerald-900/40 hover:bg-emerald-600 hover:shadow-emerald-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Falar com a criadora via WhatsApp"
            >
              <WhatsAppIcon className="h-5 w-5" aria-hidden="true" />
              Falar com a criadora
            </a>

            <Link
              href="/filhotes"
              prefetch={false}
              className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-full border border-white/35 bg-white/10 px-8 text-base font-semibold text-white backdrop-blur-sm hover:border-white/55 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Ver a vitrine de filhotes
            </Link>
          </div>

          {/* Trust bar — números */}
          <div className="mt-2 flex flex-col items-center gap-2 sm:mt-3">
            {/* Prova social acima da dobra — sem nota em estrelas, que não vem
                de nenhuma plataforma pública de avaliações verificadas, e sem
                contagem de famílias, que não vem de lugar nenhum. O que sobra
                é a área de atendimento, que é fato operacional. */}
            <div className="flex items-center gap-2">
              <span className="text-base leading-none" aria-hidden="true">🐾</span>
              <span className="text-xs text-white/70">Atendemos famílias em todo o Brasil</span>
            </div>
            {/* Stats — empilhado no mobile para não quebrar no meio de um item e
                colidir com o indicador "Rolar" (absolute, bottom-8 da section) */}
            <dl className="flex flex-col items-center gap-1 sm:flex-row sm:justify-center sm:gap-x-8">
              {[
                // O ano de fundacao nao envelhece; "13 anos" precisa ser reescrito
                // todo ano e conflita com o "desde 2013" da mesma dobra.
                // "100% com laudos" era percentual absoluto sem evidencia no
                // projeto: virou a descricao factual do que acompanha o filhote.
                { value: `Desde ${FOUNDING_YEAR}`, label: "criando a raça" },
                { value: "FCI/CBKC", label: "registro oficial" },
                { value: "Saúde", label: "documentada" },
              ].map((item, i, arr) => (
                <div key={item.label} className="flex items-center gap-1.5 sm:gap-2.5">
                  <dt className="text-base font-bold text-white sm:text-xl">{item.value}</dt>
                  <dd className="text-xs text-white/60">{item.label}</dd>
                  {i < arr.length - 1 && (
                    <span className="hidden h-4 w-px bg-white/25 sm:ml-6 sm:block" aria-hidden="true" />
                  )}
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* ── Scroll cue ────────────────────────────────────────────────────────── */}
      <div
        className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-white/40 sm:flex"
        aria-hidden="true"
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.3em]">Rolar</span>
        <span className="h-8 w-px bg-white/40 origin-top block motion-safe:animate-pulse" />
      </div>
    </section>
  );
}
