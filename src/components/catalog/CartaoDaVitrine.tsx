"use client";

import { CircleCheck, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { partesDoPrecoDaVitrine, textoAPartirDeNoPix } from "@/domain/pricing";
import { useWhatsAppLink } from "@/hooks/useWhatsAppLink";
import { descricaoDoFilhote, perguntarPeloFilhote } from "@/lib/nome-do-filhote";
import { capaDoCartao, focoDaFoto } from "@/lib/photo-focus";
import { buildWhatsAppLink } from "@/lib/whatsapp";

// Cartão horizontal de /filhotes, no desenho aprovado em 06/11/2026. As outras
// páginas continuam com StaticPuppyCard.
//
// O selo diz "Disponível agora" em todos os cartões por decisão do canil em
// 18/11/2026, que confirmou os 10 da vitrine como disponíveis. Quando um for
// vendido, tire-o da vitrine para o selo não ficar errado.

type Props = {
  slug: string;
  name: string;
  cardTitle?: string;
  color?: string;
  cor?: string;
  sex?: string;
  gender?: string;
  priceCents?: number;
  price_cents?: number;
  images: string[];
};

const capitalizar = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

// O botão fala do filhote da foto ("Perguntar pela Branca"): o texto sai de
// perguntarPeloFilhote, o mesmo dos outros botões de filhote do site.

export default function CartaoDaVitrine({ slug, name, cardTitle, color, cor, sex, gender, priceCents, price_cents, images }: Props) {
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
        message: `Olá! Vi no site a galeria de ${cardTitle ?? `${corLabel} ${sexLabel}`} e gostaria de conhecer as opções atuais.`,
        utmSource: "site",
        utmMedium: "catalog_card",
        utmCampaign: "filhote_card",
        utmContent: slug,
      }),
    [cardTitle, corLabel, sexLabel, slug],
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
              sizes="(min-width: 1024px) 220px, (min-width: 640px) 25vw, 46vw"
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

        {/* data-wa-safe-zone: no celular a bolha do WhatsApp cobria o nome e o
            preço do cartão (auditoria de UX de 17/11/2026); sobre o texto ela sai da frente. */}
        <div data-wa-safe-zone className="vc-painel">
          <p className="vc-selo">
            <CircleCheck aria-hidden="true" strokeWidth={2.2} />
            <span>Disponível agora</span>
          </p>

          <h3 className="vc-nome">
            <Link href={`/filhotes/${slug}`} aria-label={`Ver galeria e detalhes de ${name}`}>
              Spitz Alemão Anão {cardTitle ?? `${corLabel} • ${sexLabel}`}{" "}
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
        aria-label={`${perguntarPeloFilhote(corLabel, sexLabel)}, ${sexLabel}, no WhatsApp`}
      >
        <WhatsAppIcon aria-hidden="true" />
        <span>{perguntarPeloFilhote(corLabel, sexLabel)}</span>
        <ChevronRight aria-hidden="true" strokeWidth={2.4} />
      </a>
    </article>
  );
}
