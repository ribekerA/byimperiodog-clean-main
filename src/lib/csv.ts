// src/lib/csv.ts
export function toCsv(rows: any[], headers?: string[]) {
  const esc = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const cols = headers ?? (rows[0] ? Object.keys(rows[0]) : []);
  const head = cols.join(",");
  const lines = rows.map((r) => cols.map((h) => esc(r[h])).join(","));
  return [head, ...lines].join("\n");
}

/** Converte data pra ISO curta (ou vazio) */
export function iso(v: string | Date | null | undefined) {
  try {
    if (!v) return "";
    const d = typeof v === "string" ? new Date(v) : v;
    return d.toISOString();
  } catch {
    return String(v ?? "");
  }
}
