/**
 * PuppyRelated v2.0 - Design System Refactor
 * Filhotes relacionados (por cor, cidade ou disponibilidade)
 * UX: Cards compactos, fácil navegação
 * A11y: Estrutura semântica, links descritivos
 * 
 * Migrado para usar componentes do Design System:
 * - Card para cada filhote relacionado
 */

import { MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui";
import type { Puppy } from "@/domain/puppy";

type Props = {
  puppies: Puppy[];
};

export function PuppyRelated({ puppies }: Props) {
  if (!puppies || puppies.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="related-heading" className="space-y-6">
      <div>
        <h2 id="related-heading" className="text-2xl font-bold text-zinc-900">
          Outros filhotes disponíveis
        </h2>
        <p className="mt-2 text-base text-zinc-600">Você também pode se interessar por estes</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {puppies.map((puppy) => {
          const href = `/filhotes/${puppy.slug}`;
          const location = [puppy.city, puppy.state].filter(Boolean).join(" / ");
          const priceFormatted = formatPrice(puppy.priceCents);

          return (
            <article key={puppy.id}>
              <Card variant="outline" interactive className="h-full overflow-hidden">
                <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2">
                  {/* Imagem */}
                  <div className="aspect-[4/3] overflow-hidden bg-zinc-100">
                    {puppy.images?.[0] ? (
                      <Image
                        src={puppy.images[0]}
                        alt={`Filhote ${puppy.name}`}
                        fill
                        className="object-cover transition duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm text-zinc-400">
                        Sem imagem
                      </div>
                    )}
                  </div>

                  {/* Conteúdo */}
                  <CardContent className="p-4">
                    <h3 className="line-clamp-2 text-base font-semibold text-zinc-900 group-hover:text-emerald-700">
                      {puppy.name}
                    </h3>

                    <div className="mt-2 flex items-center gap-2 text-sm text-zinc-600">
                      <span className="capitalize">{puppy.color}</span>
                      <span>•</span>
                      <span>{translateSex(puppy.sex)}</span>
                    </div>

                    {location && (
                      <div className="mt-2 flex items-center gap-1 text-sm text-zinc-600">
                        <MapPin className="h-4 w-4" aria-hidden="true" />
                        <span>{location}</span>
                      </div>
                    )}

                    {puppy.priceCents != null && puppy.priceCents > 0 && (
                      <p className="mt-3 text-lg font-bold text-emerald-700">{priceFormatted}</p>
                    )}
                  </CardContent>
                </Link>
              </Card>
            </article>
          );
        })}
      </div>
    </section>
  );
}

// Helpers
function formatPrice(cents: number | null | undefined): string {
  if (cents == null || cents <= 0) return "Consultar";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function translateSex(sex?: string | null): string {
  if (!sex) return "Não informado";
  const lower = sex.toLowerCase();
  if (lower === "male" || lower === "macho") return "Macho";
  if (lower === "female" || lower === "femea" || lower === "fêmea") return "Fêmea";
  return sex;
}
