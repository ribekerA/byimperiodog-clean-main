/**
 * Favoritos de filhotes — persistidos em localStorage.
 * Hook de hábito (Hooked model): usuário "investe" curtindo filhotes
 * → tem motivo para voltar para verificar disponibilidade.
 */

const KEY = "bid_favorites";

export function getFavorites(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function isFavorited(puppyId: string): boolean {
  return getFavorites().includes(puppyId);
}

export function toggleFavorite(puppyId: string): boolean {
  const favs = getFavorites();
  const idx = favs.indexOf(puppyId);
  let next: string[];
  if (idx === -1) {
    next = [...favs, puppyId];
  } else {
    next = favs.filter((id) => id !== puppyId);
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  return next.includes(puppyId);
}

export function getFavoritesCount(): number {
  return getFavorites().length;
}
