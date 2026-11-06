"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import StaticPuppyCard from "@/components/catalog/StaticPuppyCard";
import { buildWhatsAppLink } from "@/lib/whatsapp";

/**
 * Filtros e grade de filhotes da home.
 *
 * Foi carrossel até 05/11/2026. A grade mostra o plantel inteiro sem deslize
 * lateral, e o filtro mostra o resultado completo de uma vez. O cartão é o
 * mesmo de todas as outras páginas (StaticPuppyCard).
 */

export type FilhoteDaHome = {
  id: string;
  slug: string;
  name: string;
  color: string;
  cor?: string;
  sex?: string;
  gender?: string;
  priceCents?: number;
  price_cents?: number;
  images: string[];
};

const FILTROS = [
  { chave: "todos", rotulo: "Todos" },
  { chave: "branco", rotulo: "Branco" },
  { chave: "laranja", rotulo: "Laranja" },
  { chave: "preto", rotulo: "Preto" },
  { chave: "creme", rotulo: "Creme" },
  { chave: "particolor", rotulo: "Particolor" },
  { chave: "chocolate", rotulo: "Chocolate" },
  { chave: "merle", rotulo: "Merle" },
] as const;

type ChaveDoFiltro = (typeof FILTROS)[number]["chave"];

/** Pergunta pelo WhatsApp a cor que está selecionada no filtro sem filhote. */
function linkDaCorSemFoto(chave: ChaveDoFiltro, rotulo: string) {
  return buildWhatsAppLink({
    message: `Olá! Vi na página inicial o filtro de Spitz Alemão Anão (Lulu da Pomerânia) ${rotulo.toLowerCase()} e gostaria de saber se há alguma opção no momento.`,
    utmSource: "site",
    utmMedium: "featured_home",
    utmCampaign: "filhote_card",
    utmContent: chave,
  });
}

export default function GradeDaHome({ filhotes }: { filhotes: FilhoteDaHome[] }) {
  const [filtro, setFiltro] = useState<ChaveDoFiltro>("todos");
  const visiveis = useMemo(
    () => (filtro === "todos" ? filhotes : filhotes.filter((f) => f.color === filtro)),
    [filhotes, filtro],
  );

  const rotuloAtivo = FILTROS.find((f) => f.chave === filtro)?.rotulo ?? "";

  return (
    <div className="hm-miolo">
      <div className="hm-filtros" role="group" aria-label="Filtrar filhotes por cor">
        {FILTROS.map(({ chave, rotulo }) => (
          <button
            key={chave}
            type="button"
            aria-pressed={filtro === chave}
            onClick={() => setFiltro(chave)}
            className="hm-filtro"
          >
            {rotulo}
          </button>
        ))}
      </div>

      {visiveis.length > 0 ? (
        <ul className="grade-filhotes hm-grade">
          {visiveis.map((filhote, i) => (
            <li key={filhote.slug}>
              <StaticPuppyCard {...filhote} priority={i === 0} waMedium="featured_home" waPlacement="featured_home" />
            </li>
          ))}
        </ul>
      ) : (
        /* Particolor, chocolate e merle não têm filhote publicado hoje: o filtro
           diz a verdade em vez de abrir uma grade vazia. */
        <p className="hm-vazio">
          Não há filhote {rotuloAtivo.toLowerCase()} na vitrine agora.{" "}
          <a href={linkDaCorSemFoto(filtro, rotuloAtivo)} target="_blank" rel="noreferrer" data-wa-placement="featured_home">
            Perguntar pelo WhatsApp
          </a>
        </p>
      )}

      <p className="hm-ver-vitrine">
        <Link href="/filhotes">Ver toda a vitrine →</Link>
      </p>
    </div>
  );
}
