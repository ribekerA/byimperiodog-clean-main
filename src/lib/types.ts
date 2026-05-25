export type PuppyStatus = "disponivel" | "reservado" | "vendido";
export type PuppyGender = "male" | "female" | null;

export interface Puppy {
  id: string;
  name: string;
  color: string | null;
  gender: PuppyGender;
  priceCents: number | null;
  status: PuppyStatus;
  imageUrl: string;        // primeira mídia ou fallback
  createdAt?: string | null;

  // ---- campos adicionais para o modal / detalhe ----
  descricao?: string | null;
  nascimento?: string | null; // ISO
  delivery?: string | null;   // ex.: "Entrega em todo Brasil"
  midia?: string[] | null;    // todas as imagens/vídeos
}
