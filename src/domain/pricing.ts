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
 * A tabela descreve apenas as combinações publicadas hoje. Combinação retirada
 * da vitrine não recebe preço genérico: isso impediria o site de continuar
 * oferecendo, por texto, um filhote que a responsável mandou remover.
 */

/**
 * Cores divulgadas na comunicação pública.
 *
 * O Cinza-Lobo (Wolf Sable) saiu desta lista por decisão comercial: a cor
 * deixou de ser divulgada. As URLs dedicadas que já existiam continuam no ar e
 * intocadas — apagá-las ou redirecioná-las é decisão de quem responde pelo SEO,
 * não efeito colateral de uma mudança de tabela.
 *
 * Particolor saiu da comunicação comercial por decisão da responsável.
 */
export const CORES_DIVULGADAS = ["creme", "preto", "laranja", "branco"] as const;

export type CorDivulgada = (typeof CORES_DIVULGADAS)[number];
export type Sexo = "macho" | "femea";

export type LinhaDaTabela = {
  /** Nome como o visitante lê. */
  label: string;
  /** Valor em centavos — a unidade que o resto do projeto já usa. */
  macho: number | null;
  femea: number | null;
};

/**
 * A matriz. Valores em centavos, na ordem em que a tabela é apresentada ao
 * visitante (do mais acessível ao mais caro).
 */
export const TABELA_DE_PRECOS: Record<CorDivulgada, LinhaDaTabela> = {
  creme: { label: "Creme", macho: 750000, femea: 850000 },
  preto: { label: "Preto", macho: 750000, femea: 850000 },
  laranja: { label: "Laranja", macho: null, femea: 850000 },
  branco: { label: "Branco", macho: null, femea: 850000 },
};

/**
 * Formata centavos como o site escreve: "R$ 7.500", sem centavos.
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
  const valor = TABELA_DE_PRECOS[cor][sexo];
  if (valor === null) {
    throw new Error(`Combinação sem oferta publicada: ${cor}/${sexo}`);
  }
  return valor;
}

/**
 * Valores definidos para páginas específicas da vitrine.
 *
 * A tabela por cor/sexo continua sendo o padrão. Quando a responsável define
 * um valor próprio para um filhote, o slug passa a ser a chave comercial para
 * que card, página e validações usem exatamente o mesmo número.
 */
export const PRECO_POR_SLUG = {
  "spitz-alemao-anao-branco-femea": 850000,
  "spitz-alemao-anao-laranja-femea": 850000,
  "spitz-alemao-anao-laranja-femea-laco-rosa": 850000,
  "spitz-alemao-anao-preto-femea": 850000,
} as const satisfies Record<string, number>;

/** Preço anunciado para o filhote, com fallback para a tabela por cor/sexo. */
export function precoDoFilhote(cor: CorDivulgada, sexo: Sexo, slug: string): number {
  return PRECO_POR_SLUG[slug as keyof typeof PRECO_POR_SLUG] ?? precoDe(cor, sexo);
}

/**
 * Menor valor entre as combinações publicadas da cor.
 */
export function menorPrecoPublicadoDaCor(cor: CorDivulgada): number {
  const linha = TABELA_DE_PRECOS[cor];
  const valores = [linha.macho, linha.femea].filter((valor): valor is number => valor !== null);
  return Math.min(...valores);
}

const TODOS_OS_VALORES = Object.values(TABELA_DE_PRECOS)
  .flatMap((linha) => [linha.macho, linha.femea])
  .filter((valor): valor is number => valor !== null);

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

/** Faixa dos valores publicados, já formatada para a comunicação pública. */
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
/** Cores de cada sexo, agrupadas por valor e em ordem crescente. */
function enumerarPorSexo(sexo: Sexo): string {
  const porValor = new Map<number, string[]>();

  for (const cor of CORES_DIVULGADAS) {
    const valor = TABELA_DE_PRECOS[cor][sexo];
    if (valor === null) continue;
    porValor.set(valor, [...(porValor.get(valor) ?? []), TABELA_DE_PRECOS[cor].label.toLowerCase()]);
  }

  return [...porValor.entries()]
    .sort(([a], [b]) => a - b)
    .map(([valor, cores]) => `${cores.join(" e ")} ${formatarPreco(valor)}`)
    .join("; ");
}

export const RESPOSTA_QUANTO_CUSTA =
  `Os valores publicados dos filhotes de Spitz Alemão Anão vão de ${formatarPreco(FAIXA_PUBLICA.minCents)} ` +
  `a ${formatarPreco(FAIXA_PUBLICA.maxCents)}. Machos: ${enumerarPorSexo("macho")}. ` +
  `Fêmeas: ${enumerarPorSexo("femea")}. ` +
  "A disponibilidade é informada no atendimento.";

/**
 * Diferença entre fêmea e macho na mesma cor, em centavos — ou `null` quando a
 * matriz deixar de ter uma diferença única.
 *
 * Nasce da tabela em vez de "R$ 1.000" digitado numa FAQ. Hoje as combinações
 * comparáveis têm o mesmo degrau; no dia em que uma linha andar sozinha, esta constante
 * vira `null` e a frase troca de forma automaticamente, em vez de continuar
 * afirmando um número que parou de valer.
 */
export const DIFERENCA_FEMEA_MACHO: number | null = (() => {
  const degraus = new Set<number>();
  for (const cor of CORES_DIVULGADAS) {
    const linha = TABELA_DE_PRECOS[cor];
    if (linha.macho !== null && linha.femea !== null) {
      degraus.add(linha.femea - linha.macho);
    }
  }
  return degraus.size === 1 ? [...degraus][0] : null;
})();

/**
 * Resposta oficial de "por que a fêmea custa mais que o macho".
 *
 * A versão anterior vivia escrita à mão em `/filhotes` e dizia que a diferença
 * existia "por conta da maior procura". Duas coisas erradas na mesma frase:
 *
 * 1. Os dez valores estavam copiados na prosa. Bastava a tabela mudar para a
 *    FAQ passar a contradizer a própria página em que ela aparece.
 * 2. "Maior procura" é afirmação sobre o mercado que ninguém aqui mediu. O
 *    preço não precisa de justificativa inventada: ele é o que é, publicado
 *    aberto, e o visitante compara com quem quiser.
 *
 * O que sobra é o que se pode conferir na tabela — o degrau e os dois pontos
 * de partida por sexo.
 */
export const RESPOSTA_MACHO_VS_FEMEA =
  (DIFERENCA_FEMEA_MACHO !== null
    ? `Nas cores com os dois sexos publicados, a fêmea custa ${formatarPreco(DIFERENCA_FEMEA_MACHO)} a mais que o macho. `
    : "Os valores variam conforme a combinação publicada. ") +
  `Machos: ${enumerarPorSexo("macho")}. ` +
  `Fêmeas: ${enumerarPorSexo("femea")}.`;

/**
 * Resposta oficial sobre o preto.
 *
 * A pergunta é repetida na home, na página da cor e na /spitz-alemao-preto, e
 * as três cópias falavam de matrizes, de padreadores e de raridade — assunto
 * comercial que a página não precisa levantar para responder "quanto custa".
 * Aqui sobra o que é verificável: o valor.
 *
 * Em 26/08/2026 saiu também a frase de abertura — "pode apresentar menor
 * disponibilidade em determinados períodos" — e o "sujeitos à disponibilidade"
 * do fim. Escassez não é resposta de preço, e o site não publica estoque. Esta
 * string aparece em três lugares (home, página da cor, /spitz-alemao-preto),
 * então a frase se multiplicava por três.
 */
export const RESPOSTA_PRETO =
  `O Spitz Alemão Anão preto custa ${formatarPreco(precoDe("preto", "macho"))} para machos e ` +
  `${formatarPreco(precoDe("preto", "femea"))} para fêmeas. ` +
  "As opções atuais são confirmadas no atendimento.";

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
    const valor = TABELA_DE_PRECOS[cor][sexo];
    if (valor === null) continue;
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
  macho: TABELA_DE_PRECOS[cor].macho === null ? null : formatarPreco(TABELA_DE_PRECOS[cor].macho),
  femea: TABELA_DE_PRECOS[cor].femea === null ? null : formatarPreco(TABELA_DE_PRECOS[cor].femea),
  valor: formatarPreco(menorPrecoPublicadoDaCor(cor)),
}));
