// PATH: src/lib/format/date.ts
// Helpers de datas pt-BR (America/Sao_Paulo)
const TZ = 'America/Sao_Paulo';

function ensureDate(input: Date | string | number | null | undefined): Date | null {
  if (!input) return null;
  const d = input instanceof Date ? input : new Date(input);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDateShort(input: Date | string | number): string {
  const d = ensureDate(input);
  if (!d) return '';
  return d.toLocaleDateString('pt-BR', { timeZone: TZ });
}

export function formatDateTime(input: Date | string | number): string {
  const d = ensureDate(input);
  if (!d) return '';
  return d.toLocaleString('pt-BR', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeLabel(from: Date | string | number): string {
  const d = ensureDate(from);
  if (!d) return '';
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return 'hoje';
  if (diffDays === 1) return 'ontem';
  if (diffDays < 7) return `${diffDays} dias atrás`;
  return formatDateShort(d);
}
