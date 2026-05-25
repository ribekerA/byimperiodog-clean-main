// PATH: src/lib/format/currency.ts
// Centraliza formatação e parsing BRL (pt-BR) com robustez.
const CURRENCY_FORMATTER = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function formatBRL(value: number | string): string {
  if (value === null || value === undefined || value === '') return 'R$ 0,00';
  const num = typeof value === 'string' ? Number(value) : value;
  if (!isFinite(num)) return 'R$ 0,00';
  return CURRENCY_FORMATTER.format(num);
}

// Converte string exibida (ex: "R$ 1.234,56") em centavos.
export function parseBRLToCents(display: string): number {
  if (!display) return 0;
  // Remove tudo exceto dígitos
  const onlyDigits = display.replace(/[^0-9]/g, '');
  if (!onlyDigits) return 0;
  // Últimos 2 dígitos = centavos
  const intVal = parseInt(onlyDigits, 10);
  return isNaN(intVal) ? 0 : intVal;
}

export function centsToNumber(cents: number | null | undefined): number {
  if (!cents || cents <= 0) return 0;
  return cents / 100;
}

export function centsToBRL(cents: number | null | undefined): string {
  return formatBRL(centsToNumber(cents));
}
