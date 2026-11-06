/**
 * Texto de status no codigo publico — as regras que `showcase:audit` aplica.
 *
 * Moram aqui, fora de `showcase-audit.mts`, por um motivo so: o script da
 * auditoria roda e sai (`process.exit`), entao nao da para importa-lo de um
 * teste sem disparar a auditoria inteira. Estas funcoes sao puras, e
 * `tests/unit/portao-do-selo.test.ts` cobra cada condicao delas. Uma excecao
 * de portao que ninguem testa e um portao desligado com mais passos.
 *
 * ── A excecao de 05/11/2026 ──────────────────────────────────────────────
 *
 * A responsavel pediu o selo verde "Disponivel" de volta no card da vitrine,
 * ciente do que ele e: nao ha fonte que o sustente, e ele aparece tambem em
 * filhote ja vendido. Ela decidiu assim depois de ouvir isso por escrito.
 *
 * O portao nao foi aberto -- foi estreitado. O que ele protegia continua
 * protegido, porque as tres palavras nunca foram equivalentes:
 *
 *   "Reservado" e "Vendido"  afirmam o DESTINO de um animal especifico. Errar
 *                            isso e dizer a alguem que o filhote que ela quer
 *                            ja tem dono. Seguem criticos em qualquer arquivo
 *                            publico, sem excecao e sem lista de permissao
 *                            (`DESTINO_DE_FILHOTE`).
 *
 *   "Disponivel" FIXO        nao afirma nada sobre um animal: aparece igual em
 *                            todos os cards, e a pagina diz, logo acima da
 *                            grade, que a vitrine nao confirma estoque. E
 *                            decoracao, e so e aceito enquanto for
 *                            comprovadamente decoracao.
 *
 *   "Disponivel" LIDO        e a regressao de 26/08/2026 voltando: pareceria
 *                            informado e estaria errado em silencio. Continua
 *                            critico, inclusive no arquivo da excecao.
 *
 * As quatro condicoes de `avaliarSeloDisponivel` existem para que a terceira
 * linha nao se disfarce da segunda. Se qualquer uma cair, o build para e
 * alguem precisa olhar.
 *
 * Desde 05/11/2026 o projeto tem um cartao so, entao a excecao volta a ser um
 * caminho exato so: o carrossel da home, que tinha a sua, deixou de existir.
 */

/**
 * Destino de um filhote escrito na tela. Sem excecao e sem lista de
 * permissao: nenhuma decisao de layout justifica o site afirmar que um animal
 * especifico ja tem dono quando nada no codigo sabe disso.
 */
export const DESTINO_DE_FILHOTE = /["'>]\s*(Reservado|Vendido)\s*["'<]/;

/** O cartao unico: o unico arquivo publico que pode escrever "Disponivel". */
export const SELO_FIXO_EM = "src/components/catalog/StaticPuppyCard.tsx";

const DISPONIVEL = /["'>]\s*Dispon[ií]vel\s*["'<]/;
const DISPONIVEL_TODAS = /["'>]\s*Dispon[ií]vel\s*["'<]/g;

/**
 * A forma fixa. O `[^{]*` entre a classe e a palavra e o coracao da regra:
 * uma chave ali dentro significa interpolacao, e interpolacao e o selo
 * deixando de ser fixo.
 */
const SELO_FIXO = /className="selo-disponivel[^"]*"[^{]*Dispon[ií]vel/;

/** Operador logico ou ternario logo antes do selo = selo condicional. */
const CONDICIONAL = /&&|\?/;

/** Qualquer leitura de status no arquivo da excecao. */
const LE_STATUS = /\bstatus\b/i;

/** Quanto se olha para tras do selo a procura de uma condicao. */
const JANELA = 120;

/**
 * Comentario nao vai para o HTML. Sem tirar, as proprias notas que explicam a
 * regra ("removido em 26/08/2026 ... InStock") acusariam o arquivo que as
 * escreve.
 */
export const semComentarios = (fonte: string): string =>
  fonte.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");

/**
 * Devolve a mensagem da falha critica, ou `null` quando o arquivo esta em
 * ordem. Recebe a fonte JA SEM COMENTARIOS (`semComentarios`).
 */
export function avaliarSeloDisponivel(caminho: string, fonte: string): string | null {
  if (!DISPONIVEL.test(fonte)) return null;

  const trecho = (fonte.match(DISPONIVEL) ?? [""])[0].trim();
  if (caminho !== SELO_FIXO_EM) {
    return `status de filhote como texto na tela: ${trecho}`;
  }

  const quantas = [...fonte.matchAll(DISPONIVEL_TODAS)].length;
  if (quantas > 1) {
    return `"Disponivel" aparece ${quantas} vezes -- a excecao cobre um selo so`;
  }

  const fixo = SELO_FIXO.exec(fonte);
  if (!fixo) {
    return 'o selo "Disponivel" saiu da forma fixa (span .selo-disponivel ou .hm-disponivel sem interpolacao)';
  }

  const antes = fonte.slice(Math.max(0, fixo.index - JANELA), fixo.index);
  if (CONDICIONAL.test(antes)) {
    return 'o selo "Disponivel" virou condicional -- a excecao e so para o selo fixo';
  }

  if (LE_STATUS.test(fonte)) {
    return "o arquivo do selo fixo passou a ler status -- selo com fonte nao e decoracao";
  }

  return null;
}
