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
 * Regra vigente, definida pela responsável em 05/11/2026: todo macho parte de
 * R$ 4.500 e toda fêmea parte de R$ 6.500, no PIX, em qualquer cor. A matriz e
 * PRECO_POR_SLUG repetem esses dois valores para que card, ficha, JSON-LD,
 * parcelamento e llms.txt publiquem o mesmo número.
 */

/**
 * Cores divulgadas na comunicação pública.
 *
 * O Cinza-Lobo (Wolf Sable) saiu desta lista por decisão comercial: a cor
 * deixou de ser divulgada. As URLs dedicadas que já existiam continuam no ar e
 * intocadas — apagá-las ou redirecioná-las é decisão de quem responde pelo SEO,
 * não efeito colateral de uma mudança de tabela.
 *
 * O Particolor entrou na tabela e por isso entrou aqui: é a partir desta lista
 * que o teste de regressão exige preço oficial para todo filhote publicado.
 * Uma cor com filhote na vitrine e sem linha na tabela não tem valor a cobrar.
 *
 * Chocolate e Merle entraram por decisão da responsável em 06/11/2026. Ainda não
 * têm filhote publicado: PRECO_POR_SLUG continua sendo a lista real de ofertas.
 */
export const CORES_DIVULGADAS = ["particolor", "laranja", "creme", "preto", "branco", "chocolate", "merle"] as const;

export type CorDivulgada = (typeof CORES_DIVULGADAS)[number];
export type Sexo = "macho" | "femea";

export type LinhaDaTabela = {
  /** Nome como o visitante lê. */
  label: string;
  /** Valor em centavos — a unidade que o resto do projeto já usa. */
  macho: number;
  femea: number;
};

/** Os dois valores públicos, em centavos. Decisão da responsável de 05/11/2026. */
export const PISO_MACHO = 450000;
export const PISO_FEMEA = 650000;

/**
 * A matriz. Valores em centavos, na ordem em que a tabela é apresentada ao
 * visitante. Desde 05/11/2026 a cor não muda o valor.
 */
export const TABELA_DE_PRECOS: Record<CorDivulgada, LinhaDaTabela> = {
  particolor: { label: "Particolor", macho: PISO_MACHO, femea: PISO_FEMEA },
  laranja: { label: "Laranja", macho: PISO_MACHO, femea: PISO_FEMEA },
  creme: { label: "Creme", macho: PISO_MACHO, femea: PISO_FEMEA },
  preto: { label: "Preto", macho: PISO_MACHO, femea: PISO_FEMEA },
  branco: { label: "Branco", macho: PISO_MACHO, femea: PISO_FEMEA },
  chocolate: { label: "Chocolate", macho: PISO_MACHO, femea: PISO_FEMEA },
  merle: { label: "Merle", macho: PISO_MACHO, femea: PISO_FEMEA },
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

/** Integrações e admin: desconhecido não recebe preço inventado. */
export function precoDeCadastro(cor?: string | null, sexo?: string | null): number | null {
  // Compatibilidade do formulário antigo: cor e sexo não autorizam preço.
  void cor;
  void sexo;
  return null;
}

/**
 * O valor publicado de cada página da vitrine.
 *
 * O slug continua sendo a lista de ofertas: referência que sai de divulgação não
 * tem entrada aqui e não recebe preço. O valor é o do sexo declarado no slug.
 */
export const PRECO_POR_SLUG: Readonly<Record<string, number>> = {
  "spitz-alemao-anao-branco-macho": PISO_MACHO,
  "spitz-alemao-anao-branco-femea": PISO_FEMEA,
  "spitz-alemao-anao-branco-femea-2": PISO_FEMEA,
  "spitz-alemao-anao-preto-femea": PISO_FEMEA,
  "spitz-alemao-anao-creme-femea": PISO_FEMEA,
  "spitz-alemao-anao-laranja-femea": PISO_FEMEA,
  "spitz-alemao-anao-laranja-femea-laco-rosa": PISO_FEMEA,
  "spitz-alemao-anao-creme-macho": PISO_MACHO,
  "spitz-alemao-anao-preto-macho": PISO_MACHO,
  "spitz-alemao-anao-laranja-macho": PISO_MACHO,
};

/** Preço individual cadastrado; ausência de valor não vira preço por cor/sexo. */
export function precoDoFilhote(cor: CorDivulgada, sexo: Sexo, slug: string): number {
  const valor = PRECO_POR_SLUG[slug];
  if (valor === undefined) throw new Error(`Preço individual não cadastrado para ${slug} (${cor}/${sexo})`);
  return valor;
}

/**
 * Menor valor real da cor — o que pode ser anunciado como "a partir de".
 *
 * Card genérico de cor, sem sexo definido, usa este número.
 */
export function aPartirDe(cor: CorDivulgada): number {
  const linha = TABELA_DE_PRECOS[cor];
  return Math.min(linha.macho, linha.femea);
}

/**
 * "A partir de R$ 6.500" — a forma como todo preço é publicado na vitrine.
 *
 * Esta função existe porque a regra mudou em 26/08/2026. Antes, o card de um
 * filhote específico já sabia o sexo e por isso publicava o valor cravado, sem
 * "a partir de". Só que a foto continua no ar depois que aquele animal sai, e
 * a página passa a representar a combinação de cor e sexo, não mais um
 * indivíduo — o valor exato depende de linhagem, idade e do que existir no
 * atendimento. Publicar um número fechado para uma página permanente é
 * prometer um preço que ninguém garantiu.
 *
 * Recebe centavos porque quem chama já tem o valor da combinação em mãos
 * (`precoDe`, ou o `priceCents` da vitrine, que o pricing-guard confere contra
 * a tabela). O texto é montado sobre {@link formatarPrecoComCentavos} pelo mesmo
 * motivo de sempre: um único formato de preço publicado no site inteiro.
 */
export function textoAPartirDe(cents: number): string {
  return `${PREFIXO_A_PARTIR_DE} ${formatarPrecoComCentavos(cents)}`;
}

/**
 * As três partes da frase, para quem precisa dar pesos visuais diferentes.
 *
 * A referência aprovada em 05/11/2026 desenha o card com o número grande em
 * ouro e "no PIX" numa linha miúda embaixo. Montar isso exigia escrever
 * "A partir de" e "no PIX" dentro do componente — e aí passariam a existir
 * duas origens para a mesma frase, que é exatamente a divergência que este
 * módulo foi criado para impedir (o card e a ficha já publicaram o mesmo
 * preço com separadores diferentes). Aqui as partes e o texto corrido saem
 * das mesmas duas constantes; tests/unit/pisos-publicados.test.ts cobra que
 * juntar as partes com um espaço devolva exatamente textoAPartirDeNoPix,
 * que é a forma que o portão e2e exige na tela.
 */
export const PREFIXO_A_PARTIR_DE = "A partir de";
export const SUFIXO_NO_PIX = "no PIX";

/**
 * "R$ 4.500,00" — com centavos, como o preço aparece no card, na ficha e na home.
 *
 * Montado à mão, e não com Intl style "currency", pela razão de sempre: aquele
 * formato separa "R$" do número com espaço sem quebra (U+00A0) e nenhuma
 * checagem de texto consegue ligar os dois valores.
 * tests/unit/price-format-guard.test.ts cobre essa proibição.
 */
export function formatarPrecoComCentavos(cents: number): string {
  const inteiro = Math.floor(cents / 100).toLocaleString("pt-BR");
  const centavos = String(cents % 100).padStart(2, "0");
  return `R$ ${inteiro},${centavos}`;
}

export function partesDoPrecoNoPix(cents: number): {
  prefixo: string;
  valor: string;
  sufixo: string;
} {
  return { prefixo: PREFIXO_A_PARTIR_DE, valor: formatarPrecoComCentavos(cents), sufixo: SUFIXO_NO_PIX };
}

/**
 * As partes do preço no cartão de /filhotes: "A partir de", "R$ 6.500", "no Pix".
 *
 * É o desenho aprovado em 06/11/2026 para essa página, sem centavos. Só ela usa
 * esta forma; a home, as fichas e os demais cartões seguem com {@link partesDoPrecoNoPix}.
 * O valor continua sendo o mesmo número, e tests/e2e/smoke.spec.ts cobra a frase.
 */
export function partesDoPrecoDaVitrine(cents: number): {
  prefixo: string;
  valor: string;
  sufixo: string;
} {
  return { prefixo: PREFIXO_A_PARTIR_DE, valor: formatarPreco(cents), sufixo: "no Pix" };
}

/**
 * "A partir de R$ 6.500,00 no PIX" — a forma como o preço aparece na vitrine.
 * Os centavos entraram por pedido da responsável em 06/11/2026, junto com a
 * retirada da linha "ou 3x": o cartão destaca só o valor no PIX, e parcelamento
 * se confirma no atendimento.
 *
 * A condição de pagamento passou a ser publicada por decisão da responsável em
 * 05/11/2026: o valor cadastrado é o do PIX, e dizer isso evita que alguém
 * chegue ao atendimento esperando o mesmo número em qualquer forma de
 * pagamento. Continua sendo "a partir de", pela razão de sempre — a página é
 * permanente e representa a combinação, não o animal daquela foto.
 *
 * Função única de propósito: o site tem três lugares que mostram preço
 * (card da vitrine, ficha do filhote e CTA fixo) e já divergiram antes por
 * cada um escrever o seu próprio texto.
 */
export function textoAPartirDeNoPix(cents: number): string {
  return `${textoAPartirDe(cents)} ${SUFIXO_NO_PIX}`;
}

/**
 * Fração do valor individual que a reserva representa, conforme contrato.
 *
 * Autorizada pela responsável em 05/11/2026 para publicação. Fica como número
 * porque o percentual e o valor em reais têm de sair da mesma fonte: a reserva
 * escrita "50%" num lugar e calculada em outro é exatamente o tipo de par que
 * já divergiu neste projeto.
 */
export const RESERVA_FRACAO = 0.5;

/** Valor da reserva daquele filhote, em centavos. */
export function reservaDe(cents: number): number {
  return Math.round(cents * RESERVA_FRACAO);
}

/**
 * "Reserva: R$ 2.250 — 50% do valor, conforme contrato".
 *
 * Diz de quem é a regra. A reserva não é uma condição que o site oferece por
 * conta própria: ela está no contrato de compra e venda, e a frase aponta para
 * lá em vez de soar como promoção.
 */
export function textoReserva(cents: number): string {
  const percentual = Math.round(RESERVA_FRACAO * 100);
  return `Reserva: ${formatarPreco(reservaDe(cents))} — ${percentual}% do valor, conforme contrato`;
}

/**
 * O sexo que o próprio slug da oferta declara.
 *
 * Não existe campo de sexo em PRECO_POR_SLUG, e inventar um segundo cadastro
 * para repetir o que o slug já diz seria criar a divergência que este módulo
 * existe para impedir. A ordem do teste importa: "-femea-laco-rosa" contém
 * "-femea" e nenhum slug mistura os dois.
 */
function sexoDaOferta(slug: string): Sexo | null {
  if (slug.includes("-femea")) return "femea";
  if (slug.includes("-macho")) return "macho";
  return null;
}

/**
 * As ofertas que existem hoje — uma linha por filhote com preço cadastrado.
 *
 * PRECO_POR_SLUG é a lista de ofertas reais: as duas referências que saíram de
 * divulgação não têm entrada aqui. Por isso é desta lista, e não da matriz
 * legada, que sai qualquer "a partir de" publicado.
 */
export const OFERTAS_ATUAIS = Object.entries(PRECO_POR_SLUG).map(([slug, cents]) => ({
  slug,
  cents,
  sexo: sexoDaOferta(slug),
}));

/**
 * Menor valor que existe hoje para o sexo — ou `null` quando não há oferta.
 *
 * Isto é o que autoriza a frase "Machos a partir de R$ 4.500 no PIX" na
 * vitrine: o número é o mínimo das ofertas vigentes, calculado a cada build.
 * Se o último macho daquele valor sair da lista, a frase sobe sozinha; se não
 * sobrar macho nenhum, a função devolve `null` e o bloco não é publicado, em
 * vez de anunciar um piso que ninguém pode cumprir.
 */
export function pisoPorSexo(sexo: Sexo): number | null {
  const valores = OFERTAS_ATUAIS.filter((o) => o.sexo === sexo).map((o) => o.cents);
  return valores.length > 0 ? Math.min(...valores) : null;
}

/**
 * O slug de uma oferta que está exatamente no piso daquele sexo.
 *
 * Existe para que o cartão de piso aponte para um filhote de verdade em vez de
 * abrir um link genérico: quem lê "a partir de R$ 4.500" pode clicar e ver o
 * animal que custa isso. Normalmente mais de um filhote empata no piso; a
 * escolha é a ordem de PRECO_POR_SLUG, estável entre builds, e o cartão diz
 * "um dos filhotes neste valor" justamente porque não é o único.
 *
 * Devolve `null` quando não há oferta — e então o cartão não é publicado.
 */
function ofertaNoPiso(sexo: Sexo): string | null {
  const piso = pisoPorSexo(sexo);
  if (piso === null) return null;
  return OFERTAS_ATUAIS.find((o) => o.sexo === sexo && o.cents === piso)?.slug ?? null;
}

/**
 * Os dois pisos, já com rótulo e texto, na ordem em que a vitrine os mostra.
 *
 * Sai pronto daqui porque o mesmo par aparece na home e em /filhotes, e um par
 * de números repetido em dois componentes é um par de números que divergem.
 * Sexo sem oferta não gera cartão.
 */
export const PISOS_POR_SEXO = (["macho", "femea"] as const)
  .map((sexo) => ({
    sexo,
    rotulo: sexo === "macho" ? "Machos" : "Fêmeas",
    cents: pisoPorSexo(sexo),
    slug: ofertaNoPiso(sexo),
  }))
  .filter(
    (piso): piso is { sexo: Sexo; rotulo: string; cents: number; slug: string } =>
      piso.cents !== null && piso.slug !== null,
  );

const TODOS_OS_VALORES = OFERTAS_ATUAIS.map((oferta) => oferta.cents);

/**
 * Faixa pública. Derivada das ofertas vigentes, nunca escrita na mão.
 *
 * Até 05/11/2026 esta faixa nascia de TABELA_DE_PRECOS, a matriz legada por
 * cor e sexo — e a matriz deixou de ser regra de oferta quando cada filhote
 * passou a ter preço individual. O resultado é que o site anunciava
 * "R$ 5.500 – R$ 10.500" em cinco páginas e no llms.txt, nas duas pontas
 * erradas, enquanto a vitrine praticava R$ 4.500 a R$ 9.500. Os dois extremos
 * eram valores que ninguém podia cobrar: o mínimo afastava quem cabia, o
 * máximo prometia um teto acima do praticado, e o JSON-LD levava os dois ao
 * Google. Agora a faixa é o mínimo e o máximo do que está à venda.
 */
export const FAIXA_PUBLICA = {
  minCents: Math.min(...TODOS_OS_VALORES),
  maxCents: Math.max(...TODOS_OS_VALORES),
  mediaCents: Math.round(
    TODOS_OS_VALORES.reduce((soma, valor) => soma + valor, 0) / TODOS_OS_VALORES.length
  ),
} as const;

/** "R$ 5.500 a R$ 8.500" — a forma como a faixa é escrita em prosa. */
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
/**
 * "particolor R$ 5.500; laranja R$ 6.500; creme e preto R$ 7.500; branco
 * R$ 8.500" — as cores de um sexo, agrupadas por valor e em ordem crescente.
 *
 * A versão anterior desta lista era escrita à mão dentro da resposta, uma cor
 * de cada vez. Foi assim que entrar uma quinta cor na tabela virou trabalho de
 * reescrever texto: o Particolor existiria na matriz e continuaria fora da
 * frase. Agora o que a tabela ganha ou perde aparece aqui sozinho.
 */


const TEXTO_DOS_PISOS = `Os machos partem de ${formatarPreco(PISO_MACHO)} e as fêmeas de ${formatarPreco(PISO_FEMEA)} no PIX`;

export const RESPOSTA_QUANTO_CUSTA =
  `${TEXTO_DOS_PISOS}, em qualquer cor. ` +
  "Consulte a ficha do filhote e confirme disponibilidade e condições de pagamento no atendimento.";

/**
 * Diferença entre fêmea e macho na mesma cor, em centavos — ou `null` quando a
 * matriz deixar de ter uma diferença única.
 *
 * Nasce da tabela em vez de "R$ 1.000" digitado numa FAQ. Quando as cores não
 * têm o mesmo degrau, esta constante
 * vira `null` e a frase troca de forma automaticamente, em vez de continuar
 * afirmando um número que parou de valer.
 */
export const DIFERENCA_FEMEA_MACHO: number | null = (() => {
  const degraus = new Set(
    CORES_DIVULGADAS.map((cor) => precoDe(cor, "femea") - precoDe(cor, "macho"))
  );
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
  `${TEXTO_DOS_PISOS}. A cor não muda esse valor de partida. ` +
  "Confirme disponibilidade e condições de pagamento no atendimento.";

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
export function respostaPrecoCor(cor: CorDivulgada): string {
  const { label, macho, femea } = TABELA_DE_PRECOS[cor];
  return `O Spitz Alemão Anão (Lulu da Pomerânia) ${label.toLowerCase()} parte de ${formatarPreco(macho)} nos machos e de ${formatarPreco(femea)} nas fêmeas, no PIX. ` +
    "Consulte a ficha do filhote e confirme disponibilidade e condições no atendimento.";
}
export const RESPOSTA_PRETO = respostaPrecoCor("preto");

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
