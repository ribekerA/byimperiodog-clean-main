import { cn } from "@/lib/cn";

type DateLike = string | Date | null | undefined;

export interface LastUpdatedProps {
  /**
   * Data real da última revisão do documento. É a única fonte usada para o
   * carimbo exibido — o horário de build NÃO entra aqui, para não sugerir que
   * o texto foi revisado a cada deploy.
   */
  contentTime?: DateLike;
  label?: string;
  className?: string;
}

const DATE_FORMAT = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "long",
  timeZone: "America/Sao_Paulo",
});

export function LastUpdated({
  contentTime,
  label = "Última atualização deste documento",
  className,
}: LastUpdatedProps) {
  const contentDate = normalizeDate(contentTime);
  if (!contentDate) return null;

  const absolute = formatAbsolute(contentDate);
  if (!absolute) return null;

  return (
    <article
      className={cn(
        "rounded-3xl border border-emerald-100 bg-emerald-50/60 p-5 text-sm text-emerald-900 shadow-sm",
        className
      )}
    >
      <h3 className="text-base font-semibold text-emerald-900">{label}</h3>
      <p className="mt-1 text-emerald-700">
        <time dateTime={contentDate.toISOString()}>{absolute}</time>
      </p>
    </article>
  );
}

export default LastUpdated;

function normalizeDate(value: DateLike): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatAbsolute(date: Date) {
  try {
    return DATE_FORMAT.format(date);
  } catch {
    return null;
  }
}
