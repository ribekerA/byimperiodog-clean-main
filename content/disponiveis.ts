/**
 * Filhotes disponíveis agora — a lista que alimenta /disponiveis.
 *
 * Pedido de 17/11/2026: uma página só com o que pode ser reservado hoje, com
 * foto ou vídeo, sexo, cor, nascimento e valor. Estar na lista é o status. É diferente da vitrine
 * (/filhotes), que mostra referências permanentes de cor e sexo.
 *
 * Como atualizar: copie um bloco de exemplo abaixo, preencha e apague quem foi
 * entregue. Nada aqui é inventado pelo site: se a lista estiver vazia, a página
 * diz isso, fica fora do Google (noindex) e não entra no sitemap.
 *
 * - `foto`: caminho em /public (ex.: "/filhotes/branco/branco-femea-jardim-01.jpg").
 * - `video`: opcional, caminho de um .mp4 em /public.
 * - `nascimento`: AAAA-MM-DD.
 * - `valorCents`: em centavos, no Pix (450000 = R$ 4.500).
 * - Reservou ou entregou: apague o bloco. A página não mostra status.
 *
 * Exemplo (não publicado):
 *
 *   {
 *     id: "branco-macho-2026-11",
 *     nome: "Spitz Alemão Anão branco, macho",
 *     sexo: "macho",
 *     cor: "Branco",
 *     nascimento: "2026-10-01",
 *     valorCents: 450000,
 * *     foto: "/filhotes/branco/....jpg",
 *   },
 */
export type FilhoteDisponivel = {
  id: string;
  nome: string;
  sexo: "macho" | "femea";
  cor: string;
  /** AAAA-MM-DD */
  nascimento: string;
  valorCents: number;
  foto: string;
  video?: string;
};

export const DISPONIVEIS: readonly FilhoteDisponivel[] = [];
