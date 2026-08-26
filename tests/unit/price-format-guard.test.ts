import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

import { describe, expect, it } from "vitest";

import { formatarPreco } from "@/domain/pricing";

/**
 * Um único texto de preço no site público.
 *
 * Este teste existe por causa de um defeito real, não de uma preferência de
 * estilo. `/filhotes/spitz-alemao-anao-branco-femea` publicava o preco com
 * U+00A0 entre o simbolo e o numero, enquanto a tabela de
 * `/preco-spitz-anao` publicava o mesmo preco com espaco comum. Na tela os
 * dois sao identicos; como texto sao strings diferentes, porque
 * `Intl.NumberFormat` com `style: "currency"` separa o simbolo do numero
 * com espaco sem quebra (U+00A0, e U+202F em alguns runtimes). Nenhuma
 * checagem de texto — teste, gate de conteúdo ou leitura do Google — conseguia
 * ligar o preço da página do filhote ao preço da tabela.
 *
 * A causa não era um arquivo: eram sete componentes públicos, cada um com o
 * seu próprio `formatPrice` privado. Corrigir os sete resolve o dia de hoje;
 * este teste é o que impede o oitavo.
 *
 * `formatarPreco` (src/domain/pricing.ts) é a única forma reconhecida no
 * site público. A lista de exceções abaixo é explícita e cada linha diz por
 * que aquele arquivo pode formatar sozinho.
 */

const RAIZ = resolve(__dirname, "..", "..");

/** Onde o site público formata preço. */
const DIRETORIOS = ["app", "src"];

/**
 * Onde `Intl` com moeda é legítimo — e o motivo.
 *
 * Nada aqui é página de venda indexável. O painel administrativo e o contrato
 * mostram valor com centavos porque é o que um documento financeiro exige;
 * os campos mascarados precisam do formato enquanto a pessoa digita.
 */
const EXCECOES: ReadonlyArray<{ prefixo: string; motivo: string }> = [
  { prefixo: "app/(admin)/", motivo: "painel interno, não é página pública" },
  { prefixo: "src/components/admin/", motivo: "painel interno" },
  { prefixo: "src/components/puppies/", motivo: "campo de preço mascarado do admin" },
  { prefixo: "src/lib/price.ts", motivo: "máscara de digitação usada só pelo formulário do admin" },
  { prefixo: "src/lib/contractPdf.ts", motivo: "documento financeiro: exige centavos" },
  { prefixo: "app/(public)/contract/", motivo: "documento do contrato assinado: exige centavos" },
];

/** Remove comentários para que a nota que registra a correção não se acuse. */
function semComentarios(fonte: string): string {
  return fonte.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]*\/\/.*$/gm, "");
}

function arquivosDeCodigo(dir: string, achados: string[] = []): string[] {
  for (const nome of readdirSync(dir)) {
    if (nome === "node_modules" || nome === ".next") continue;
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) {
      arquivosDeCodigo(caminho, achados);
      continue;
    }
    if (/\.tsx?$/.test(nome)) achados.push(caminho);
  }
  return achados;
}

function relativoPosix(caminho: string): string {
  return relative(RAIZ, caminho).split(sep).join("/");
}

const MOEDA = /style\s*:\s*["']currency["']/;

describe("formatação de preço no site público", () => {
  it("nenhum arquivo público formata moeda por conta própria", () => {
    const reincidentes: string[] = [];

    for (const raiz of DIRETORIOS) {
      for (const caminho of arquivosDeCodigo(join(RAIZ, raiz))) {
        const rel = relativoPosix(caminho);
        if (EXCECOES.some((e) => rel.startsWith(e.prefixo))) continue;
        if (rel.startsWith("src/domain/pricing.ts")) continue;
        if (!MOEDA.test(semComentarios(readFileSync(caminho, "utf8")))) continue;
        reincidentes.push(rel);
      }
    }

    expect(
      reincidentes,
      "Formate com formatarPreco de src/domain/pricing.ts. " +
        "Intl com style: \"currency\" escreve R$ com espaço sem quebra (U+00A0) e " +
        "quebra a comparação com a tabela de preços.",
    ).toEqual([]);
  });

  it("formatarPreco escreve R$ com espaço comum, não U+00A0", () => {
    const texto = formatarPreco(950000);
    expect(texto).toBe("R$ 9.500");
    const codigos = [...texto].map((c) => c.charCodeAt(0));
    expect(codigos).not.toContain(0x00a0);
    expect(codigos).not.toContain(0x202f);
  });
});
