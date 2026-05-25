// PATH: src/lib/blog/reading-time.ts
// Cálculo simples de tempo de leitura (pt-BR)
// Estratégia: ~200 palavras por minuto ajustado para português (pode variar 180-220).

export function estimateReadingTime(text: string | null | undefined, wpm = 200): number {
  if (!text) return 0;
  const words = text
    .replace(/<[^>]+>/g, ' ') // remover tags HTML
    .replace(/[`*_#>\-]+/g, ' ') // remover sinais markdown
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return 0;
  return Math.max(1, Math.round(words.length / wpm));
}
