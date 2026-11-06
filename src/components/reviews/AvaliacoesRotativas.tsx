"use client";

/**
 * A faixa de avaliações do Google: uma de cada vez, passando sozinha, até todas
 * terem aparecido.
 *
 * Todas as avaliações da transcrição entram, inclusive as que só têm estrelas,
 * e as com texto vêm primeiro. A nota e o total são o resumo do perfil, não a
 * média desta amostra, e aparecem com a data em que foram conferidos.
 *
 * Três decisões de propósito:
 *
 *  • Sem AggregateRating nem schema de estrelas: autoavaliação marcada como dado
 *    estruturado é o que as diretrizes do Google não aceitam.
 *  • A inicial no lugar do retrato: não há foto autorizada de quem avaliou, e um
 *    rosto genérico ao lado de um nome real inventaria uma pessoa.
 *  • Só avaliações do Google aqui: os relatos enviados pelas famílias ficam em
 *    TextTestimonials, porque não fazem parte desse 4,9.
 *
 * As avaliações ocupam a mesma célula da grade e as inativas ficam só invisíveis.
 * Assim a faixa já nasce com a altura da mais longa, nada pula na troca e nenhum
 * texto precisa ser cortado.
 */

import Image from "next/image";
import { useState } from "react";

import { usePassagemAutomatica } from "@/components/reviews/usePassagemAutomatica";
import { googleReviewSnapshot, googleReviews } from "@/content/google-reviews";
import { GOOGLE_BUSINESS_PROFILE_URL } from "@/domain/config";

const TEMPO_DE_CADA_UMA_MS = 7000;

const AVALIACOES = [...googleReviews.filter((r) => r.text), ...googleReviews.filter((r) => !r.text)];
const TOTAL = AVALIACOES.length;
const NOTA = googleReviewSnapshot.rating.toLocaleString("pt-BR");

export default function AvaliacoesRotativas({ className = "" }: { className?: string }) {
  const [indice, setIndice] = useState(0);
  const { raiz, rodando, parado, alternaParado } = usePassagemAutomatica<HTMLElement>(
    () => setIndice((i) => (i + 1) % TOTAL),
    TEMPO_DE_CADA_UMA_MS,
    [indice],
  );

  const anda = (passo: number) => setIndice((i) => (i + passo + TOTAL) % TOTAL);

  return (
    <section
      ref={raiz}
      aria-label="Avaliações publicadas no Google"
      aria-roledescription="carrossel"
      className={`avaliacoes-rotativas ${className}`}
    >
      <div className="ar-nota">
        <Image src="/images/home/estrela.webp" alt="" width={140} height={136} unoptimized />
        <p>
          <span className="ar-nota-titulo">Avaliações reais</span>{" "}
          <span className="ar-nota-numero"><strong>{NOTA}/5</strong> no Google</span>{" "}
          <span className="ar-nota-resumo">{googleReviewSnapshot.total} no perfil</span>
        </p>
      </div>

      {/* Com a passagem automática ligada, o leitor de tela não é interrompido. */}
      <div className="ar-palco" aria-live={rodando ? "off" : "polite"}>
        {AVALIACOES.map((avaliacao, i) => (
          <figure key={avaliacao.id} className="ar-slide" data-ativa={i === indice ? "" : undefined} aria-hidden={i !== indice}>
            <span className="ar-inicial" aria-hidden="true">{avaliacao.name.trim().charAt(0).toUpperCase()}</span>
            <div className="min-w-0">
              <blockquote className="ar-citacao">
                {avaliacao.text ? <>“{avaliacao.text}”</> : <>Avaliação de {avaliacao.rating} estrelas no Google.</>}
              </blockquote>
              <figcaption className="ar-autoria">
                <span role="img" aria-label={`${avaliacao.rating} de 5 estrelas`} className="ar-estrelas">
                  <span aria-hidden="true">{"★".repeat(avaliacao.rating)}</span>
                </span>
                <span>{avaliacao.name} · {avaliacao.displayedDate}</span>
                {avaliacao.excerpt && <span className="ar-aviso">Trecho: o texto completo está no Google.</span>}
                {avaliacao.translated && <span className="ar-aviso">Tradução exibida pelo Google.</span>}
              </figcaption>
            </div>
          </figure>
        ))}
      </div>

      <div className="ar-controles">
        <div className="ar-botoes">
          <button type="button" className="ar-botao" aria-label="Avaliação anterior" onClick={() => anda(-1)}>
            <span aria-hidden="true">‹</span>
          </button>
          <button
            type="button"
            className="ar-botao"
            aria-label={parado ? "Retomar a passagem das avaliações" : "Pausar a passagem das avaliações"}
            onClick={alternaParado}
          >
            <span aria-hidden="true" className="ar-icone-pausa">{parado ? "▶" : "❚❚"}</span>
          </button>
          <button type="button" className="ar-botao" aria-label="Próxima avaliação" onClick={() => anda(1)}>
            <span aria-hidden="true">›</span>
          </button>
        </div>
        <p className="ar-contagem">{indice + 1} de {TOTAL}</p>
        <a href={GOOGLE_BUSINESS_PROFILE_URL} target="_blank" rel="noopener noreferrer" className="ar-link">
          Ver no Google<span className="sr-only"> (abre em nova aba)</span>
        </a>
      </div>
    </section>
  );
}
