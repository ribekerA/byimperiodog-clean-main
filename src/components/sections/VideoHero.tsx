"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { useWhatsAppLink } from "@/hooks/useWhatsAppLink";
import { buildWhatsAppLink } from "@/lib/whatsapp";

const waHero = buildWhatsAppLink({
  // Dizia "...filhotes de Spitz Alemão Anão disponíveis". O site não sabe o que
  // está disponível — quem sabe é o atendimento, e é exatamente isso que a
  // mensagem passou a perguntar.
  message: "Olá! Vi o site da By Império Dog e me interessei pelos filhotes de Spitz Alemão Anão (Lulu da Pomerânia). Pode me contar quais são as opções atuais e os valores?",
  utmSource: "site",
  utmMedium: "video_hero",
  utmCampaign: "hero_cta",
});

/**
 * Topo da home — desenho da referência de 05/11/2026.
 *
 * O que mudou de forma: era um palco de tela cheia, com a fotografia em
 * `position: absolute` e o texto por cima, e virou a divisão da referência —
 * texto à esquerda, fotografia à direita, as duas metades em fluxo normal.
 * Por isso saiu daqui a conta `min-h-[calc(100svh - 73px)]`: ela existia para
 * que o palco terminasse exatamente na dobra, e um bloco que tem o tamanho do
 * próprio conteúdo não precisa dela. A pista "Rolar", desenhada para aquele
 * palco, saiu junto: a seção seguinte agora aparece sozinha sob a fotografia.
 *
 * O que NÃO mudou é o contrato do vídeo. O arquivo tem 25,6 MB e continua fora
 * do DOM até alguém pedir: o `<video>` só é montado depois do clique no botão,
 * e o que carrega na primeira pintura é o pôster de 111 KB, que é o LCP desta
 * página. `tests/components/videoHero.autoplay.test.tsx` cobra isso em 4g, 3g,
 * 2g, slow-2g, com Save-Data e com prefers-reduced-motion.
 */
export default function VideoHero({ reviewSummary }: { reviewSummary?: ReactNode }) {
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
    <section className="secao-escura ornamento-ouro relative" aria-labelledby="hero-heading">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:py-20">

        {/* ── Metade do texto ───────────────────────────────────────────────
            `order-2` no celular: a fotografia é o que para o dedo, e na
            referência ela também vem antes do texto na coluna estreita. */}
        <div className="relative z-10 order-2 text-center lg:order-1 lg:text-left">

          {/* O título da referência tem duas linhas e a segunda é maior. A cor
              vai nos <span> e não no <h1>: `.secao-escura .titulo-editorial`
              pinta o título de ouro, e aqui ele é creme. Regra no filho ganha
              de herança sem precisar de `!important`. */}
          <h1 id="hero-heading" className="titulo-editorial">
            <span className="block text-[2.5rem] leading-[1.05] text-[var(--text-light)] sm:text-6xl lg:text-7xl">
              Spitz Alemão
            </span>
            <span className="block text-[3.25rem] leading-[1.05] text-[var(--text-light)] sm:text-7xl lg:text-[5.5rem]">
              Anão
            </span>
            {/* Fora da referência, e fica. É por "Lulu da Pomerânia" que a raça
                é de fato pesquisada, e o nome não está no <title> por falta de
                espaço: este é o único lugar da home onde ele aparece dentro de
                um cabeçalho. Em tamanho de linha de apoio, para não disputar
                com o título. */}
            <span className="mt-2 block font-sans text-sm font-semibold uppercase tracking-[0.2em] text-white/60 sm:text-base">
              Lulu da Pomerânia
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-white/80 sm:text-lg lg:mx-0">
            Beleza, carinho e companheirismo em um só pet.
          </p>

          {/* Traço ondulado da referência. SVG inline de um caminho só: é
              ornamento, não precisa de arquivo nem de requisição. */}
          <svg
            viewBox="0 0 140 14"
            className="mx-auto mt-5 h-4 w-32 overflow-visible lg:mx-0"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M2 9c16-9 32 1 48 1s32-10 48-1" />
            <circle cx="126" cy="7" r="2.5" fill="var(--accent)" stroke="none" />
            <circle cx="135" cy="7" r="1.5" fill="var(--accent)" stroke="none" />
          </svg>

          {/* Selo da referência. "Procedência" e "suporte especializado"
              descrevem o que o site já sustenta em outro lugar: a origem
              declarada em contrato e a mentoria pós-venda com a criadora. Não
              diz garantia, não diz exame e não diz número. */}
          <p className="selo-procedencia mt-6">
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 12l2 2 4-4M12 3l7 3v6c0 4.4-3 8.3-7 9-4-.7-7-4.6-7-9V6l7-3z" />
            </svg>
            Canil com procedência e suporte especializado
          </p>

          {/* Os dois CTAs não estão na referência, cuja primeira chamada é a
              faixa dourada do fim da página. Ficam porque o site vende por
              WhatsApp: tirar o botão da dobra tiraria o caminho de conversão
              da única tela que 100% das visitas veem. */}
          <div className="mt-7 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
            <a
              href={trackedWaHero}
              data-wa-placement="hero"
              rel="noreferrer"
              target="_blank"
              className="inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-full bg-[var(--whatsapp)] px-7 text-base font-bold text-[var(--whatsapp-contrast)] shadow-xl shadow-black/30 transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              aria-label="Vamos conversar sobre o seu novo amor pelo WhatsApp"
            >
              <WhatsAppIcon className="h-5 w-5" aria-hidden="true" />
              Vamos conversar sobre o seu novo amor
            </a>

            <Link
              href="/filhotes"
              prefetch={false}
              className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-white/35 bg-white/10 px-7 text-base font-semibold text-white transition hover:border-white/55 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Ver a vitrine de filhotes
            </Link>
          </div>

          {reviewSummary}
        </div>

        {/* ── Metade da fotografia ──────────────────────────────────────────
            Moldura dourada arredondada no lugar da foto sangrada da
            referência: a fotografia aqui é a de sempre, retrato de um animal
            real, e a moldura é o que a separa do verde sem precisar de um
            degradê por cima dela. */}
        <div className="order-1 lg:order-2">
          <div className="moldura-ouro relative aspect-[4/3] w-full overflow-hidden rounded-3xl lg:aspect-square">

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

            {/* Pôster. É o LCP da home, então `priority` e `fetchPriority`
                continuam aqui. O `sizes` desceu de 100vw para a largura real
                da metade: acima de lg a imagem nunca passa de 620px. */}
            {!videoVisible && (
              <Image
                src="/spitz-hero-desktop.webp"
                alt="Filhote de Spitz Alemão Anão (Lulu da Pomerânia) de pelagem clara, em close."
                fill
                priority
                fetchPriority="high"
                quality={75}
                sizes="(min-width: 1024px) 620px, 100vw"
                className="object-cover object-[center_60%]"
              />
            )}

            {videoState === "error" && (
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-zinc-900 to-zinc-950" aria-hidden="true" />
            )}

            {showPlayBtn && (
              <button
                type="button"
                onClick={handlePlayClick}
                aria-label="Reproduzir vídeo"
                className="absolute bottom-4 right-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/65 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <svg className="h-5 w-5 translate-x-0.5" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M6 3.5l7 4.5-7 4.5V3.5z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
