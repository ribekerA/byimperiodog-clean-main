/**
 * Smoke: o site sobe e as paginas que sustentam a venda dizem a verdade.
 *
 * REGRA DE SEGURANCA DESTE ARQUIVO -- nenhum teste aqui pode produzir efeito no
 * mundo real. Concretamente:
 *
 *   - NAO clica em CTA de WhatsApp. O href e conferido como atributo. Um clique
 *     abriria wa.me e, em producao, gravaria uma conversao de verdade na conta
 *     de Google Ads da responsavel -- numero inventado dentro de um relatorio
 *     que ela usa para decidir orcamento.
 *   - NAO envia formulario de contato. Lead de teste chega no mesmo lugar que
 *     lead de cliente.
 *   - NAO exercita pagamento, Pix ou reserva.
 *
 * O que sobra e o que interessa num portao: as rotas respondem, o catalogo
 * publicado aparece, o preco na tela e o preco da tabela, e o schema nao
 * promete o que a pagina nao tem.
 */

import { expect, test, type Page } from "@playwright/test";

import { puppiesPublicados } from "../../content/puppies-static";
import {
  CORES_DIVULGADAS,
  LINHAS_FORMATADAS,
  TABELA_DE_PRECOS,
  formatarPreco,
} from "../../src/domain/pricing";

const WA_NUMERO = "5511968633239";

/** Todo JSON-LD da pagina, ja desempacotado de @graph e de arrays. */
async function jsonLd(page: Page): Promise<Record<string, unknown>[]> {
  const brutos = await page.locator('script[type="application/ld+json"]').allTextContents();
  const saida: Record<string, unknown>[] = [];
  for (const bruto of brutos) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(bruto);
    } catch {
      throw new Error(`JSON-LD invalido na pagina: ${bruto.slice(0, 120)}`);
    }
    const fila = Array.isArray(parsed) ? parsed : [parsed];
    for (const item of fila) {
      if (!item || typeof item !== "object") continue;
      const obj = item as Record<string, unknown>;
      const grafo = obj["@graph"];
      if (Array.isArray(grafo)) saida.push(...(grafo as Record<string, unknown>[]));
      else saida.push(obj);
    }
  }
  return saida;
}

test.describe("Smoke publico", () => {
  test("as rotas que sustentam a venda respondem 200", async ({ page }) => {
    const primeiroFilhote = puppiesPublicados[0];
    expect(primeiroFilhote, "o catalogo publicado nao pode estar vazio").toBeTruthy();

    const rotas = [
      "/",
      "/filhotes",
      "/contato",
      "/blog",
      "/preco-spitz-anao",
      `/filhotes/${primeiroFilhote.slug}`,
    ];

    for (const rota of rotas) {
      const resposta = await page.goto(rota);
      expect(resposta, `sem resposta para ${rota}`).toBeTruthy();
      expect(resposta!.status(), `${rota} respondeu ${resposta!.status()}`).toBe(200);
      // Pagina que responde 200 e renderiza vazio e pior do que 500: entra no
      // indice como pagina fina.
      await expect(page.locator("h1").first()).toBeVisible();
    }
  });

  test("a tabela de precos na tela e a tabela do dominio", async ({ page }) => {
    await page.goto("/preco-spitz-anao");
    const corpo = await page.locator("body").innerText();

    for (const linha of LINHAS_FORMATADAS) {
      expect(corpo, `cor "${linha.label}" fora da pagina de preco`).toContain(linha.label);
      expect(corpo, `macho ${linha.label} deveria mostrar ${linha.macho}`).toContain(linha.macho);
      expect(corpo, `femea ${linha.label} deveria mostrar ${linha.femea}`).toContain(linha.femea);
    }

    // Nenhum valor NA FAIXA DA TABELA pode aparecer sem estar na tabela.
    //
    // O limiar existe porque a pagina fala de dinheiro que nao e preco de
    // filhote: "a diferenca e de R$ 1.000" entre macho e femea, custo de
    // manutencao, e por ai vai. Comparar tudo reprovaria aritmetica correta.
    // O que importa e o valor que o visitante pode confundir com preco --
    // um R$ 6.000 esquecido de uma tabela antiga, por exemplo.
    const daTabela = new Set(LINHAS_FORMATADAS.flatMap((l) => [l.macho, l.femea]));
    const pisoCents = Math.min(
      ...CORES_DIVULGADAS.map((cor) => TABELA_DE_PRECOS[cor].macho),
    );
    const emCentavos = (texto: string) =>
      Number(texto.replace(/[^0-9.]/g, "").replace(/./g, "")) * 100;

    const precosNaTela = corpo.match(/R$s?d{1,3}(?:.d{3})+/g) ?? [];
    const estranhos = [...new Set(precosNaTela)].filter(
      (p) => emCentavos(p) >= pisoCents && !daTabela.has(p),
    );
    expect(
      estranhos,
      `valores na faixa da tabela que a tabela nao tem: ${estranhos.join(", ")}`,
    ).toEqual([]);

    // A pagina afirma que a femea custa "R$ 1.000 a mais na mesma cor". Isso e
    // um numero derivado da tabela, escrito a mao em dois lugares: no dia em
    // que um preco mudar, a frase vira mentira sem ninguem editar nada.
    const diferencas = new Set(
      CORES_DIVULGADAS.map((cor) => TABELA_DE_PRECOS[cor].femea - TABELA_DE_PRECOS[cor].macho),
    );
    if (diferencas.size === 1) {
      const diferenca = formatarPreco([...diferencas][0]);
      expect(
        corpo,
        `a tabela tem diferenca unica de ${diferenca} e a pagina nao diz isso`,
      ).toContain(diferenca);
    } else {
      // Diferenca deixou de ser unica: a frase de valor unico nao pode existir.
      expect(corpo, "a pagina afirma uma diferenca unica que a tabela nao tem").not.toMatch(
        /diferença é de R$/i,
      );
    }
  });

  test("todo filhote publicado tem card na vitrine", async ({ page }) => {
    await page.goto("/filhotes");
    for (const filhote of puppiesPublicados) {
      const link = page.locator(`a[href="/filhotes/${filhote.slug}"]`).first();
      await expect(link, `sem card para ${filhote.slug}`).toHaveCount(1);
    }
  });

  test("o preco publicado no schema e o preco da tabela", async ({ page }) => {
    // Contra a TABELA, nao contra o catalogo.
    //
    // A primeira versao deste teste comparava o schema da pagina com o campo
    // price_cents do proprio filhote. Os dois saem do mesmo arquivo, entao ele
    // nunca poderia falhar: mudei o preco no catalogo de proposito e o teste
    // passou. Comparar com src/domain/pricing.ts e o que torna a checagem
    // capaz de reprovar -- ela liga o que o Google le ao que a responsavel
    // decidiu cobrar.
    const SEXO: Record<string, "macho" | "femea"> = { male: "macho", female: "femea" };

    for (const filhote of puppiesPublicados) {
      const cor = String(filhote.color) as (typeof CORES_DIVULGADAS)[number];
      if (!(CORES_DIVULGADAS as readonly string[]).includes(cor)) continue;
      const sexo = SEXO[String(filhote.sex)];
      expect(sexo, `${filhote.slug}: sexo "${filhote.sex}" fora do vocabulario`).toBeTruthy();

      await page.goto(`/filhotes/${filhote.slug}`);
      const produto = (await jsonLd(page)).find((b) => b["@type"] === "Product");
      if (!produto) continue;

      const offer = produto.offers as Record<string, unknown> | undefined;
      if (!offer) {
        // Sem Offer so e legitimo para quem nao esta a venda.
        expect(
          filhote.status,
          `${filhote.slug} esta disponivel e nao publica Offer`,
        ).not.toBe("available");
        continue;
      }

      // Offer so existe para quem esta a venda: reservado e vendido publicam
      // Product sem oferta -- pagina util, promessa nenhuma.
      expect(filhote.status, `${filhote.slug} publica Offer sem estar disponivel`).toBe(
        "available",
      );

      const daTabela = TABELA_DE_PRECOS[cor][sexo];
      expect(
        Number(offer.price) * 100,
        `${filhote.slug}: o schema anuncia ${offer.price} e a tabela diz ${daTabela / 100}`,
      ).toBe(daTabela);

      // E o mesmo numero tem de estar na tela, nao so no JSON-LD.
      const corpo = await page.locator("body").innerText();
      expect(corpo, `${filhote.slug} nao mostra ${formatarPreco(daTabela)}`).toContain(
        formatarPreco(daTabela),
      );
    }
  });

  test("o CTA de WhatsApp aponta para o numero do canil -- conferido sem clicar", async ({
    page,
  }) => {
    await page.goto("/");
    const links = page.locator('a[href*="wa.me"], a[href*="api.whatsapp.com"]');
    const total = await links.count();
    expect(total, "a home nao tem nenhum CTA de WhatsApp").toBeGreaterThan(0);

    for (let i = 0; i < total; i++) {
      const href = (await links.nth(i).getAttribute("href")) ?? "";
      // wa.me/?text= e o botao de compartilhar: manda a pessoa escolher o
      // destinatario, nao fala com o canil. Nao carrega numero de proposito.
      if (href.includes("wa.me/?")) continue;
      expect(href, `CTA apontando para outro numero: ${href}`).toContain(WA_NUMERO);
    }
  });

  test("nenhuma pagina publica FAQPage", async ({ page }) => {
    // O Google aposentou o rich result de FAQ em maio de 2026. O markup deixou
    // de render resultado e passou a ser so superficie de erro no Search
    // Console. As perguntas continuam na tela; o que saiu foi o JSON-LD.
    for (const rota of ["/", "/filhotes", "/preco-spitz-anao", "/contato"]) {
      await page.goto(rota);
      const tipos = (await jsonLd(page)).map((b) => String(b["@type"]));
      expect(tipos, `${rota} ainda publica FAQPage`).not.toContain("FAQPage");
    }
  });

  test("cor divulgada tem vitrine propria; filhote inexistente devolve 404", async ({ page }) => {
    for (const linha of LINHAS_FORMATADAS) {
      const resposta = await page.goto(`/filhotes/cor/${linha.cor}`);
      expect(resposta!.status(), `/filhotes/cor/${linha.cor} respondeu ${resposta!.status()}`).toBe(
        200,
      );
      const corpo = await page.locator("body").innerText();
      // A vitrine de cor precisa mostrar o "a partir de" da propria cor, e ele
      // sai do dominio ja formatado -- recalcular aqui criaria uma segunda
      // formatacao para o mesmo numero.
      expect(corpo, `/filhotes/cor/${linha.cor} nao mostra ${linha.aPartirDe}`).toContain(
        linha.aPartirDe,
      );
    }

    const inexistente = await page.goto("/filhotes/este-filhote-nunca-existiu");
    expect(inexistente!.status()).toBe(404);
  });

  test("o formulario de contato existe -- e nao e enviado", async ({ page }) => {
    await page.goto("/contato");
    await expect(page.locator("form").first()).toBeVisible();
    // Nenhum submit aqui de proposito: ver o cabecalho deste arquivo.
  });
});
