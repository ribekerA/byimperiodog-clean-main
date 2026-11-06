"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

import { PixIcon } from "@/components/icons/PixIcon";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { HeartBurstButton } from "@/components/motion/HeartBurst";
import { PawConfettiButton } from "@/components/motion/PawConfetti";
import { TiltCard } from "@/components/motion/TiltCard";
import {
  partesDoPrecoNoPix,
  textoAPartirDeNoPix,
} from "@/domain/pricing";
import { useWhatsAppLink } from "@/hooks/useWhatsAppLink";
import { descricaoDoFilhote } from "@/lib/nome-do-filhote";
import { capaDoCartao, focoDaFoto } from "@/lib/photo-focus";
import { buildWhatsAppLink } from "@/lib/whatsapp";

// Formatacao de preco vem do dominio, nao daqui.
//
// Este arquivo tinha o seu proprio Intl.NumberFormat com style: "currency".
// Aquele formato separa "R$" do numero com espaco sem quebra (U+00A0), e o
// resto do site escreve "R$ 8.500" com espaco comum. Os dois sao identicos na
// tela e diferentes como texto: a pagina do filhote publicava o preco com
// U+00A0 enquanto a tabela publicava com espaco comum, e nenhuma checagem de
// texto conseguia ligar os dois. formatarPreco e a unica forma reconhecida.

// O card nao anuncia estoque.
//
// Ate 26/08/2026 ele trazia tres coisas que nao podiam continuar: um selo
// "Disponivel"/"Reservado"/"Vendido" lido de um campo que ninguem atualizava a
// cada venda; um selo "Ultimo desta cor" calculado contando quantas entradas do
// proprio arquivo tinham status "available"; e os selos de demanda de
// `getBadgesForPuppy` ("Muito procurado", "Ultimas unidades nessa cor"),
// derivados de um `score` sintetizado ali mesmo a partir de `leadCount`. Os
// tres anunciavam escassez que ninguem media. O card agora e o que sempre foi
// de fato: a foto real de uma combinacao de cor e sexo, com o preco-base dela.
//
// Um selo verde "Disponivel" fixo, sem fonte, voltou em 05/11/2026 e saiu de
// novo em 06/11/2026, as duas vezes por decisao da responsavel. Nada ocupa o
// lugar dele. Se um dia voltar, que seja lido de `puppy-status`, a fonte real,
// que hoje nao chega ate este componente: o campo `status` do arquivo estatico
// nao e reescrito a cada venda. O aviso continua na propria pagina, logo acima
// da grade: "A vitrine nao confirma estoque. Consulte a disponibilidade atual
// pelo WhatsApp."

// O cartao destaca so o valor no PIX: a linha "ou 3x" saiu por pedido da
// responsavel em 06/11/2026. Parcelamento se confirma no atendimento.

// O cartao unico.
//
// Em 05/11/2026 a responsavel pediu um cartao so em todo o projeto, no desenho
// do mockup. Home, vitrine, paginas de cor e de sexo, relacionados, quiz e chat
// usam este componente; os tamanhos vem de `.cartao-filhote`, em globals.css, e
// acompanham a largura do proprio cartao, nao a da tela. O prazo de reserva e a
// galeria saem do cartao e ficam na ficha do filhote.

// ─── Tipos ───────────────────────────────────────────────────────

type StaticPuppyCardProps = {
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
  priority?: boolean;
  /**
   * De onde o card esta sendo renderizado. O markup e um so, e estes campos
   * preservam a origem no relatorio: sem eles, os cliques de todas as paginas
   * cairiam na mesma linha do analytics.
   */
  waMedium?: string;
  waPlacement?: string;
  waCampaign?: string;
};

// ─── Mapas de cor ────────────────────────────────────────────────

/** Glow colorido por pelagem do filhote */
const COLOR_GLOW: Record<string, string> = {
  creme:        "rgba(243,181,98,0.45)",
  laranja:      "rgba(249,115,22,0.40)",
  preto:        "rgba(161,161,170,0.30)",
  "wolf-sable": "rgba(99,102,241,0.35)",
  branco:       "rgba(255,255,255,0.30)",
};
const DEFAULT_GLOW = "rgba(52,211,153,0.30)";

// ─── Componente ──────────────────────────────────────────────────

export default function StaticPuppyCard({
  id,
  slug,
  name,
  color,
  cor,
  sex,
  gender,
  priceCents,
  price_cents,
  images,
  priority = false,
  waMedium = "catalog_card",
  waPlacement = "puppy_card",
  waCampaign = "filhote_card",
}: StaticPuppyCardProps) {
  const corLabel = cor ?? color ?? "";
  const corKey = (color ?? cor ?? "").toLowerCase();
  const sexRaw = sex ?? gender ?? "";
  const sexLabel =
    sexRaw === "female" || sexRaw === "femea" ? "Fêmea" :
    sexRaw === "male"   || sexRaw === "macho" ? "Macho" : "";
  const price = priceCents ?? price_cents;
  const foto = images.find((img) => !img.endsWith(".mp4")) ?? images[0];
  const capa = capaDoCartao(foto);
  const glowColor = COLOR_GLOW[corKey] ?? DEFAULT_GLOW;
  const segundaLinha = [corLabel, sexLabel].filter(Boolean).join(" • ");
  const partes = price ? partesDoPrecoNoPix(price) : null;

  const baseWaLink = useMemo(
    () =>
      buildWhatsAppLink({
        message: `Olá! Vi no site a galeria de ${corLabel} ${sexLabel} e gostaria de conhecer as opções atuais.`,
        utmSource: "site",
        utmMedium: waMedium,
        utmCampaign: waCampaign,
        utmContent: slug,
      }),
    [corLabel, sexLabel, slug, waMedium, waCampaign],
  );
  const waLink = useWhatsAppLink(baseWaLink);

  return (
    <TiltCard glowColor={glowColor} maxTilt={6} className="h-full">
      <article className="cartao-filhote group">
        {/* O coracao fica fora do Link da foto: botao dentro de link e HTML
            invalido e o leitor de tela anuncia os dois juntos. */}
        <div className="cartao-filhote-foto">
          <Link href={`/filhotes/${slug}`} tabIndex={-1} aria-hidden="true" className="absolute inset-0">
            {foto && (
              <Image
                src={capa ?? foto}
                fill
                sizes="(min-width: 1180px) 370px, (min-width: 640px) 31vw, 92vw"
                quality={75}
                priority={priority}
                fetchPriority={priority ? "high" : undefined}
                alt={descricaoDoFilhote(name, corLabel, sexLabel)}
                className="object-cover transition duration-500 group-hover:scale-[1.05]"
                // A capa quadrada ja vem enquadrada; sem ela vale o recorte medido
                // foto a foto (src/lib/photo-focus).
                style={capa ? undefined : { objectPosition: focoDaFoto(foto) }}
              />
            )}
          </Link>
          <div className="cartao-filhote-coracao">
            <HeartBurstButton puppyId={id} size={20} />
          </div>
        </div>

        <div className="cartao-filhote-painel">
          <h3 className="cartao-filhote-nome">
            <Link href={`/filhotes/${slug}`} aria-label={`Ver galeria e detalhes de ${name}`}>
              <span>Spitz Alemão Anão (Lulu da Pomerânia)</span>{" "}
              <span>{segundaLinha}</span>
            </Link>
          </h3>

          {/* Os {" "} entre os spans nao sao enfeite: sem eles o textContent
              viraria "A partir deR$ 4.500,00no PIX" e o portao e2e de
              smoke.spec.ts, que casa a forma completa, nao a encontraria. */}
          {price && partes ? (
            <p className="cartao-filhote-preco" aria-label={textoAPartirDeNoPix(price)}>
              <span className="cartao-filhote-prefixo">{partes.prefixo}</span>{" "}
              <strong>{partes.valor}</strong>{" "}
              <span className="cartao-filhote-pix"><PixIcon />{partes.sufixo}</span>
            </p>
          ) : (
            <p className="cartao-filhote-preco"><strong>Sob consulta</strong></p>
          )}

          {/* CTA — sempre o mesmo: quem informa o que existe hoje e o atendimento */}
          <PawConfettiButton
            href={waLink}
            data-wa-placement={waPlacement}
            data-wa-puppy={slug}
            rel="noreferrer"
            target="_blank"
            wrapperClassName="cartao-filhote-acao-caixa"
            className="cartao-filhote-acao"
            emojis="paw"
            count={14}
            aria-label={`Consultar opções atuais de ${corLabel} ${sexLabel} pelo WhatsApp`}
          >
            <WhatsAppIcon className="cartao-filhote-acao-icone" aria-hidden="true" />
            Consultar
          </PawConfettiButton>
        </div>
      </article>
    </TiltCard>
  );
}
