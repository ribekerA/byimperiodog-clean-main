"use client";

import Link from "next/link";
import { useMemo } from "react";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { HeartBurstButton } from "@/components/motion/HeartBurst";
import { PawConfettiButton } from "@/components/motion/PawConfetti";
import { TiltCard } from "@/components/motion/TiltCard";
import { textoAPartirDe } from "@/domain/pricing";
import { useWhatsAppLink } from "@/hooks/useWhatsAppLink";
import { focoDaFoto } from "@/lib/photo-focus";
import { buildWhatsAppLink } from "@/lib/whatsapp";

// Formatacao de preco vem do dominio, nao daqui.
//
// Este arquivo tinha o seu proprio Intl.NumberFormat com style: "currency".
// Aquele formato separa "R$" do numero com espaco sem quebra (U+00A0), e o
// resto do site escreve "R$ 9.500" com espaco comum. Os dois sao identicos na
// tela e diferentes como texto: a pagina do filhote publicava o preco com
// U+00A0 enquanto a tabela publicava com espaco comum, e nenhuma checagem de
// texto conseguia ligar os dois. formatarPreco e a unica forma reconhecida, e
// textoAPartirDe e ela mais o prefixo que a vitrine exige.

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

// ─── Tipos ────────────────────────────────────────────────────────────────────

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
  description?: string;
  priority?: boolean;
};

// ─── Mapas de cor ─────────────────────────────────────────────────────────────

/** Glow colorido por pelagem do filhote */
const COLOR_GLOW: Record<string, string> = {
  creme:        "rgba(243,181,98,0.45)",
  laranja:      "rgba(249,115,22,0.40)",
  preto:        "rgba(161,161,170,0.30)",
  "wolf-sable": "rgba(99,102,241,0.35)",
  branco:       "rgba(255,255,255,0.30)",
};
const DEFAULT_GLOW = "rgba(52,211,153,0.30)";

// ─── Componente ───────────────────────────────────────────────────────────────

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
  description,
  priority = false,
}: StaticPuppyCardProps) {
  const corLabel = cor ?? color ?? "";
  const corKey = (color ?? cor ?? "").toLowerCase();
  const sexRaw = sex ?? gender ?? "";
  const sexLabel =
    sexRaw === "female" || sexRaw === "femea" ? "Fêmea" :
    sexRaw === "male"   || sexRaw === "macho" ? "Macho" : "";
  const price = priceCents ?? price_cents;
  const cover = images.find((img) => !img.endsWith(".mp4")) ?? images[0];
  const glowColor  = COLOR_GLOW[corKey] ?? DEFAULT_GLOW;

  const baseWaLink = useMemo(
    () =>
      buildWhatsAppLink({
        message: `Olá! Vi no site a galeria de ${corLabel} ${sexLabel} e gostaria de conhecer as opções atuais.`,
        utmSource: "site",
        utmMedium: "catalog_card",
        utmCampaign: "filhote_card",
        utmContent: slug,
      }),
    [corLabel, sexLabel, slug]
  );
  const waLink = useWhatsAppLink(baseWaLink);

  return (
    <TiltCard glowColor={glowColor} maxTilt={9} className="h-full">
      <article className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-900/6 h-full">

        {/* ── Foto (full-bleed, aspect 4/5) ──────────────────────────────────── */}
        <Link
          href={`/filhotes/${slug}`}
          aria-label={`Ver galeria de ${name}`}
          tabIndex={-1}
          aria-hidden="true"
        >
          <div className="relative aspect-[4/5] overflow-hidden bg-zinc-100">
            {cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cover}
                alt={`${name} — Spitz Alemão Anão ${corLabel} ${sexLabel}`}
                // As fotos sao verticais e o filhote raramente esta no mesmo
                // lugar do quadro: quem posa no colo fica no alto, quem posa na
                // grama fica embaixo. O 28% fixo servia para o primeiro caso e
                // deixava o segundo no rodape do card. Agora vem medido foto a
                // foto (src/lib/photo-focus), com o 28% de padrao para quem nao
                // foi medido.
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.07]"
                style={{ objectPosition: focoDaFoto(cover) }}
                loading={priority ? "eager" : "lazy"}
              />
            )}

            {/* Gradiente inferior para legibilidade do glass panel */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(to bottom, rgba(0,0,0,0) 35%, rgba(0,0,0,0.65) 100%)",
              }}
              aria-hidden="true"
            />

            {/* Sexo — top-right. Taxonomia, nao estoque: e o que a foto mostra. */}
            {sexLabel && (
              <span className="absolute right-3 top-3 rounded-full bg-black/50 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
                {sexLabel}
              </span>
            )}
          </div>
        </Link>

        {/* ── Glass info panel ────────────────────────────────────────────────── */}
        <div className="flex flex-1 flex-col gap-3 p-4 backdrop-blur-sm">
          {/* Nome e cor */}
          <div>
            {corLabel && (
              <Link
                href={`/filhotes/cor/${corKey}`}
                className="text-xs font-semibold uppercase tracking-widest text-zinc-500 transition hover:text-emerald-700"
              >
                {corLabel}
              </Link>
            )}
            <Link href={`/filhotes/${slug}`}>
              <h3 className="mt-0.5 text-base font-bold text-zinc-900 transition-colors group-hover:text-emerald-700">
                {name}
              </h3>
            </Link>
            {description && (
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">{description}</p>
            )}
          </div>

          {/* Preço — ponto de partida da combinação, não etiqueta do animal da foto */}
          <div className="mt-auto flex flex-col gap-0.5">
            <span className="text-xl font-extrabold text-[var(--accent-ink)]">
              {price ? textoAPartirDe(price) : "Sob consulta"}
            </span>
            <span className="text-[10px] font-medium text-zinc-500">Documentação inclusa</span>
          </div>

          {/* CTA — sempre o mesmo: quem informa o que existe hoje é o atendimento */}
          <div className="flex items-center gap-2">
            <PawConfettiButton
              href={waLink}
              data-wa-placement="puppy_card"
              data-wa-puppy={slug}
              rel="noreferrer"
              target="_blank"
              wrapperClassName="flex-1"
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white shadow-sm"
              emojis="paw"
              count={14}
              aria-label={`Consultar opções de ${corLabel} ${sexLabel} pelo WhatsApp`}
            >
              <WhatsAppIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
              Consultar opções atuais
            </PawConfettiButton>
            <HeartBurstButton puppyId={id} size={18} className="h-11 w-11 shrink-0" aria-label={`Curtir ${name}`} />
          </div>

          <Link
            href={`/filhotes/${slug}`}
            aria-label={`Ver galeria e detalhes de ${name}`}
            className="text-center text-xs font-medium text-zinc-500 transition hover:text-emerald-700 hover:underline"
          >
            Ver galeria e detalhes →
          </Link>
        </div>
      </article>
    </TiltCard>
  );
}
