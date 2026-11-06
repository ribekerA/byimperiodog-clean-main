import { describe, expect, it } from "vitest";

import {
  FAIXA_PUBLICA,
  OFERTAS_ATUAIS,
  PISOS_POR_SEXO,
  PRECO_POR_SLUG,
  PREFIXO_A_PARTIR_DE,
  RESERVA_FRACAO,
  SUFIXO_NO_PIX,
  formatarPrecoComCentavos,
  partesDoPrecoDaVitrine,
  partesDoPrecoNoPix,
  pisoPorSexo,
  reservaDe,
  textoAPartirDeNoPix,
  textoReserva,
} from "@/domain/pricing";

/**
 * O "a partir de" tem que existir de verdade.
 *
 * A diretriz comercial de 05/11/2026 é explícita: publicar valores "a partir
 * de" somente quando existirem ofertas atuais nesses valores. Home e vitrine
 * agora estampam dois pisos em caixa dourada, no topo da página — é o primeiro
 * número que o visitante lê e o que ele leva para a conversa no WhatsApp.
 *
 * O jeito de isso quebrar não é alguém digitar o número errado: é a tabela
 * mudar. Basta o filhote mais barato de um sexo sair de PRECO_POR_SLUG para o
 * piso subir, ou um valor novo entrar abaixo dele para o piso cair, e o texto
 * do topo passa a prometer o que o atendimento não pode honrar. Nada no build
 * perceberia: os dois lados continuariam compilando.
 *
 * Antes desta data a faixa pública vinha da matriz legada e anunciava
 * "R$ 5.500 a R$ 10.500" em cinco páginas e no llms.txt enquanto a vitrine
 * praticava R$ 4.500 a R$ 9.500 — os dois extremos errados ao mesmo tempo, por
 * mais de um ano, inclusive no priceRange do JSON-LD que o Google lê. Estes
 * testes existem para que esse tipo de divergência não volte em silêncio.
 */
describe("pisos publicados", () => {
  it("todo piso anunciado é o preço de uma oferta que existe", () => {
    const precos = Object.values(PRECO_POR_SLUG);
    expect(precos.length).toBeGreaterThan(0);

    for (const piso of PISOS_POR_SEXO) {
      expect(precos).toContain(piso.cents);
    }
  });

  it("o piso é o menor preço daquele sexo, não um valor qualquer dele", () => {
    for (const piso of PISOS_POR_SEXO) {
      const doSexo = OFERTAS_ATUAIS.filter((o) => o.sexo === piso.sexo).map((o) => o.cents);
      expect(doSexo.length).toBeGreaterThan(0);
      expect(piso.cents).toBe(Math.min(...doSexo));
    }
  });

  it("nenhuma oferta fica de fora do cálculo por falta de sexo no slug", () => {
    // sexoDaOferta lê "-macho"/"-femea" do próprio slug. Um slug novo fora
    // desse padrão entraria com sexo null e sumiria do piso sem avisar — o
    // filhote mais barato da vitrine deixaria de contar para o "a partir de".
    const semSexo = OFERTAS_ATUAIS.filter((o) => o.sexo === null).map((o) => o.slug);
    expect(semSexo).toEqual([]);
  });

  it("a faixa pública é o intervalo real das ofertas", () => {
    const precos = Object.values(PRECO_POR_SLUG);
    expect(FAIXA_PUBLICA.minCents).toBe(Math.min(...precos));
    expect(FAIXA_PUBLICA.maxCents).toBe(Math.max(...precos));
  });

  it("sexo sem oferta não ganha piso", () => {
    const sexosComOferta = new Set(OFERTAS_ATUAIS.map((o) => o.sexo));
    for (const sexo of ["macho", "femea"] as const) {
      if (!sexosComOferta.has(sexo)) {
        expect(pisoPorSexo(sexo)).toBeNull();
        expect(PISOS_POR_SEXO.some((p) => p.sexo === sexo)).toBe(false);
      }
    }
  });
});

/**
 * A reserva é cláusula de contrato, não arredondamento de vitrine.
 *
 * "Reserva correspondente a 50% do preço individual, conforme contrato" passou
 * a aparecer no card, na ficha e na barra fixa. Se a fração escorregar, o site
 * publica em três lugares um valor de entrada que o contrato não sustenta.
 */
const ESPACO_SEM_QUEBRA = String.fromCharCode(0x00a0);
const ESPACO_ESTREITO = String.fromCharCode(0x202f);

describe("reserva de 50%", () => {
  it("é exatamente metade do valor do filhote", () => {
    expect(RESERVA_FRACAO).toBe(0.5);
    expect(reservaDe(450000)).toBe(225000);
    expect(reservaDe(950000)).toBe(475000);
  });

  it("o texto publicado diz o valor, o percentual e de onde vem", () => {
    const texto = textoReserva(450000);
    expect(texto).toContain("R$ 2.250");
    expect(texto).toContain("50%");
    expect(texto).toContain("conforme contrato");
  });

  it("o preço no texto usa espaço comum, não U+00A0", () => {
    // Mesma armadilha do price-format-guard: Intl com style "currency" separa
    // "R$" do número com espaço sem quebra, e aí nenhuma checagem de texto
    // consegue ligar este valor ao que a tabela publica.
    for (const cents of Object.values(PRECO_POR_SLUG)) {
      expect(textoReserva(cents)).not.toContain(ESPACO_SEM_QUEBRA);
      expect(textoReserva(cents)).not.toContain(ESPACO_ESTREITO);
    }
  });
});

describe("preço com centavos", () => {
  it("escreve os centavos com dois dígitos", () => {
    expect(formatarPrecoComCentavos(450000)).toBe("R$ 4.500,00");
    expect(formatarPrecoComCentavos(650000)).toBe("R$ 6.500,00");
    expect(formatarPrecoComCentavos(216667)).toBe("R$ 2.166,67");
  });

  it("os dois pisos saem na forma pedida", () => {
    expect(textoAPartirDeNoPix(450000)).toBe("A partir de R$ 4.500,00 no PIX");
    expect(textoAPartirDeNoPix(650000)).toBe("A partir de R$ 6.500,00 no PIX");
  });
});

/**
 * A frase partida tem que continuar sendo a frase inteira.
 *
 * O card da vitrine deixou de escrever "A partir de R$ 4.500 no PIX" em um
 * span só: a referência visual de 05/11/2026 pede o número grande em ouro e o
 * resto pequeno em volta, então o texto sai em três partes
 * (partesDoPrecoNoPix) distribuídas em três elementos.
 *
 * O portão de smoke.spec.ts lê o textContent de cada <article> e cobra a forma
 * completa. Enquanto as partes forem as mesmas constantes do texto corrido,
 * juntá-las com um espaço devolve exatamente o que aquele portão procura — e é
 * isso que estes testes travam. Sem eles, alguém poderia mexer no prefixo de um
 * lado só e o conjunto continuaria compilando: quem reclamaria seria o e2e, no
 * fim da fila.
 */
describe("preço do card em três partes", () => {
  it("juntar as três partes com um espaço devolve a frase publicada", () => {
    for (const cents of Object.values(PRECO_POR_SLUG)) {
      const { prefixo, valor, sufixo } = partesDoPrecoNoPix(cents);
      expect([prefixo, valor, sufixo].join(" ")).toBe(textoAPartirDeNoPix(cents));
    }
  });

  it("as partes são as constantes do domínio, não cópias", () => {
    const partes = partesDoPrecoNoPix(450000);
    expect(partes.prefixo).toBe(PREFIXO_A_PARTIR_DE);
    expect(partes.sufixo).toBe(SUFIXO_NO_PIX);
    expect(partes.valor).toBe(formatarPrecoComCentavos(450000));
  });

  it("a forma publicada é a que o portão e2e procura", () => {
    // Mesma expressão de tests/e2e/smoke.spec.ts. Se o prefixo virar "A partir
    // de apenas" ou o sufixo virar "no Pix", quebra aqui e não no Playwright.
    const comoNoPortao = /A partir de R\$\s*[\d.]+,\d{2} no PIX/;
    for (const cents of Object.values(PRECO_POR_SLUG)) {
      const { prefixo, valor, sufixo } = partesDoPrecoNoPix(cents);
      expect([prefixo, valor, sufixo].join(" ")).toMatch(comoNoPortao);
    }
  });

  it("nenhuma parte carrega espaço sem quebra", () => {
    for (const cents of Object.values(PRECO_POR_SLUG)) {
      for (const parte of Object.values(partesDoPrecoNoPix(cents))) {
        expect(parte).not.toContain(ESPACO_SEM_QUEBRA);
        expect(parte).not.toContain(ESPACO_ESTREITO);
      }
    }
  });

  // /filhotes mostra o valor sem centavos, no desenho aprovado em 06/11/2026.
  it("o cartão de /filhotes monta a frase que o portão e2e procura", () => {
    for (const cents of Object.values(PRECO_POR_SLUG)) {
      const partes = partesDoPrecoDaVitrine(cents);
      expect([partes.prefixo, partes.valor, partes.sufixo].join(" ")).toMatch(/A partir de R\$\s*[\d.]+ no Pix/);
      for (const parte of Object.values(partes)) {
        expect(parte).not.toContain(ESPACO_SEM_QUEBRA);
        expect(parte).not.toContain(ESPACO_ESTREITO);
      }
    }
  });
});
