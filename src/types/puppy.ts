type MediaValue =
  | string
  | {
      url?: string | null;
      type?: string | null;
    };

export interface RawPuppy {
  id?: string;
  codigo?: string | null;
  nome?: string | null;
  name?: string | null;
  slug?: string | null;
  gender?: "male" | "female";
  sex?: "male" | "female";
  sexo?: "macho" | "femea" | null;
  status?:
    | "disponivel"
    | "reservado"
    | "vendido"
    | "indisponivel"
    | "available"
    | "reserved"
    | "sold"
    | "pending";
  color?: string | null;
  cor?: string | null; // legacy alias
  city?: string | null;
  cidade?: string | null;
  state?: string | null;
  estado?: string | null;
  price_cents?: number | null;
  priceCents?: number | null;
  preco?: number | string | null;
  nascimento?: string | null;
  image_url?: string | null;
  descricao?: string | null;
  description?: string | null; // legacy alias
  notes?: string | null;
  video_url?: string | null;
  midia?: MediaValue[];
  // media?: MediaValue[]; // legacy alias
}

export interface PuppyDTO {
  id?: string;
  codigo?: string;
  nome: string;
  gender: 'male' | 'female';
  status: 'disponivel' | 'reservado' | 'vendido';
  color: string;
  price_cents: number;
  nascimento?: string | null;
  image_url?: string | null;
  descricao?: string | null;
  notes?: string | null;
  video_url?: string | null;
  midia: string[];
}

function normalizeMediaList(source: MediaValue[] | undefined): string[] {
  if (!source) return [];
  return source
    .map((item) => {
      if (!item) return null;
      if (typeof item === "string") return item;
      return item.url ?? null;
    })
    .filter((url): url is string => typeof url === "string" && !!url);
}

export function normalizePuppy(raw: RawPuppy): PuppyDTO {
  const nome = (raw.nome ?? raw.name ?? "").trim();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const midia = normalizeMediaList((raw.midia as MediaValue[]) || ((raw as any).media as MediaValue[]));
  const cover = raw.image_url || midia[0] || null;
  const ordered = cover ? [cover, ...midia.filter((u) => u !== cover)] : midia;
  return {
    id: raw.id,
    codigo: raw.codigo || undefined,
    nome,
    gender: (raw.gender || raw.sex) === "male" ? "male" : "female",
    status:
      raw.status && ["disponivel", "reservado", "vendido"].includes(raw.status)
        ? (raw.status as any)
        : "disponivel",
    color: (raw.color || raw.cor || "").trim(),
    price_cents:
      raw.price_cents ?? raw.priceCents ?? (raw.preco ? Math.round(Number(raw.preco) * 100) : 0),
    nascimento: raw.nascimento || null,
    image_url: cover || null,
    descricao: raw.descricao || raw.description || null,
    notes: raw.notes || null,
    video_url: raw.video_url || null,
    midia: ordered,
  };
}
