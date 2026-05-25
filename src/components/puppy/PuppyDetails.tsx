/**
 * Informações detalhadas do filhote em tabela/ficha
 * UX: Dados organizados em pares chave-valor
 * A11y: Semântico com divs, tempo em time, ícones decorativos
 */

import { Calendar, Palette, PawPrint, Ruler } from "lucide-react";

import type { Puppy } from "@/domain/puppy";

type Props = {
  puppy: Puppy;
};

export function PuppyDetails({ puppy }: Props) {
  const birthDate = puppy.birthDate ? new Date(puppy.birthDate) : null;
  const ageInDays = birthDate ? Math.floor((Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24)) : null;
  const ageText = ageInDays ? formatAge(ageInDays) : null;

  return (
    <section aria-labelledby="puppy-details-heading" className="space-y-6">
      <h2 id="puppy-details-heading" className="text-2xl font-bold text-zinc-900">
        Detalhes do filhote
      </h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {puppy.color && (
          <div className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
              <Palette className="h-5 w-5 text-emerald-600" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-zinc-600">Cor</div>
              <div className="mt-0.5 text-base font-semibold text-zinc-900 capitalize">{puppy.color}</div>
            </div>
          </div>
        )}

        {puppy.sex && (
          <div className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
              <PawPrint className="h-5 w-5 text-blue-600" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-zinc-600">Sexo</div>
              <div className="mt-0.5 text-base font-semibold text-zinc-900">{translateSex(puppy.sex)}</div>
            </div>
          </div>
        )}

        {birthDate && ageText && (
          <div className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-50">
              <Calendar className="h-5 w-5 text-purple-600" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-zinc-600">Idade</div>
              <div className="mt-0.5 text-base font-semibold text-zinc-900">
                {ageText}
                <time
                  dateTime={birthDate.toISOString()}
                  className="ml-2 text-sm font-normal text-zinc-500"
                  title={`Nascimento: ${birthDate.toLocaleDateString("pt-BR")}`}
                >
                  ({birthDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })})
                </time>
              </div>
            </div>
          </div>
        )}

        {puppy.size && (
          <div className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50">
              <Ruler className="h-5 w-5 text-amber-600" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-zinc-600">Tamanho</div>
              <div className="mt-0.5 text-base font-semibold text-zinc-900 capitalize">{translateSize(puppy.size)}</div>
            </div>
          </div>
        )}

        {puppy.hasPedigree !== undefined && (
          <div className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
              <span className="text-xl" aria-hidden="true">
                📜
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-zinc-600">Pedigree CBKC</div>
              <div className="mt-0.5 text-base font-semibold text-zinc-900">
                {puppy.hasPedigree ? "Sim" : "Não"}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function translateSex(sex: string): string {
  const lower = sex.toLowerCase();
  if (lower === "male" || lower === "macho") return "Macho";
  if (lower === "female" || lower === "femea" || lower === "fêmea") return "Fêmea";
  return sex;
}

function translateSize(size: string): string {
  const lower = size.toLowerCase();
  if (lower === "mini" || lower === "miniatura") return "Miniatura (até 22 cm)";
  if (lower === "small" || lower === "pequeno") return "Pequeno (22-28 cm)";
  if (lower === "medium" || lower === "médio") return "Médio (28-35 cm)";
  return size;
}

function formatAge(days: number): string {
  if (days < 30) return `${days} dia${days !== 1 ? "s" : ""}`;
  if (days < 365) {
    const months = Math.floor(days / 30);
    return `${months} ${months === 1 ? "mês" : "meses"}`;
  }
  const years = Math.floor(days / 365);
  const remainingMonths = Math.floor((days % 365) / 30);
  if (remainingMonths === 0) return `${years} ano${years !== 1 ? "s" : ""}`;
  return `${years} ano${years !== 1 ? "s" : ""} e ${remainingMonths} ${remainingMonths === 1 ? "mês" : "meses"}`;
}
