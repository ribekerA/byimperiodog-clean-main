/**
 * O portao do selo "Disponivel" — a excecao de 05/11/2026 sob vigilancia.
 *
 * Em 05/11/2026 `showcase:audit` deixou de proibir a palavra "Disponivel" em
 * todo o codigo publico e passou a aceitar UM selo, fixo, num arquivo so.
 * Afrouxar um portao de verdade e barato; o que custa e garantir que o
 * afrouxamento nao vire porta. Estes testes sao essa garantia.
 *
 * Eles cobrem as duas metades da decisao:
 *
 *   o que a excecao NAO abriu   "Reservado" e "Vendido" continuam criticos em
 *                               qualquer arquivo, e "Disponivel" continua
 *                               critico em qualquer arquivo que nao seja o
 *                               card da vitrine.
 *
 *   o que mantem a excecao      o selo tem de continuar unico, literal, nao
 *      honesta                  condicional e num arquivo que nao le status.
 *
 * O primeiro teste le o arquivo de verdade do disco. E o unico que amarra a
 * excecao ao codigo que esta no ar: os outros poderiam passar com o card
 * tendo virado qualquer coisa.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  DESTINO_DE_FILHOTE,
  SELO_FIXO_EM,
  avaliarSeloDisponivel,
  semComentarios,
} from "../../scripts/lib/texto-de-status";

const OUTRO = "src/components/catalog/StaticCatalog.tsx";

/** O selo como ele esta no card, reduzido ao que a regra olha. */
const SELO_REAL = [
  '<span className="selo-disponivel absolute left-3 top-3">',
  '  <span aria-hidden="true">✓</span> Disponível',
  "</span>",
].join("\n");

function cardCom(markup: string): string {
  return [
    'import Image from "next/image";',
    "export default function StaticPuppyCard() {",
    "  return (",
    '    <article className="cartao-premium">',
    "      " + markup,
    "    </article>",
    "  );",
    "}",
  ].join("\n");
}

describe("o arquivo que esta no ar", () => {
  it("o card da vitrine passa pela regra como ele esta hoje", () => {
    const bruto = readFileSync(join(process.cwd(), SELO_FIXO_EM), "utf8");
    expect(avaliarSeloDisponivel(SELO_FIXO_EM, semComentarios(bruto))).toBeNull();
  });

  // O selo saiu em 06/11/2026 a pedido da responsavel, sem nada no lugar. O
  // resto deste arquivo continua valendo como regra para o caso de ele voltar,
  // mas o portao aceita o selo e nao o exige: sem este teste, recoloca-lo seria
  // silencioso.
  it("o card nao traz mais o selo", () => {
    const bruto = readFileSync(join(process.cwd(), SELO_FIXO_EM), "utf8");
    const codigo = semComentarios(bruto);
    expect(codigo).not.toMatch(/Dispon[ií]vel/);
    expect(codigo).not.toContain("selo-disponivel");
  });

  it("o card nao escreve destino de filhote nenhum", () => {
    const bruto = readFileSync(join(process.cwd(), SELO_FIXO_EM), "utf8");
    expect(DESTINO_DE_FILHOTE.test(semComentarios(bruto))).toBe(false);
  });
});

describe("o que a excecao nao abriu", () => {
  it('"Reservado" e "Vendido" continuam criticos, inclusive no arquivo do selo', () => {
    for (const palavra of ["Reservado", "Vendido"]) {
      expect(DESTINO_DE_FILHOTE.test(`<span>${palavra}</span>`)).toBe(true);
      expect(DESTINO_DE_FILHOTE.test(`const r = "${palavra}";`)).toBe(true);
    }
  });

  it('"Disponivel" continua critico em qualquer outro arquivo publico', () => {
    const falha = avaliarSeloDisponivel(OUTRO, '<span className="selo-disponivel">Disponível</span>');
    expect(falha).toMatch(/status de filhote como texto na tela/);
  });

  it("a excecao e do caminho exato, nao de qualquer arquivo parecido", () => {
    const quase = "src/components/catalog/StaticPuppyCard.backup.tsx";
    expect(avaliarSeloDisponivel(quase, cardCom(SELO_REAL))).not.toBeNull();
  });

  it("acento nao escapa da regra", () => {
    expect(avaliarSeloDisponivel(OUTRO, "<span>Disponivel</span>")).not.toBeNull();
    expect(avaliarSeloDisponivel(OUTRO, "<span>Disponível</span>")).not.toBeNull();
  });
});

describe("o que mantem a excecao honesta", () => {
  it("o selo fixo passa", () => {
    expect(avaliarSeloDisponivel(SELO_FIXO_EM, cardCom(SELO_REAL))).toBeNull();
  });

  it("um segundo 'Disponivel' no arquivo derruba o portao", () => {
    const dois = cardCom(SELO_REAL + '\n      <p title="Disponível">x</p>');
    expect(avaliarSeloDisponivel(SELO_FIXO_EM, dois)).toMatch(/aparece 2 vezes/);
  });

  it("selo interpolado derruba o portao", () => {
    const interpolado = cardCom(
      '<span className="selo-disponivel">{puppy.rotulo ?? "Disponível"}</span>',
    );
    expect(avaliarSeloDisponivel(SELO_FIXO_EM, interpolado)).toMatch(/forma fixa/);
  });

  it("selo fora do span .selo-disponivel derruba o portao", () => {
    const solto = cardCom('<span className="badge">Disponível</span>');
    expect(avaliarSeloDisponivel(SELO_FIXO_EM, solto)).toMatch(/forma fixa/);
  });

  it("selo atras de && derruba o portao", () => {
    const condicional = cardCom("{ativo && " + SELO_REAL + "}");
    expect(avaliarSeloDisponivel(SELO_FIXO_EM, condicional)).toMatch(/condicional/);
  });

  it("selo atras de ternario derruba o portao", () => {
    const condicional = cardCom("{ativo ? " + SELO_REAL + " : null}");
    expect(avaliarSeloDisponivel(SELO_FIXO_EM, condicional)).toMatch(/condicional/);
  });

  it("o arquivo passar a ler status derruba o portao", () => {
    const comStatus = [
      "const livre = puppy.status === \"available\";",
      cardCom(SELO_REAL),
    ].join("\n");
    expect(avaliarSeloDisponivel(SELO_FIXO_EM, comStatus)).toMatch(/passou a ler status/);
  });

  it("arquivo sem a palavra nenhuma passa sem reclamacao", () => {
    expect(avaliarSeloDisponivel(SELO_FIXO_EM, cardCom("<p>Spitz</p>"))).toBeNull();
    expect(avaliarSeloDisponivel(OUTRO, cardCom("<p>Spitz</p>"))).toBeNull();
  });
});

describe("semComentarios", () => {
  it("tira as notas que citam as palavras proibidas", () => {
    const fonte = [
      "// o selo \"Reservado\" saiu em 26/08/2026",
      "/* e o \"Vendido\" junto */",
      "const x = 1;",
    ].join("\n");
    const limpo = semComentarios(fonte);
    expect(DESTINO_DE_FILHOTE.test(limpo)).toBe(false);
    expect(limpo).toContain("const x = 1;");
  });

  it("nao confunde o // de uma URL com comentario", () => {
    const fonte = 'const u = "https://byimperiodog.com.br/filhotes";';
    expect(semComentarios(fonte)).toContain("byimperiodog.com.br/filhotes");
  });
});
