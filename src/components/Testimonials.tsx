"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { BLUR_DATA_URL } from "@/lib/placeholders";

import { captionFor } from "./clientPhotoCaptions";
import CLIENT_PHOTOS, { type ClientPhoto } from "./clientPhotos";
import { descreverCaes } from "./clientPhotoScenes";

// Álbum de fotos das famílias clientes.
//
// Era um carrossel: uma foto por vez numa caixa 4/3 deitada, com autoplay de
// 3,5s e três jogos de controles (setas no cabeçalho, setas sobre a foto,
// botões embaixo). Três coisas estavam erradas ao mesmo tempo:
//
// • O formato. São 37 fotos — 15 em retrato, 17 quadradas e 5 em paisagem —
//   dentro de um quadro deitado com `object-contain`. A foto mediana ocupava
//   75% do quadro e a mais estreita 40%: o que a pessoa via era, em boa parte,
//   fundo vazio com a foto no meio.
// • O tempo. 37 fotos a 3,5s são 2min09 para ver o álbum inteiro, e o rótulo
//   "1 de 37" anunciava o tamanho do que estava escondido.
// • O trabalho que um álbum de clientes faz. Ele existe para mostrar
//   *quantidade* de gente satisfeita, e o carrossel é justamente o formato que
//   mostra uma de cada vez.
//
// O mosaico em colunas resolve os três: cada foto entra no próprio formato,
// sem corte e sem tarja lateral, e o olho bate em oito de uma vez. Quem quiser
// ver uma foto grande toca nela e abre no lightbox — que é onde a foto grande
// faz sentido, sob demanda, e não como o único jeito de ver o álbum.
interface AlbumProps {
  title?: string;
  photos?: readonly ClientPhoto[];
  /** Quantas fotos aparecem antes de a pessoa pedir o resto. */
  showCount?: number;
}

export default function Testimonials({
  title = "Clientes",
  photos,
  showCount = 8,
}: AlbumProps) {
  const list = photos?.length ? photos : CLIENT_PHOTOS;
  const total = list.length;

  const [expandido, setExpandido] = useState(false);
  const [aberta, setAberta] = useState<number | null>(null);
  const [montado, setMontado] = useState(false);

  // O lightbox é `position: fixed`, e este componente é renderizado dentro de um
  // ScrollReveal — que anima com `transform`. Um ancestral com transform vira o
  // bloco de referência do `fixed`, então o overlay ficaria preso dentro da
  // seção em vez de cobrir a tela. Por isso vai por portal, direto no body.
  useEffect(() => setMontado(true), []);

  // Para devolver o foco ao card que abriu o lightbox quando ele fechar.
  const gatilhoRef = useRef<HTMLButtonElement | null>(null);
  const dialogoRef = useRef<HTMLDivElement | null>(null);

  const visiveis = expandido ? list : list.slice(0, showCount);
  const restante = total - visiveis.length;

  // A cidade da legenda saía de um rodízio fixo (`CITY_POOL[i % length]`), ou
  // seja, era atribuída à foto pela posição no carrossel — não pela origem real
  // da família. Agora o nome e a cidade vêm do mapa de legendas, um por um; sem
  // entrada no mapa, alt e legenda descrevem só o que a foto mostra.
  // O alt tinha dois textos genéricos para 34 das 37 fotos: quem usa leitor de
  // tela ouvia a mesma frase 34 vezes e não distinguia uma foto da outra. Agora
  // a cor e a quantidade de cães vêm de clientPhotoScenes.ts, conferido foto a
  // foto — o que muda o alt é a imagem, não o palpite.
  const altFor = useCallback((p: string) => {
    const caption = captionFor(p);
    const caes = descreverCaes(p);

    if (caption) {
      const sujeito = caes ?? "o seu Spitz";
      return `${caption.name}, de ${caption.city}, com ${sujeito}`;
    }
    if (caes) return `Família cliente da By Império Dog com ${caes}`;
    return "Família cliente da By Império Dog com o seu Spitz Alemão Anão";
  }, []);

  const abrir = useCallback((i: number, gatilho: HTMLButtonElement | null) => {
    gatilhoRef.current = gatilho;
    setAberta(i);
  }, []);

  const fechar = useCallback(() => {
    setAberta(null);
    // Devolver o foco é o que faz o teclado não recomeçar do topo da página.
    gatilhoRef.current?.focus();
  }, []);

  const irPara = useCallback((i: number) => setAberta(((i % total) + total) % total), [total]);

  // Teclado do lightbox + trava de rolagem do fundo. Sem a trava, rolar dentro
  // do overlay rolava a página atrás dele, e ao fechar a pessoa estava em outro
  // lugar do site.
  useEffect(() => {
    if (aberta === null) return;

    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogoRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        fechar();
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setAberta((i) => (i === null ? i : (i + 1) % total));
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setAberta((i) => (i === null ? i : (i - 1 + total) % total));
        return;
      }
      // Prende o Tab dentro do diálogo: é `aria-modal`, e sem isso o foco
      // continuava passeando pela página coberta pelo overlay.
      if (e.key === "Tab" && dialogoRef.current) {
        const foco = dialogoRef.current.querySelectorAll<HTMLElement>('button:not([tabindex="-1"])');
        if (foco.length === 0) return;
        const primeiro = foco[0];
        const ultimo = foco[foco.length - 1];
        if (e.shiftKey && document.activeElement === primeiro) {
          e.preventDefault();
          ultimo.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault();
          primeiro.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = anterior;
    };
  }, [aberta, fechar, total]);

  // Deslize horizontal dentro do lightbox.
  const toqueX = useRef<number | null>(null);
  const deltaX = useRef(0);

  if (!total) return null;

  const atual = aberta === null ? null : list[aberta];
  const legendaAtual = atual ? captionFor(atual.src) : null;

  return (
    <section aria-label={title} className="relative py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <header className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">{title}</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Histórias reais de famílias e seus Spitz.</p>
        </header>

        {/* Mosaico em colunas (`columns`), não grid: numa grade de células de
            altura fixa toda foto volta a ser cortada, que é o problema que
            estamos consertando. Aqui a coluna aceita a altura que a foto tem, e
            `break-inside-avoid` impede que uma foto seja partida entre duas
            colunas. A leitura fica coluna a coluna em vez de linha a linha — o
            que, para um álbum, não muda nada. */}
        <ul className="columns-2 gap-3 sm:columns-3 lg:columns-4">
          {visiveis.map((foto, i) => {
            const legenda = captionFor(foto.src);
            return (
              <li key={foto.src} className="mb-3 break-inside-avoid">
                <button
                  type="button"
                  onClick={(e) => abrir(i, e.currentTarget)}
                  aria-label={`Ampliar foto ${i + 1} de ${total}: ${altFor(foto.src)}`}
                  className="group relative block w-full overflow-hidden rounded-xl bg-[var(--surface)] ring-1 ring-[var(--border)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <Image
                    src={foto.src}
                    alt={altFor(foto.src)}
                    width={foto.width}
                    height={foto.height}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                    className="h-auto w-full transition duration-500 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  />
                  {legenda && (
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent px-3 pb-2 pt-8 text-left">
                      <span className="block text-xs font-semibold text-white">{legenda.name}</span>
                      <span className="block text-[11px] text-white/80">{legenda.city}</span>
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {restante > 0 && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setExpandido(true)}
              className="inline-flex min-h-[48px] items-center justify-center rounded-full border-2 border-zinc-200 px-8 text-sm font-semibold text-zinc-700 transition hover:border-emerald-500 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              Ver as {total} fotos
            </button>
          </div>
        )}
      </div>

      {montado && aberta !== null && atual &&
        createPortal(
          <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-sm">
            {/* Fechar tocando fora da foto. Era um <div onClick> por cima de
                tudo, com a caixa do diálogo cancelando o clique por
                stopPropagation — leitor de tela não via controle nenhum ali e o
                teclado não alcançava. Agora o fundo é um <button> de verdade,
                atrás do conteúdo. Fica fora do Tab de propósito (tabIndex -1):
                é um atalho de ponteiro, e quem usa teclado já tem o Esc e o X. */}
            <button
              type="button"
              tabIndex={-1}
              aria-label="Fechar"
              onClick={fechar}
              className="absolute inset-0 h-full w-full cursor-default"
            />
            {/* O diálogo cobre a tela inteira para centralizar a foto, então
                deixa o ponteiro passar (`pointer-events-none`) e só os pedaços
                que são conteúdo o recebem de volta. Sem isso, a caixa engolia o
                clique no fundo em toda a área da tela. */}
            <div
              ref={dialogoRef}
              role="dialog"
              aria-modal="true"
              aria-label={`Foto ${aberta + 1} de ${total}`}
              tabIndex={-1}
              className="pointer-events-none relative flex h-full flex-col outline-none"
            >
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="text-sm font-medium tabular-nums text-white/70">
                  {aberta + 1} de {total}
                </span>
                <button
                  type="button"
                  onClick={fechar}
                  aria-label="Fechar"
                  className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <figure className="pointer-events-none flex min-h-0 w-full flex-1 flex-col items-center justify-center px-4 pb-4">
                {/* A caixa da foto tem a proporção da foto, vinda das medidas
                    reais do arquivo. Sem isso ela ocupava a largura toda: numa
                    tela de 1440 sobravam quase 500px de caixa vazia de cada lado
                    da foto — vazia mas ainda capturando o clique, então tocar
                    "fora da foto" não fechava porque tecnicamente ainda era
                    dentro dela. Quando a proporção não cabe (retrato alto no
                    celular), a largura trava no máximo e o `object-contain`
                    encaixa a foto dentro — contra o preto, não aparece nada. */}
                <div
                  className="pointer-events-auto relative min-h-0 max-w-full flex-1"
                  style={{ aspectRatio: `${atual.width} / ${atual.height}` }}
                  onTouchStart={(e) => {
                    if (e.touches.length !== 1) return;
                    toqueX.current = e.touches[0].clientX;
                    deltaX.current = 0;
                  }}
                  onTouchMove={(e) => {
                    if (toqueX.current == null) return;
                    deltaX.current = e.touches[0].clientX - toqueX.current;
                  }}
                  onTouchEnd={() => {
                    if (toqueX.current == null) return;
                    if (Math.abs(deltaX.current) > 40) irPara(aberta + (deltaX.current < 0 ? 1 : -1));
                    toqueX.current = null;
                    deltaX.current = 0;
                  }}
                >
                  <Image
                    key={atual.src}
                    src={atual.src}
                    alt={altFor(atual.src)}
                    fill
                    sizes="(max-width: 768px) 92vw, 70vw"
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                    className="object-contain"
                  />
                </div>
                {legendaAtual && (
                  <figcaption className="mt-3 text-center">
                    <span className="block text-sm font-semibold text-white">{legendaAtual.name}</span>
                    <span className="block text-xs text-white/70">{legendaAtual.city}</span>
                  </figcaption>
                )}
              </figure>

              {/* Um único par de setas. O carrossel anterior tinha três jogos de
                  controles fazendo exatamente a mesma coisa. */}
              {total > 1 && (
                <div className="flex items-center justify-center gap-4 pb-6">
                  <button
                    type="button"
                    onClick={() => irPara(aberta - 1)}
                    aria-label="Foto anterior"
                    className="pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => irPara(aberta + 1)}
                    aria-label="Próxima foto"
                    className="pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </section>
  );
}
