"use client";

import { Award, ChevronRight, FileText, Headset, Heart, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import type { ComponentType, SVGProps } from "react";

import { PataIcon } from "@/components/icons/PataIcon";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import AvaliacoesRotativas from "@/components/reviews/AvaliacoesRotativas";
import { useWhatsAppLink } from "@/hooks/useWhatsAppLink";
import { buildWhatsAppLink } from "@/lib/whatsapp";

import CartaoDaVitrine from "./CartaoDaVitrine";
import VitrineTopo from "./VitrineTopo";

// A página /filhotes, no desenho aprovado em 06/11/2026. As páginas regionais
// continuam em StaticCatalog, com a busca e o cartão de sempre.

type Filhote = {
  id: string;
  slug: string;
  name: string;
  color?: string;
  cor?: string;
  sex?: string;
  gender?: string;
  priceCents?: number;
  price_cents?: number;
  images: string[];
  [key: string]: unknown;
};

type Icone = ComponentType<SVGProps<SVGSVGElement>>;

const PILARES: { icone: Icone; texto: string }[] = [
  { icone: ShieldCheck, texto: "Orientação na escolha" },
  { icone: PataIcon, texto: "Acompanha­mento pós-reserva" },
  { icone: FileText, texto: "Documentação orientada" },
  { icone: Headset, texto: "Atendimento humanizado" },
];

const COMPROMISSOS: { icone: Icone; texto: string }[] = [
  { icone: Award, texto: "Compromisso com o bem-estar" },
  { icone: PataIcon, texto: "Filhotes com alto padrão" },
  { icone: Heart, texto: "Todo o carinho que você e seu pet merecem" },
];

// A ordem é a do desenho. Cor sem filhote publicado continua no filtro: a pessoa
// escolhe, vê que não há foto agora e é levada ao WhatsApp para perguntar.
const CORES_DO_FILTRO = ["branco", "preto", "chocolate", "laranja", "creme", "merle", "particolor"];
const SEXOS_DO_FILTRO = [
  { valor: "female", rotulo: "Fêmea" },
  { valor: "male", rotulo: "Macho" },
];

const corDoFilhote = (p: Filhote) => p.color ?? p.cor?.toLowerCase() ?? "";
const sexoDoFilhote = (p: Filhote) => p.sex ?? p.gender ?? "";

const linkDoPe = buildWhatsAppLink({
  message: "Olá! Vi a vitrine do site e gostaria de tirar dúvidas sobre os filhotes de Spitz Alemão Anão (Lulu da Pomerânia).",
  utmSource: "site",
  utmMedium: "vitrine_pe",
  utmCampaign: "filhotes",
});

export default function VitrineFilhotes({ puppies }: { puppies: Filhote[] }) {
  const [filtroCor, setFiltroCor] = useState("");
  const [filtroSexo, setFiltroSexo] = useState("");

  const cores = useMemo(() => {
    const publicadas = puppies.map(corDoFilhote).filter(Boolean);
    return Array.from(new Set([...CORES_DO_FILTRO, ...publicadas]));
  }, [puppies]);

  // Sem reordenar: `puppiesPublicados` já chega na ordem comercial, e filtrar
  // preserva a ordem de entrada.
  const filtrados = useMemo(
    () =>
      puppies.filter(
        (p) => (!filtroCor || corDoFilhote(p) === filtroCor) && (!filtroSexo || sexoDoFilhote(p) === filtroSexo),
      ),
    [puppies, filtroCor, filtroSexo],
  );

  const temFiltro = Boolean(filtroCor || filtroSexo);
  const limpar = () => {
    setFiltroCor("");
    setFiltroSexo("");
  };

  const linkSemFoto = useMemo(() => {
    const pedido = [filtroCor, SEXOS_DO_FILTRO.find((s) => s.valor === filtroSexo)?.rotulo.toLowerCase()]
      .filter(Boolean)
      .join(" ");
    return buildWhatsAppLink({
      message: `Olá! Vi a vitrine do site e gostaria de saber se há alguma opção de Spitz Alemão Anão (Lulu da Pomerânia) ${pedido} no momento.`,
      utmSource: "site",
      utmMedium: "catalog_empty",
      utmCampaign: "filhotes",
      utmContent: pedido.replace(/\s/g, "_") || undefined,
    });
  }, [filtroCor, filtroSexo]);
  const waSemFoto = useWhatsAppLink(linkSemFoto);
  const waPe = useWhatsAppLink(linkDoPe);

  return (
    <>
      <VitrineTopo />

      <section className="vf tema-claro">
        <div className="vf-miolo">
          <h2 className="vf-titulo">
            Um amor para chamar de seu <Heart aria-hidden="true" strokeWidth={2} />
          </h2>
          <p className="vf-subtitulo">Filhotes legítimos, saudáveis e com suporte em cada etapa.</p>
          <svg className="vf-traco" viewBox="0 0 165 14" fill="none" aria-hidden="true">
            <path d="M1 12C45 3 110 1 164 2C110 4 55 7 1 12Z" fill="#d6a748" />
          </svg>

          <ul className="vf-pilares">
            {PILARES.map(({ icone: Icone, texto }) => (
              <li key={texto}>
                <Icone aria-hidden="true" strokeWidth={1.6} />
                <span>{texto}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="vf-filtros" role="group" aria-label="Filtrar filhotes por cor e sexo">
          <button type="button" className="vf-filtro" aria-pressed={!filtroCor} onClick={() => setFiltroCor("")}>
            Todos
          </button>
          {cores.map((cor) => (
            <button
              key={cor}
              type="button"
              className="vf-filtro"
              aria-pressed={filtroCor === cor}
              onClick={() => setFiltroCor(cor === filtroCor ? "" : cor)}
            >
              {cor.charAt(0).toUpperCase() + cor.slice(1)}
            </button>
          ))}
          <span className="vf-filtros-divisa" aria-hidden="true" />
          {SEXOS_DO_FILTRO.map(({ valor, rotulo }) => (
            <button
              key={valor}
              type="button"
              className="vf-filtro"
              aria-pressed={filtroSexo === valor}
              onClick={() => setFiltroSexo(valor === filtroSexo ? "" : valor)}
            >
              {rotulo}
            </button>
          ))}
          {temFiltro && (
            <button type="button" className="vf-filtro" onClick={limpar}>
              ✕ Limpar
            </button>
          )}
        </div>

        <div className="vf-miolo">
          <h2 className="sr-only">Vitrine de filhotes</h2>
          <p className="sr-only" role="status">
            {filtrados.length} {filtrados.length === 1 ? "referência" : "referências"} na vitrine.
          </p>

          {filtrados.length > 0 ? (
            <ul className="vf-grade">
              {filtrados.map((p) => (
                <li key={p.id}>
                  <CartaoDaVitrine
                    slug={p.slug}
                    name={p.name}
                    color={p.color}
                    cor={p.cor}
                    sex={p.sex}
                    gender={p.gender}
                    priceCents={p.priceCents}
                    price_cents={p.price_cents}
                    images={p.images}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="vf-vazio">
              <p>Não há foto dessa combinação na vitrine agora. Pergunte pelo WhatsApp se há alguma opção no momento.</p>
              <a href={waSemFoto} target="_blank" rel="noopener noreferrer" data-wa-placement="catalog_empty" className="vc-acao">
                <WhatsAppIcon aria-hidden="true" />
                <span>Perguntar pelo WhatsApp</span>
                <ChevronRight aria-hidden="true" strokeWidth={2.4} />
              </a>
              <button type="button" className="vf-vazio-limpar" onClick={limpar}>
                Ver todos os filhotes
              </button>
            </div>
          )}

          <ul className="vf-compromissos">
            {COMPROMISSOS.map(({ icone: Icone, texto }) => (
              <li key={texto}>
                <Icone aria-hidden="true" strokeWidth={1.6} />
                <span>{texto}</span>
              </li>
            ))}
          </ul>

          <a href={waPe} target="_blank" rel="noopener noreferrer" data-wa-placement="hero" className="vf-cta">
            <WhatsAppIcon aria-hidden="true" />
            <span>Seu novo amor está a uma conversa</span>
            <ChevronRight aria-hidden="true" strokeWidth={2.4} />
          </a>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AvaliacoesRotativas className="mt-10" />
      </div>
    </>
  );
}
