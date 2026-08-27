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

  test("o preco na tela e o preco da tabela, e nenhuma pagina publica Offer", async ({
    page,
  }) => {
    // Contra a TABELA, nao contra o catalogo.
    //
    // A primeira versao deste teste comparava o schema da pagina com o campo
    // price_cents do proprio filhote. Os dois saem do mesmo arquivo, entao ele
    // nunca poderia falhar: mudei o preco no catalogo de proposito e o teste
    // passou. Comparar com src/domain/pricing.ts e o que torna a checagem
    // capaz de reprovar -- ela liga o que o visitante le ao que a responsavel
    // decidiu cobrar.
    //
    // A segunda versao lia o preco de `offers.price` no JSON-LD. Esse nó saiu
    // do site: pagina de vitrine nao e ficha de produto, e Offer com estoque
    // declarado sobre uma foto permanente e motivo de acao manual. Entao o
    // teste passou a ler o preco do HTML visivel -- que e onde ele tem de
    // estar -- e a reprovar se qualquer Product/Offer/InStock voltar.
    const SEXO: Record<string, "macho" | "femea"> = { male: "macho", female: "femea" };

    for (const filhote of puppiesPublicados) {
      const cor = String(filhote.color) as (typeof CORES_DIVULGADAS)[number];
      if (!(CORES_DIVULGADAS as readonly string[]).includes(cor)) continue;
      const sexo = SEXO[String(filhote.sex)];
      expect(sexo, `${filhote.slug}: sexo "${filhote.sex}" fora do vocabulario`).toBeTruthy();

      await page.goto(`/filhotes/${filhote.slug}`);

      const blocos = await jsonLd(page);
      expect(blocos.length, `${filhote.slug} nao publica JSON-LD nenhum`).toBeGreaterThan(0);
      for (const bloco of blocos) {
        expect(
          bloco["@type"],
          `${filhote.slug} voltou a publicar Product`,
        ).not.toBe("Product");
        expect(bloco, `${filhote.slug} voltou a publicar Offer`).not.toHaveProperty("offers");
      }
      expect(
        JSON.stringify(blocos),
        `${filhote.slug} voltou a declarar disponibilidade em dado estruturado`,
      ).not.toMatch(/InStock|OutOfStock|LimitedAvailability|SoldOut/);

      const daTabela = TABELA_DE_PRECOS[cor][sexo];
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

/**
 * As superficies nomeadas no portao.
 *
 * Os testes acima varrem o catalogo inteiro por iteracao, o que cobre estas
 * paginas por tabela. O bloco abaixo as nomeia uma a uma de proposito: se um
 * dia a lista de publicados encolher por engano -- filtro trocado, entrada
 * marcada `divulgar: false` sem querer --, o teste por iteracao passa com o que
 * sobrou, e ninguem fica sabendo. Nomear e o que faz sumir doer.
 *
 * Alem das tres vitrines comerciais, entram aqui as duas rotas que o Google le
 * antes de qualquer pagina (robots e o indice de sitemaps) e a porta do painel.
 */
test.describe("Portao das superficies criticas", () => {
  /** Vitrines citadas pelo nome, com a linha da tabela que cada uma deve exibir. */
  const VITRINES = [
    { slug: "spitz-alemao-anao-branco-femea", cor: "branco", sexo: "femea" },
    { slug: "lulu-da-pomerania-particolor-macho", cor: "particolor", sexo: "macho" },
    { slug: "spitz-alemao-anao-laranja-macho", cor: "laranja", sexo: "macho" },
  ] as const;

  for (const vitrine of VITRINES) {
    test(`/filhotes/${vitrine.slug} responde e mostra o preco da tabela`, async ({ page }) => {
      const resposta = await page.goto(`/filhotes/${vitrine.slug}`);
      expect(resposta!.status(), `${vitrine.slug} respondeu ${resposta!.status()}`).toBe(200);

      await expect(page.locator("h1").first()).toBeVisible();
      await expect(
        page.locator("img").first(),
        `${vitrine.slug} e uma galeria visual: sem imagem ela nao tem funcao`,
      ).toBeVisible();

      const esperado = formatarPreco(TABELA_DE_PRECOS[vitrine.cor][vitrine.sexo]);
      const corpo = await page.locator("body").innerText();
      expect(corpo, `${vitrine.slug} nao mostra ${esperado}`).toContain(esperado);
    });
  }

  test("/blog lista artigos", async ({ page }) => {
    const resposta = await page.goto("/blog");
    expect(resposta!.status()).toBe(200);
    const artigos = page.locator('a[href^="/blog/"]');
    expect(await artigos.count(), "o blog respondeu 200 sem nenhum artigo").toBeGreaterThan(0);
  });

  test("robots.txt libera a vitrine, fecha o painel e aponta o sitemap", async ({ request }) => {
    const resposta = await request.get("/robots.txt");
    expect(resposta.status()).toBe(200);
    const texto = await resposta.text();

    // "Disallow: /" sozinho tira do indice tudo o que aquele grupo alcanca --
    // mas so aquele grupo. A checagem anterior procurava a linha no arquivo
    // inteiro e reprovava um robots.txt correto: AhrefsBot, SemrushBot, DotBot
    // e MJ12bot sao bloqueados de proposito, e "Disallow: /" e exatamente como
    // se bloqueia um raspador. Lida solta, a linha nao distingue "o site saiu
    // do indice" de "um raspador de backlink levou porta na cara".
    //
    // A regra passou a ser por grupo, com lista nomeada: quem pode ter
    // "Disallow: /" e so quem esta escrito abaixo. A mesma linha sob Googlebot,
    // sob um bot de IA ou sob "*" continua reprovando -- que era a intencao
    // desde o comeco, e agora e o que o teste realmente mede.
    const RASPADORES_BLOQUEADOS = ["ahrefsbot", "semrushbot", "dotbot", "mj12bot"];

    type Grupo = { agentes: string[]; regras: string[] };
    const grupos: Grupo[] = [];
    let atual: Grupo | null = null;
    for (const bruta of texto.split(/\r?\n/)) {
      const linha = bruta.trim();
      const ua = /^user-agent:\s*(.+)$/i.exec(linha);
      if (ua) {
        // User-Agent seguidos compartilham o mesmo grupo (RFC 9309).
        if (!atual || atual.regras.length > 0) {
          atual = { agentes: [], regras: [] };
          grupos.push(atual);
        }
        atual.agentes.push(ua[1].trim().toLowerCase());
        continue;
      }
      if (atual && /^(dis)?allow:/i.test(linha)) atual.regras.push(linha);
    }

    expect(grupos.length, "robots.txt sem nenhum grupo User-Agent").toBeGreaterThan(0);

    for (const grupo of grupos) {
      if (!grupo.regras.some((r) => /^disallow:\s*\/\s*$/i.test(r))) continue;
      for (const agente of grupo.agentes) {
        expect(
          RASPADORES_BLOQUEADOS,
          `"Disallow: /" sob User-Agent: ${agente} tira o site do indice`,
        ).toContain(agente);
      }
    }

    const coringa = grupos.find((g) => g.agentes.includes("*"));
    expect(coringa, "robots.txt sem grupo User-Agent: *").toBeTruthy();
    expect(
      coringa!.regras.some((r) => /^allow:\s*\/\s*$/i.test(r)),
      "o grupo * nao libera a vitrine",
    ).toBe(true);

    expect(texto, "robots.txt nao aponta nenhum sitemap").toMatch(/Sitemap:\s*https?:\/\//i);
    expect(texto, "o painel precisa ficar fora do indice").toMatch(/Disallow:\s*\/admin/i);
  });

  test("o indice de sitemaps responde XML e lista sitemaps", async ({ request }) => {
    const resposta = await request.get("/sitemap-index.xml");
    expect(resposta.status()).toBe(200);
    const xml = await resposta.text();
    expect(xml, "a resposta nao e um indice de sitemaps").toContain("<sitemapindex");
    const locs = xml.match(/<loc>/g) ?? [];
    expect(locs.length, "indice de sitemaps sem nenhum <loc>").toBeGreaterThan(0);
  });

  test("o painel nao abre sem sessao", async ({ page }) => {
    await page.goto("/admin/dashboard");
    // O proxy manda para o login. O que nao pode acontecer e a pagina do painel
    // renderizar para quem chegou sem cookie assinada.
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
