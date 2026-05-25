// Utilidades de normalização relacionadas a posts do blog extraídas de route handlers
// Mantém funções puras e testáveis.

export function normalizeTags(input: unknown): string[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return Array.from(new Set(input.map((item) => String(item).trim().toLowerCase()).filter(Boolean)));
  }
  if (typeof input === 'string') {
    return input
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
  }
  return [];
}

export function sanitizeCategory(value: unknown): string | null {
  if (!value) return null;
  const str = String(value).trim();
  return str ? str : null;
}
