/**
 * @module domain/pricing
 * @description Tabela comercial da By Império Dog — FONTE ÚNICA de preço.
 *
 * Por que este arquivo existe
 * ---------------------------
 * Até aqui cada card, cada FAQ e cada artigo carregava o seu próprio número
 * escrito na mão. O resultado é o que sempre acontece quando o mesmo dado mora
 * em vinte lugares: eles divergiram. A fêmea laranja aparecia por R$ 8.500 na
 * página de preço, no card de cor, na FAQ da home e em três artigos — e bastava
 * a tabela mudar para o site passar a se contradizer sozinho, com o Google
 * lendo a versão errada no JSON-LD.
 *
 * Daqui para frente o número nasce aqui. Quem mostra preço importa; quem
 * escreve preço em prosa (.mdx) é conferido contra esta tabela pelo
 * scripts/content-guard.mjs, que roda no prebuild e derruba o build se algum
 * texto divergir.
 *
 * Regra de negócio: a fêmea custa mais que o macho em todas as cores. O menor
 * valor de uma cor é sempre o do macho — é isso que sustenta o "a partir de".
 */

/**
 * Cores divulgadas na comunicação pública.
 *
 * O Cinza-Lobo (Wolf Sable) saiu desta lista por decisão comercial: a cor
 * deixou de ser divulgada. As URLs dedicadas que já existiam continuam no ar e
 * intocadas — apagá-las ou redirecioná-las é decisão de quem responde pelo SEO,
 * não efeito colateral de uma mudança de tabela.
 */
export const CORES_DIVULGADAS = ["laranja", "creme", "preto", "branco"] as const;

export type CorDivulgada = (typeof CORES_DIVULGADAS)[number];
export type Sexo = "macho" | "femea";

export type LinhaDaTabela = {
  /** Nome como o visitante lê. */
  label: string;
  /** Valor em centavos — a unidade que o resto do projeto já usa. */
  macho: number;
  femea: number;
};

/**
 * A matriz. Valores em centavos, na ordem em que a tabela é apresentada ao
 * visitante (do mais acessível ao mais caro).
 */
export const TABELA_DE_PRECOS: Record<CorDivulgada, LinhaDaTabela> = {
  laranja: { label: "Laranja", macho: 650000, femea: 750000 },
  creme: { label: "Creme", macho: 750000, femea: 850000 },
  preto: { label: "Preto", macho: 750000, femea: 850000 },
  branco: { label: "Branco", macho: 850000, femea: 950000 },
};

/**
 * Formata centavos como o site escreve: "R$ 6.500", sem centavos.
 *
 * O separador entre "R$" e o número é escrito aqui de propósito, em vez de
 * sair do `style: "currency"` do Intl: aquele formato usa espaço estreito sem
 * quebra (U+00A0/U+202F), invisível no editor, e o texto renderizado deixaria
 * de casar com "R$ 8.500" na conferência do content-guard.
 */
export function formatarPreco(cents: number): string {
  return `R$ ${Math.round(cents / 100).toLocaleString("pt-BR")}`;
}

/** Preço de uma combinação cor/sexo, em centavos. */
export function precoDe(cor: CorDivulgada, sexo: Sexo): number {
  return TABELA_DE_PRECOS[cor][sexo];
}

/**
 * Menor valor real da cor — o que pode ser anunciado como "a partir de".
 *
 * Card genérico de cor, sem sexo definido, usa este número. Card de um filhote
 * específico, que já sabe o sexo, usa {@link precoDe} e não diz "a partir de".
 */
export function aPartirDe(cor: CorDivulgada): number {
  const linha = TABELA_DE_PRECOS[cor];
  return Math.min(linha.macho, linha.femea);
}

const TODOS_OS_VALORES = Object.values(TABELA_DE_PRECOS).flatMap((linha) => [
  linha.macho,
  linha.femea,
]);

/**
 * Faixa pública. Derivada da matriz, nunca escrita na mão: se um valor da
 * tabela mudar, a faixa acompanha no mesmo commit.
 */
export const FAIXA_PUBLICA = {
  minCents: Math.min(...TODOS_OS_VALORES),
  maxCents: Math.max(...TODOS_OS_VALORES),
  mediaCents: Math.round(
    TODOS_OS_VALORES.reduce((soma, valor) => soma + valor, 0) / TODOS_OS_VALORES.length
  ),
} as const;

/** "R$ 6.500 a R$ 9.500" — a forma como a faixa é escrita em prosa. */
export const FAIXA_PUBLICA_TEXTO = `${formatarPreco(FAIXA_PUBLICA.minCents)} a ${formatarPreco(
  FAIXA_PUBLICA.maxCents
)}`;

/**
 * Resposta oficial de "quanto custa".
 *
 * Existe como constante porque essa pergunta é feita em seis lugares — home,
 * /filhotes, /preco-spitz-anao, /pomeranian, /lulu-da-pomerania e o agente do
 * WhatsApp — e cada cópia era uma chance de divergir. Preço é preço: a resposta
 * não fala de documentação, de saúde nem de pós-venda, que têm perguntas
 * próprias.
 */
export const RESPOSTA_QUANTO_CUSTA =
  "Os valores dos filhotes de Spitz Alemão Anão (Lulu da Pomerânia) variam de " +
  `${FAIXA_PUBLICA_TEXTO}, conforme sexo e cor. Machos: laranja ${formatarPreco(
    TABELA_DE_PRECOS.laranja.macho
  )}; creme e preto ${formatarPreco(TABELA_DE_PRECOS.creme.macho)}; branco ${formatarPreco(
    TABELA_DE_PRECOS.branco.macho
  )}. Fêmeas: laranja ${formatarPreco(TABELA_DE_PRECOS.laranja.femea)}; creme e preto ${formatarPreco(
    TABELA_DE_PRECOS.creme.femea
  )}; branco ${formatarPreco(TABELA_DE_PRECOS.branco.femea)}. ` +
  "A disponibilidade é informada no atendimento.";

/**
 * Resposta oficial sobre o preto.
 *
 * A pergunta é repetida na home, na página da cor e na /spitz-alemao-preto, e
 * as três cópias falavam de matrizes, de padreadores e de raridade — assunto
 * comercial que a página não precisa levantar para responder "quanto custa".
 * Aqui sobra o que é verificável: disponibilidade e valor.
 */
export const RESPOSTA_PRETO =
  "O Spitz Alemão Anão (Lulu da Pomerânia) preto pode apresentar menor disponibilidade em " +
  `determinados períodos. Os valores atuais são ${formatarPreco(TABELA_DE_PRECOS.preto.macho)} para machos e ` +
  `${formatarPreco(TABELA_DE_PRECOS.preto.femea)} para fêmeas, sujeitos à disponibilidade.`;

/**
 * A tabela agrupada por valor — "Macho — Creme / Preto · R$ 7.500".
 *
 * /pomeranian e /lulu-da-pomerania mostram a mesma grade de cards, e cada uma
 * carregava a sua cópia escrita na mão. Eram duas listas para conferir sempre
 * que a tabela mudasse, e as duas ficaram anunciando "Fêmea — Creme / Preto /
 * Laranja / Cinza-Lobo · R$ 8.500" depois que a fêmea laranja passou para
 * R$ 7.500. Agora o agrupamento é calculado.
 */
export const CARDS_POR_FAIXA = (["macho", "femea"] as const).flatMap((sexo) => {
  const rotuloSexo = sexo === "macho" ? "Macho" : "Fêmea";
  const cardsPorValor = new Map<number, string[]>();

  for (const cor of CORES_DIVULGADAS) {
    const valor = precoDe(cor, sexo);
    cardsPorValor.set(valor, [...(cardsPorValor.get(valor) ?? []), TABELA_DE_PRECOS[cor].label]);
  }

  return [...cardsPorValor.entries()]
    .sort(([a], [b]) => a - b)
    .map(([valor, cores]) => ({
      rotulo: `${rotuloSexo} — ${cores.join(" / ")}`,
      valor: formatarPreco(valor),
    }));
});

/** Linhas da tabela na ordem de exibição, já formatadas. */
export const LINHAS_FORMATADAS = CORES_DIVULGADAS.map((cor) => ({
  cor,
  label: TABELA_DE_PRECOS[cor].label,
  macho: formatarPreco(TABELA_DE_PRECOS[cor].macho),
  femea: formatarPreco(TABELA_DE_PRECOS[cor].femea),
  aPartirDe: formatarPreco(aPartirDe(cor)),
}));
