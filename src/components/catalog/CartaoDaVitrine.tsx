"use client";

import { ChevronRight, Info } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { partesDoPrecoDaVitrine, textoAPartirDeNoPix } from "@/domain/pricing";
import { useWhatsAppLink } from "@/hooks/useWhatsAppLink";
import { descricaoDoFilhote } from "@/lib/nome-do-filhote";
import { capaDoCartao, focoDaFoto } from "@/lib/photo-focus";
import { buildWhatsAppLink } from "@/lib/whatsapp";

// Cartão horizontal de /filhotes, no desenho aprovado em 06/11/2026. As outras
// páginas continuam com StaticPuppyCard.
//
// O selo diz "Disponibilidade a confirmar" em todos os cartões porque é o que a
// vitrine sabe: ela não lê estoque, e quem confirma é o atendimento.

type Props = {
  slug: string;
  name: string;
  color?: string;
  cor?: string;
  sex?: string;
  gender?: string;
  priceCents?: number;
  price_cents?: number;
  images: string[];
};

const capitalizar = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

// O botão fala do filhote da foto: "Consultar Branca", "Consultar Preto".
const corConcordando = (cor: string, femea: boolean) => (femea ? cor.replace(/o$/, "a") : cor);

export default function CartaoDaVitrine({ slug, name, color, cor, sex, gender, priceCents, price_cents, images }: Props) {
  const corLabel = capitalizar(cor ?? color ?? "");
  const sexRaw = sex ?? gender ?? "";
  const femea = sexRaw === "female" || sexRaw === "femea";
  const sexLabel = femea ? "Fêmea" : sexRaw === "male" || sexRaw === "macho" ? "Macho" : "";
  const price = priceCents ?? price_cents;
  const partes = price ? partesDoPrecoDaVitrine(price) : null;
  const foto = images.find((img) => !img.endsWith(".mp4")) ?? images[0];
  const capa = capaDoCartao(foto);

  const baseWaLink = useMemo(
    () =>
      buildWhatsAppLink({
        message: `Olá! Vi no site a galeria de ${corLabel} ${sexLabel} e gostaria de conhecer as opções atuais.`,
        utmSource: "site",
        utmMedium: "catalog_card",
        utmCampaign: "filhote_card",
        utmContent: slug,
      }),
    [corLabel, sexLabel, slug],
  );
  const waLink = useWhatsAppLink(baseWaLink);

  return (
    <article className="vc">
      <div className="vc-corpo">
        <Link href={`/filhotes/${slug}`} tabIndex={-1} aria-hidden="true" className="vc-foto">
          {foto && (
            <Image
              src={capa ?? foto}
              fill
              sizes="(min-width: 1024px) 190px, (min-width: 640px) 25vw, 46vw"
              quality={75}
              // O link em volta é aria-hidden (o título do cartão já leva à página),
              // então o leitor de tela não ouve isto duas vezes. O texto existe para
              // a busca de imagens, que ignorava 13 das 14 fotos da vitrine.
              alt={descricaoDoFilhote(name, corLabel, sexLabel)}
              className="object-cover"
              style={capa ? undefined : { objectPosition: focoDaFoto(foto) }}
            />
          )}
        </Link>

        <div className="vc-painel">
          <p className="vc-selo">
            <Info aria-hidden="true" strokeWidth={2.2} />
            <span>Disponibilidade a confirmar</span>
          </p>

          <h3 className="vc-nome">
            <Link href={`/filhotes/${slug}`} aria-label={`Ver galeria e detalhes de ${name}`}>
              Spitz Alemão Anão {corLabel} • {sexLabel}{" "}
              <span className="vc-nome-lulu">(Lulu da Pomerânia)</span>
            </Link>
          </h3>

          {/* Os {" "} não são enfeite: sem eles o texto vira "A partir deR$ 4.500no Pix"
              e o portão e2e de smoke.spec.ts não encontra a frase. */}
          {price && partes ? (
            <p className="vc-preco" aria-label={textoAPartirDeNoPix(price)}>
              <span className="vc-preco-prefixo">{partes.prefixo}</span>{" "}
              <span className="vc-preco-caixa">
                <strong>{partes.valor}</strong> <span>{partes.sufixo}</span>
              </span>
            </p>
          ) : (
            <p className="vc-preco">
              <span className="vc-preco-caixa"><strong>Sob consulta</strong></span>
            </p>
          )}
        </div>
      </div>

      <a
        href={waLink}
        data-wa-placement="puppy_card"
        data-wa-puppy={slug}
        rel="noreferrer"
        target="_blank"
        className="vc-acao"
        aria-label={`Consultar opções atuais de ${corLabel} ${sexLabel} pelo WhatsApp`}
      >
        <WhatsAppIcon aria-hidden="true" />
        <span>Consultar {corConcordando(corLabel, femea)}</span>
        <ChevronRight aria-hidden="true" strokeWidth={2.4} />
      </a>
    </article>
  );
}
