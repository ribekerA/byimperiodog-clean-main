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

import { puppiesPublicados, staticPuppies } from "../../content/puppies-static";
import {
  CORES_DIVULGADAS,
  LINHAS_FORMATADAS,
  TABELA_DE_PRECOS,
  formatarPreco,
  precoDoFilhote,
  textoAPartirDeNoPix,
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

  test.skip("legado: tabela de preços removida por decisão comercial", async ({ page }) => {
    await page.goto("/preco-spitz-anao");
    const corpo = await page.locator("body").innerText();

    for (const linha of LINHAS_FORMATADAS) {
      expect(corpo, `cor "${linha.label}" fora da pagina de preco`).toContain(linha.label);
      if (linha.macho !== null) {
        expect(corpo, `macho ${linha.label} deveria mostrar ${linha.macho}`).toContain(linha.macho);
      }
      if (linha.femea !== null) {
        expect(corpo, `femea ${linha.label} deveria mostrar ${linha.femea}`).toContain(linha.femea);
      }
    }

    // Nenhum valor NA FAIXA DA TABELA pode aparecer sem estar na tabela.
    //
    // O limiar existe porque a pagina fala de dinheiro que nao e preco de
    // filhote: "a diferenca e de R$ 1.000" entre macho e femea, custo de
    // manutencao, e por ai vai. Comparar tudo reprovaria aritmetica correta.
    // O que importa e o valor que o visitante pode confundir com preco --
    // um R$ 6.000 esquecido de uma tabela antiga, por exemplo.
    const daTabela = new Set(
      LINHAS_FORMATADAS.flatMap((l) => [l.macho, l.femea]).filter(
        (valor): valor is string => valor !== null,
      ),
    );
    const pisoCents = Math.min(
      ...CORES_DIVULGADAS.flatMap((cor) => [
        TABELA_DE_PRECOS[cor].macho,
        TABELA_DE_PRECOS[cor].femea,
      ]).filter((valor): valor is number => valor !== null),
    );
    const emCentavos = (texto: string) =>
      Number(texto.replace(/[^0-9.]/g, "").replace(/\./g, "")) * 100;

    const precosNaTela = corpo.match(/R\$\s?\d{1,3}(?:\.\d{3})+/g) ?? [];
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
    const diferencas = new Set<number>();
    for (const cor of CORES_DIVULGADAS) {
      const linha = TABELA_DE_PRECOS[cor];
      if (linha.macho !== null && linha.femea !== null) {
        diferencas.add(linha.femea - linha.macho);
      }
    }
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

  test("rota histórica de preço leva à vitrine sem tabela genérica", async ({ page }) => {
    const resposta = await page.goto("/preco-spitz-anao");
    expect(resposta).toBeTruthy();
    expect(new URL(page.url()).pathname).toBe("/filhotes");
    const corpo = await page.locator("body").innerText();
    expect(corpo).toContain("Vitrine de filhotes");
    expect(corpo).not.toContain("Tabela de preços por cor e sexo");
    for (const filhote of puppiesPublicados) {
      expect(corpo, `${filhote.slug} sem valor individual`).toContain(formatarPreco(filhote.priceCents));
    }
  });

  test("todo filhote publicado tem card na vitrine", async ({ page }) => {
    await page.goto("/filhotes");
    for (const filhote of puppiesPublicados) {
      const link = page.locator(`a[href="/filhotes/${filhote.slug}"]`).first();
      await expect(link, `sem card para ${filhote.slug}`).toHaveCount(1);
    }
  });

  /**
   * O valor em /filhotes aparece como "A partir de R$ X no Pix", no desenho
   * aprovado em 06/11/2026. As outras paginas seguem com "R$ X,00 no PIX".
   *
   * Esta asercao ja foi o contrario. Em 27/08/2026 a auditoria de conversao
   * registrou "os valores de filhote sao exibidos sem 'A partir de'" e o portao
   * passou a proibir o prefixo. Em 05/11/2026 a responsavel determinou a forma
   * atual: o numero cadastrado e o do PIX, e dizer isso evita que alguem chegue
   * ao atendimento esperando o mesmo valor em qualquer forma de pagamento.
   *
   * O portao continua existindo porque o risco nunca foi o prefixo em si: e o
   * card, a ficha e o CTA fixo divergirem entre si, como ja divergiram. Por
   * isso aqui se exige a forma completa, nao apenas que o numero esteja na tela.
   */
  test("o catalogo preserva os destaques, ordena os demais por valor e mostra o valor no formato do PIX", async ({
    page,
  }) => {
    await page.goto("/filhotes");
    const cards = await page.locator("article").evaluateAll((items) =>
      items.map((item) => {
        const texto = item.textContent ?? "";
        const valor = texto.match(/R\$\s*([\d.]+)/)?.[1] ?? "0";
        const href = item.querySelector('a[href^="/filhotes/"]')?.getAttribute("href");
        return { texto, href, cents: Number(valor.replace(/\./g, "")) * 100 };
      }),
    );

    expect(cards).toHaveLength(puppiesPublicados.length);
    expect(cards.slice(0, 2).map((card) => card.href)).toEqual([
      "/filhotes/spitz-alemao-anao-branco-femea",
      "/filhotes/spitz-alemao-anao-preto-femea",
    ]);
    expect(cards.slice(2).map((card) => card.cents)).toEqual(
      [...cards.slice(2).map((card) => card.cents)].sort((a, b) => a - b),
    );
    for (const card of cards) {
      expect(
        card.texto,
        `${card.href ?? "card sem href"} nao mostra o valor como "A partir de R$ X no Pix"`,
      ).toMatch(/A partir de R\$\s*[\d.]+ no Pix/);
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

      const linksWhatsApp = await page
        .locator('a[href*="wa.me"], a[href*="api.whatsapp.com"]')
        .evaluateAll((links) => links.map((link) => link.getAttribute("href") ?? ""));
      for (const href of linksWhatsApp) {
        expect(
          decodeURIComponent(href),
          `${filhote.slug}: CTA do WhatsApp ainda inclui referencia interna`,
        ).not.toMatch(/\[ref:/i);
      }

      const daTabela = precoDoFilhote(cor, sexo, filhote.slug);
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

  test.skip("legado: cores sem ficha publicada não precisam de vitrine", async ({ page }) => {
    for (const linha of LINHAS_FORMATADAS) {
      const resposta = await page.goto(`/filhotes/cor/${linha.cor}`);
      expect(resposta!.status(), `/filhotes/cor/${linha.cor} respondeu ${resposta!.status()}`).toBe(
        200,
      );
      const corpo = await page.locator("body").innerText();
      // A vitrine de cor mostra o menor valor real entre os filhotes publicados
      // daquela cor. Um filhote pode ter preco proprio por slug, portanto a
      // antiga linha generica da tabela nao e a fonte correta para este card.
      const filhotesDaCor = puppiesPublicados.filter((filhote) => filhote.color === linha.cor);
      expect(filhotesDaCor, `/filhotes/cor/${linha.cor} sem filhotes publicados`).not.toHaveLength(0);
      const menorValor = Math.min(...filhotesDaCor.map((filhote) => filhote.priceCents));
      const esperado = formatarPreco(menorValor);
      expect(corpo, `/filhotes/cor/${linha.cor} nao mostra ${esperado}`).toContain(esperado);
      expect(corpo).toContain(textoAPartirDeNoPix(menorValor));
    }

    const inexistente = await page.goto("/filhotes/este-filhote-nunca-existiu");
    expect(inexistente!.status()).toBe(404);
  });

  test("cada cor publicada tem página própria com valor real", async ({ page }) => {
    const cores = [...new Set(puppiesPublicados.map((filhote) => filhote.color))];
    for (const cor of cores) {
      const resposta = await page.goto(`/filhotes/cor/${cor}`);
      expect(resposta!.status()).toBe(200);
      const corpo = await page.locator("body").innerText();
      const filhotes = puppiesPublicados.filter((filhote) => filhote.color === cor);
      const menorValor = Math.min(...filhotes.map((filhote) => filhote.priceCents));
      expect(corpo).toContain(formatarPreco(menorValor));
    }
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
    { slug: "spitz-alemao-anao-branco-femea-2", cor: "branco", sexo: "femea" },
    { slug: "spitz-alemao-anao-laranja-femea", cor: "laranja", sexo: "femea" },
    { slug: "spitz-alemao-anao-laranja-femea-laco-rosa", cor: "laranja", sexo: "femea" },
    { slug: "spitz-alemao-anao-preto-femea", cor: "preto", sexo: "femea" },
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

      const esperado = formatarPreco(precoDoFilhote(vitrine.cor, vitrine.sexo, vitrine.slug));
      const corpo = await page.locator("body").innerText();
      expect(corpo, `${vitrine.slug} nao mostra ${esperado}`).toContain(esperado);
      // Forma determinada pela responsavel em 05/11/2026 -- ver o comentario do
      // portao da vitrine, acima, sobre a decisao anterior que isto substitui.
      expect(
        corpo,
        `${vitrine.slug} nao mostra o valor como "A partir de ${esperado},00 no PIX"`,
      ).toContain(`A partir de ${esperado},00 no PIX`);
    });
  }

  // So entram aqui slugs que nunca mais devem responder -- fichas que sairam do
  // catalogo de verdade. Nao confundir com `divulgar: false`: essa marca tira a
  // ficha das vitrines e mantem a URL de pe de proposito, e o contrato dela esta
  // no teste logo abaixo. O cabecalho de content/puppies-static.ts e explicito:
  // quem responde por uma URL especifica le `staticPuppies` direto, "senao uma
  // pagina indexada passaria a devolver 404 ou a abrir vazia".
  for (const slug of [
    "lulu-da-pomerania-branco-macho",
    "lulu-da-pomerania-particolor-macho",
    "lulu-da-pomerania-laranja-macho",
  ]) {
    test(`/filhotes/${slug} foi removido`, async ({ request }) => {
      const resposta = await request.get(`/filhotes/${slug}`);
      expect(resposta.status()).toBe(404);
    });
  }

  test("ficha com divulgar: false sai da vitrine e mantem a URL de pe", async ({
    page,
    request,
  }) => {
    const foraDaVitrine = staticPuppies.filter(
      (filhote) => (filhote as { divulgar?: boolean }).divulgar === false,
    );
    expect(foraDaVitrine, "nenhuma ficha marcada divulgar: false para conferir").not.toHaveLength(0);

    await page.goto("/filhotes");
    for (const filhote of foraDaVitrine) {
      // A URL continua de pe: ela pode estar indexada ou num link ja enviado.
      const resposta = await request.get(`/filhotes/${filhote.slug}`);
      expect(resposta.status(), `${filhote.slug} deixou de responder`).toBe(200);
      // Mas a vitrine nao pode mais oferecer.
      await expect(
        page.locator(`a[href="/filhotes/${filhote.slug}"]`),
        `${filhote.slug} esta marcado divulgar: false e ainda aparece na vitrine`,
      ).toHaveCount(0);
    }
  });

  test("particolor tem pagina propria e nao cai no tema de outra cor", async ({ page }) => {
    // O particolor e uma das cores divulgadas em src/domain/pricing.ts e
    // tem pagina mesmo sem ficha publicada no momento -- uma cor da tabela sem
    // pagina deixaria a tabela prometendo o que o site nao mostra.
    //
    // A assercao e contra o fallback `?? THEMES.creme`: o particolor nao tinha
    // tema e a pagina abria com o selo e a amostra do creme, descrevendo uma cor
    // e mostrando outra (corrigido em 26/08/2026). Conferir o selo proprio e o
    // que faz essa regressao doer de novo.
    const resposta = await page.goto("/filhotes/cor/particolor");
    expect(resposta!.status()).toBe(200);
    await expect(page.locator("h1").first()).toBeVisible();

    const corpo = await page.locator("body").innerText();
    expect(corpo, "a pagina do particolor nao mostra o selo proprio").toContain(
      "Base branca com manchas definidas",
    );
    expect(corpo, "a pagina do particolor voltou a cair no tema do creme").not.toContain(
      "Pelagem cor de marfim",
    );
  });

  // Chocolate e Merle entraram sem foto de filhote. O que nao pode acontecer e a
  // ilustracao passar por foto: ela precisa da legenda visivel, e o "Fotos reais"
  // das outras cores nao pode aparecer aqui.
  for (const { cor, selo } of [
    { cor: "chocolate", selo: "Pelagem marrom uniforme" },
    { cor: "merle", selo: "Pelagem com manchas marmorizadas" },
  ]) {
    test(`${cor} tem pagina propria e identifica a ilustracao`, async ({ page }) => {
      const resposta = await page.goto(`/filhotes/cor/${cor}`);
      expect(resposta!.status()).toBe(200);
      await expect(page.locator("h1").first()).toBeVisible();

      const corpo = await page.locator("body").innerText();
      expect(corpo).toContain(selo);
      expect(corpo, `${cor} caiu no tema do creme`).not.toContain("Pelagem cor de marfim");
      expect(corpo).toContain("Ilustração da pelagem, não é foto de filhote.");
      expect(corpo, `${cor} promete foto real sem ter foto`).not.toContain("Fotos reais");
      await expect(page.locator(`img[src="/images/cores/${cor}-ilustracao.svg"]`)).toHaveAttribute(
        "alt",
        /^Ilustração da pelagem/,
      );
    });
  }

  // O selo "Incluso" sai do card pela esquerda a partir de 640 px. Com a legenda
  // centralizada, ele cobria o inicio do aviso de que a imagem nao e foto.
  for (const cor of ["chocolate", "merle"]) {
    for (const largura of [768, 1024, 1366]) {
      test(`${cor} em ${largura}: o selo nao cobre o aviso da ilustracao`, async ({ page }) => {
        await page.setViewportSize({ width: largura, height: 900 });
        await page.goto(`/filhotes/cor/${cor}`);
        const legenda = page.getByText("Ilustração da pelagem, não é foto de filhote.");
        await legenda.scrollIntoViewIfNeeded();
        // A entrada animada desloca o selo; mede depois que ela termina.
        await page.waitForTimeout(2500);

        const folga = await legenda.evaluate((p) => {
          const texto = document.createRange();
          texto.selectNodeContents(p);
          const selo = [...document.querySelectorAll("p")]
            .find((e) => e.textContent?.trim() === "Incluso")
            ?.parentElement?.getBoundingClientRect();
          return selo ? texto.getBoundingClientRect().left - selo.right : null;
        });
        expect(folga, "o selo Incluso nao foi encontrado").not.toBeNull();
        expect(folga!, "o selo cobre o inicio do aviso").toBeGreaterThanOrEqual(0);
      });
    }
  }

  test("a pagina do Merle nao cita o padrao FCI nem saude da cor", async ({ page }) => {
    await page.goto("/filhotes/cor/merle");
    const corpo = await page.locator("body").innerText();
    expect(corpo).not.toMatch(/padrão FCI/i);
    expect(corpo).not.toMatch(/inteligência ou saúde/i);
    expect(corpo).toContain("CBKC");
  });

  // Estes botoes dependiam so de NEXT_PUBLIC_WA_PHONE e sumiam em silencio quando
  // a variavel nao entrava no build. Agora ha numero de reserva. Este teste roda
  // sem a variavel no build local, que e justamente o caso que quebrava.
  for (const { rota, rotulo } of [
    { rota: "/comprar-spitz-anao", rotulo: "Vamos conversar sobre o seu novo amor" },
    { rota: "/criador-spitz-confiavel", rotulo: "Vamos conversar sobre o seu novo amor" },
    { rota: "/filhote-de-spitz-alemao", rotulo: "Vamos conversar sobre o seu novo amor" },
    { rota: "/spitz-alemao", rotulo: "Vamos conversar sobre o seu novo amor" },
    { rota: "/spitz-alemao-baby-face", rotulo: "Vamos conversar sobre o seu novo amor" },
    { rota: "/lulu-da-pomerania", rotulo: "Falar no WhatsApp" },
    { rota: "/lulu-da-pomerania-braganca-paulista", rotulo: "Agendar visita — WhatsApp" },
    { rota: "/canil-spitz-alemao-interior-sp", rotulo: "Falar no WhatsApp" },
    { rota: "/spitz-alemao-preto", rotulo: "Falar pelo WhatsApp" },
    { rota: "/blog/preco-spitz-alemao-anao", rotulo: "Falar no WhatsApp" },
  ]) {
    test(`${rota} mostra o botao "${rotulo}" com o numero do canil`, async ({ page }) => {
      await page.goto(rota);
      const botao = page.locator('a[href*="wa.me/5511968633239"]').filter({ hasText: rotulo }).first();
      await expect(botao).toBeVisible();
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

/**
 * O CTA principal tem de ser alcancavel no celular.
 *
 * O banner de consentimento e `fixed bottom-0` com z-index 9999 e, numa tela
 * de 375x812, ocupa ~220px de altura. O botao flutuante de WhatsApp e
 * `fixed` com z-index 9998 e mora dentro dessa faixa: ficava inteiro ATRAS do
 * banner, invisivel e sem receber toque, ate a pessoa resolver os cookies.
 * Em 92% do trafego, que e celular, o CTA principal do site nao existia nesse
 * intervalo.
 *
 * Isto so se prova em navegador de verdade: jsdom nao aplica o globals.css nem
 * calcula empilhamento, entao nenhum teste de unidade pega. O teste mede o que
 * o dedo faz -- `elementFromPoint` no centro do botao -- em vez de conferir
 * z-index, que e exatamente o detalhe que ja estava "certo" e mesmo assim
 * deixava o botao inacessivel.
 *
 * Nao clica no botao: abrir wa.me gravaria conversao de verdade no Ads. Ver a
 * regra de seguranca no topo deste arquivo.
 */
test.describe("Portao do CTA no celular", () => {
  test("o banner de consentimento nao cobre o botao flutuante de WhatsApp", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    // Contexto novo comeca sem consentimento gravado, entao o banner aparece.
    await page.goto("/blog/preco-spitz-alemao-anao");

    const banner = page.locator('[role="dialog"][aria-labelledby="consent-title"]');
    await expect(
      banner,
      "sem banner na tela este teste nao prova nada -- o consentimento vazou entre testes",
    ).toBeVisible();

    // O flutuante so monta 3s depois do load, de proposito (CLS).
    const flutuante = page.locator('[data-wa-placement="floating_button"]');
    await expect(flutuante).toBeVisible({ timeout: 15_000 });

    const medida = await page.evaluate(() => {
      const botao = document.querySelector<HTMLElement>('[data-wa-placement="floating_button"]');
      const caixaBanner = document
        .querySelector<HTMLElement>('[role="dialog"][aria-labelledby="consent-title"]')
        ?.getBoundingClientRect();
      if (!botao || !caixaBanner) return null;

      const caixa = botao.getBoundingClientRect();
      const x = Math.round(caixa.left + caixa.width / 2);
      const y = Math.round(caixa.top + caixa.height / 2);
      const noPonto = document.elementFromPoint(x, y);

      return {
        toqueAcertaOBotao: noPonto === botao || botao.contains(noPonto),
        cobertoPeloBanner: Boolean(noPonto?.closest('[role="dialog"][aria-labelledby="consent-title"]')),
        baseDoBotao: Math.round(caixa.bottom),
        topoDoBanner: Math.round(caixaBanner.top),
      };
    });

    expect(medida, "nao consegui medir o botao e o banner juntos").not.toBeNull();

    expect(
      medida!.cobertoPeloBanner,
      "o toque no centro do botao de WhatsApp cai no banner de consentimento",
    ).toBe(false);

    expect(
      medida!.toqueAcertaOBotao,
      "o centro do botao de WhatsApp nao recebe o toque -- tem algo por cima",
    ).toBe(true);

    // Nao basta receber o toque: o botao tem de estar acima da faixa do banner,
    // senao ele so esta visivel por acaso de um banner mais curto.
    expect(
      medida!.baseDoBotao,
      `o botao termina em ${medida!.baseDoBotao}px e o banner comeca em ${medida!.topoDoBanner}px`,
    ).toBeLessThanOrEqual(medida!.topoDoBanner);
  });
});
