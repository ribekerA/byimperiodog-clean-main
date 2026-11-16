// Travas de gasto do painel de Google Ads.
//
// Duas acoes poem dinheiro em jogo com um clique so: ativar uma campanha e
// trocar o orcamento diario. As duas passam por aqui ANTES de qualquer chamada
// ao Google, e a regra mora no servidor de proposito -- pergunta feita so na
// tela some no dia em que alguem chama a rota direto.
//
// O formato segue o das recomendacoes: sem confirmacao explicita a rota
// responde 409 com o aviso, e a tela repete o pedido com a confirmacao.

/**
 * Teto do orcamento diario aceito pelo painel, em reais.
 *
 * Existe para segurar erro de digitacao (um zero a mais), nao para limitar a
 * estrategia: a conta gastou cerca de R$ 6.940 em 2026 inteiro (uns R$ 19 por
 * dia), entao R$ 50 por dia ja e mais que o dobro do ritmo normal. Quem precisar de
 * mais sobe o valor no proprio Google Ads ou muda esta constante com
 * conhecimento de causa.
 */
export const TETO_ORCAMENTO_DIARIO = 50;

/**
 * Teto do lance maximo por clique aceito pelo painel, em reais. Mesma ideia:
 * segura a virgula fora do lugar (R$ 150 no lugar de R$ 1,50).
 */
export const TETO_LANCE_CPC = 5;

export type Trava = {
  status: 400 | 409;
  corpo: { ok: false; error: string; mensagem?: string; aviso?: string };
};

function reais(valor: number): string {
  return `R$ ${valor.toFixed(2).replace(".", ",")}`;
}

/** Ativar comeca a gastar: exige `confirmarAtivacao: true`. Pausar e remover, nao. */
export function travaDeAtivacao(opts: { status: string; confirmado?: boolean }): Trava | null {
  if (opts.status !== "ENABLED" || opts.confirmado === true) return null;
  return {
    status: 409,
    corpo: {
      ok: false,
      error: "confirmacao_necessaria",
      aviso:
        "Ativar poe a campanha no ar e ela comeca a gastar o orcamento diario. Confirme para ativar.",
    },
  };
}

/**
 * Trocar orcamento: recusa acima do teto e exige `confirmarOrcamento: true`.
 *
 * O aviso de orcamento compartilhado vem aqui, antes de aplicar -- depois de
 * aplicado ele so serve para contar o que ja aconteceu.
 */
export function travaDeOrcamento(opts: {
  valorDiario: number;
  confirmado?: boolean;
  campanhasAfetadas: string[];
}): Trava | null {
  if (opts.valorDiario > TETO_ORCAMENTO_DIARIO) {
    return {
      status: 400,
      corpo: {
        ok: false,
        error: "orcamento_acima_do_teto",
        mensagem: `O painel aceita no maximo ${reais(TETO_ORCAMENTO_DIARIO)} por dia. Confira se nao sobrou um zero; valor maior so pelo proprio Google Ads.`,
      },
    };
  }
  if (opts.confirmado === true) return null;

  const n = opts.campanhasAfetadas.length;
  const compartilhado =
    n > 1
      ? ` Atencao: este orcamento e compartilhado e muda para ${n} campanhas de uma vez (${opts.campanhasAfetadas.join(", ")}).`
      : "";
  return {
    status: 409,
    corpo: {
      ok: false,
      error: "confirmacao_necessaria",
      aviso: `O orcamento passa a ser ${reais(opts.valorDiario)} por dia. Em um dia isolado o Google pode gastar ate o dobro.${compartilhado} Confirme para aplicar.`,
    },
  };
}
