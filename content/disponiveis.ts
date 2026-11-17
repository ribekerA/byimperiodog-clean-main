/**
 * Estoque REAL confirmado — separado da vitrine permanente do site.
 * NÃO cadastrar referências históricas aqui.
 * Cada registro exige confirmação de foto, data de nascimento, status e preço.
 */
export type FilhoteDisponivel = {
  id: string;
  nome: string;
  sexo: "macho" | "femea";
  cor: string;
  nascimento: string; // YYYY-MM-DD confirmado
  valorPixCents: number;
  status: "disponivel" | "reservado" | "vendido";
  fotos: string[]; // caminhos reais e autorizados de arquivos em public/
  video?: string;
};

/** Não há itens confirmados no momento da criação deste arquivo. */
export const DISPONIVEIS: readonly FilhoteDisponivel[] = [];
