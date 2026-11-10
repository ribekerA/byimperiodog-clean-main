import { permanentRedirect } from "next/navigation";

/**
 * Rota histórica preservada para backlinks; preços ficam na vitrine.
 * Permanente (308) desde 10/11/2026: o `redirect` devolvia 307, que diz ao
 * buscador que a mudança é passageira e segura o endereço antigo no índice.
 */
export default function PrecoSpitzAnaoRedirect() {
  permanentRedirect("/filhotes");
}
