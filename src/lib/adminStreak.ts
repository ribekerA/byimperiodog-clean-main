export const ADMIN_STREAK_STORAGE_KEY = "admin-login-streak";

export type AdminStreak = {
  count: number;
  lastLogin: string | null;
};

function parseStoredStreak(raw: string | null): AdminStreak {
  if (!raw) return { count: 0, lastLogin: null };
  try {
    const data = JSON.parse(raw) as Partial<AdminStreak> | null;
    return {
      count: typeof data?.count === "number" && data.count > 0 ? data.count : 0,
      lastLogin: typeof data?.lastLogin === "string" ? data.lastLogin : null,
    };
  } catch {
    return { count: 0, lastLogin: null };
  }
}

export function readAdminStreak(): AdminStreak {
  if (typeof window === "undefined") return { count: 0, lastLogin: null };
  const raw = window.localStorage.getItem(ADMIN_STREAK_STORAGE_KEY);
  return parseStoredStreak(raw);
}

export function bumpAdminStreak(): AdminStreak {
  if (typeof window === "undefined") return { count: 0, lastLogin: null };
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const current = readAdminStreak();
  let nextCount = 1;
  if (current.lastLogin) {
    const last = new Date(current.lastLogin);
    if (!Number.isNaN(last.getTime())) {
      const diff = Math.floor((today.getTime() - last.getTime()) / 86400000);
      if (diff === 0) nextCount = Math.max(current.count, 1);
      else if (diff === 1) nextCount = Math.max(current.count, 0) + 1;
    }
  }
  const payload: AdminStreak = { count: nextCount, lastLogin: todayKey };
  try {
    window.localStorage.setItem(ADMIN_STREAK_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage failures
  }
  return payload;
}

export function describeAdminStreak(streak: AdminStreak): string {
  if (!streak.lastLogin) return "Primeira entrada registrada.";
  const last = new Date(streak.lastLogin);
  if (Number.isNaN(last.getTime())) return "Acesse com frequencia para criar uma sequencia.";
  const diffMs = Date.now() - last.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays <= 0) return "Voce ja entrou hoje. Sequencia protegida.";
  if (diffDays === 1) return "Ultimo login ontem. Continue para manter a sequencia.";
  return `Ultimo login ha ${diffDays} dia(s). Prepare-se para retomar o ritmo.`;
}

