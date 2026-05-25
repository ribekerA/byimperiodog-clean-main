import type { Puppy } from "./types";

// Aceita snake_case do banco e normaliza para o app
export function mapRowToPuppy(row: any): Puppy {
  const media = Array.isArray(row?.midia) ? row.midia : [];
  const first = media?.[0] ?? row?.image_url ?? "/placeholder.webp";

  return {
    id: row.id,
    name: row.nome ?? row.name ?? "Filhote",
    color: row.cor ?? row.color ?? null,
    gender: row.gender ?? null,
    priceCents: row.price_cents ?? row.preco_cents ?? row.preco ?? null,
    status: row.status,
    imageUrl: first,
    createdAt: row.created_at ?? null,

    // extras para o modal
    descricao: row.descricao ?? null,
    nascimento: row.nascimento ?? null,
    delivery: row.delivery ?? null,
    midia: Array.isArray(row.midia) ? row.midia : null,
  };
}

// Extrai URLs de imagem de um campo "midia" heterogêneo
export function extractImageUrls(midia: unknown): string[] {
  if (Array.isArray(midia)) {
    return (midia as unknown[]).filter((u): u is string => typeof u === "string" && !!u);
  }
  if (typeof midia === "string") {
    try {
      const parsed = JSON.parse(midia);
      if (Array.isArray(parsed)) {
        return parsed.filter((u): u is string => typeof u === "string" && !!u);
      }
    } catch {
      // retorna string única se parecer URL
      if (/^https?:\/\//.test(midia)) return [midia];
    }
  }
  return [];
}
