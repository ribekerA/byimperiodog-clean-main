/**
 * PuppyHero v2.0 - Design System Refactor
 * Hero do produto: imagem principal, nome, badge de status, preço e CTA primário
 * UX: Clareza imediata sobre disponibilidade e próximo passo
 * A11y: h1 semântico, aria-labels, foco visível
 * 
 * Migrado para usar componentes do Design System:
 * - Button para CTAs
 * - StatusBadge para status
 * - Card para descrição (opcional)
 */

import { Heart, MapPin } from "lucide-react";
import Image from "next/image";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Button, StatusBadge } from "@/components/ui";
import type { Puppy } from "@/domain/puppy";
import { getNextImageProps } from "@/lib/images";

type Props = {
  puppy: Puppy;
  whatsappLink: string;
  onFavorite?: () => void;
  isFavorited?: boolean;
};

export function PuppyHero({ puppy, whatsappLink, onFavorite, isFavorited }: Props) {
  const priceFormatted = formatPrice(puppy.priceCents);
  const location = [puppy.city, puppy.state].filter(Boolean).join(" / ");

  return (
    <section className="grid gap-6 lg:grid-cols-2 lg:gap-10" aria-labelledby="puppy-name">
      {/* Imagem principal com badge de status */}
      <div className="relative">
        <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 shadow-lg">
          {puppy.images?.[0] ? (
            <Image
              {...getNextImageProps(puppy.slug, "hero", { priority: true })}
              alt={`Filhote ${puppy.name} - Spitz Alemão Anão ${puppy.color}, ${translateSex(puppy.sex)}, ${location}`}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-zinc-400">
              Imagem não disponível
            </div>
          )}
        </div>

        {/* Badge de status sobreposto */}
        <div className="absolute left-4 top-4">
          <StatusBadge status={puppy.status as any} size="md" />
        </div>

        {/* Botão de favoritar (opcional) */}
        {onFavorite && (
          <button
            type="button"
            onClick={onFavorite}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm transition hover:bg-white hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            aria-label={isFavorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            aria-pressed={isFavorited}
          >
            <Heart
              className={`h-5 w-5 transition ${isFavorited ? "fill-rose-500 text-rose-500" : "text-zinc-600"}`}
              aria-hidden="true"
            />
          </button>
        )}
      </div>

      {/* Informações principais e CTA */}
      <div className="flex flex-col justify-between gap-6">
        <div className="space-y-4">
          {/* Nome do filhote */}
          <h1 id="puppy-name" className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            {puppy.name}
          </h1>

          {/* Localização */}
          {location && (
            <div className="flex items-center gap-2 text-zinc-600">
              <MapPin className="h-5 w-5 text-emerald-600" aria-hidden="true" />
              <span className="text-base">{location}</span>
            </div>
          )}

          {/* Preço */}
          {puppy.priceCents != null && puppy.priceCents > 0 && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-600">Investimento</p>
              <p className="text-3xl font-bold text-emerald-700" aria-label={`Preço: ${priceFormatted}`}>
                {priceFormatted}
              </p>
              <p className="text-sm text-zinc-500">Parcelamento disponível via WhatsApp</p>
            </div>
          )}

          {/* Descrição breve */}
          {puppy.description && (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm leading-relaxed text-zinc-700">{puppy.description}</p>
            </div>
          )}
        </div>

        {/* CTA principal */}
        <div className="space-y-3">
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Quero esse filhote - Falar no WhatsApp"
            className="w-full"
          >
            <Button
              variant="solid"
              size="lg"
              className="w-full gap-2 rounded-full"
            >
              <WhatsAppIcon className="h-5 w-5" aria-hidden="true" />
              Quero esse filhote
            </Button>
          </a>
          <p className="text-center text-xs text-zinc-500">
            Resposta em até 1 hora • Atendimento humanizado 7 dias por semana
          </p>
        </div>
      </div>
    </section>
  );
}

// Helpers
function formatPrice(cents: number | null | undefined): string {
  if (cents == null || cents <= 0) return "Consultar valor";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function translateSex(sex?: string | null): string {
  if (!sex) return "não informado";
  const lower = sex.toLowerCase();
  if (lower === "male" || lower === "macho") return "Macho";
  if (lower === "female" || lower === "femea" || lower === "fêmea") return "Fêmea";
  return sex;
}
