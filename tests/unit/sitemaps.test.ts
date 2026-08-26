/**
 * @vitest-environment node
 */
import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { puppiesPublicados, staticPuppies } from "@/content/puppies-static";
import { GALLERY_VIDEOS, VIDEO_UPLOAD_DATE } from "@/domain/gallery-videos";
import { CORES_DIVULGADAS } from "@/domain/pricing";

/**
 * Os sitemaps são o único canal em que o site fala com o Google sem
 * intermediário. Um arquivo com URL 404 ou capa inexistente não é "um item a
 * menos": o Google reprova o sitemap inteiro e para de reler os itens bons.
 *
 * Por isso a checagem aqui é contra o DISCO, e não contra o manifesto de
 * dimensões — o manifesto é gerado no prebuild e poderia estar velho.
 */

const SITE = "https://byimperiodog.com.br";
const PUBLIC = path.join(process.cwd(), "public");

function arquivoExiste(urlOuCaminho: string): boolean {
  const relativo = urlOuCaminho.replace(SITE, "").split("?")[0];
  return existsSync(path.join(PUBLIC, decodeURIComponent(relativo)));
}

function todos(xml: string, expressao: RegExp): string[] {
  return [...xml.matchAll(expressao)].map((m) => m[1]);
}

describe("sitemap index", () => {
  it("declara os quatro sitemaps válidos e nada além deles", async () => {
    const { GET } = await import("../../app/sitemap-index.xml/route");
    const xml = await (await GET()).text();

    const locs = todos(xml, /<loc>([^<]+)<\/loc>/g);

    expect(locs).toEqual([
      `${SITE}/sitemap.xml`,
      `${SITE}/sitemaps/posts.xml`,
      `${SITE}/sitemaps/images.xml`,
      `${SITE}/sitemaps/videos.xml`,
    ]);
  });

  it("não ressuscita os sitemaps que apontavam para rotas inexistentes", () => {
    // /blog/tag, /autores, /categorias e /filhote/{id} nunca existiram como
    // rota. Os arquivos continuam no repositório, mas fora do índice: o que o
    // Google lê é este índice.
    const xmlPromessa = import("../../app/sitemap-index.xml/route").then(async ({ GET }) =>
      (await GET()).text()
    );

    return xmlPromessa.then((xml) => {
      for (const morto of ["authors", "tags", "categories", "puppies"]) {
        expect(xml).not.toContain(`/sitemaps/${morto}.xml`);
      }
    });
  });

  it("é XML bem formado e usa o host canônico em toda entrada", async () => {
    const { GET } = await import("../../app/sitemap-index.xml/route");
    const resposta = await GET();
    const xml = await resposta.text();

    expect(resposta.headers.get("Content-Type")).toContain("application/xml");
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain("<sitemapindex");
    expect(xml.trimEnd().endsWith("</sitemapindex>")).toBe(true);

    for (const loc of todos(xml, /<loc>([^<]+)<\/loc>/g)) {
      expect(loc.startsWith(`${SITE}/`)).toBe(true);
      expect(loc).not.toContain("www.");
    }
  });

  it("só declara <lastmod> quando existe data real por trás", async () => {
    const { GET } = await import("../../app/sitemap-index.xml/route");
    const xml = await (await GET()).text();

    // images.xml sai sem lastmod de propósito: não há data confiável para
    // "quando esta lista de imagens mudou", e data chutada é pior do que campo
    // ausente.
    const linhaDasImagens = xml
      .split("\n")
      .find((l) => l.includes("/sitemaps/images.xml"));
    expect(linhaDasImagens).not.toContain("<lastmod>");

    for (const data of todos(xml, /<lastmod>([^<]+)<\/lastmod>/g)) {
      expect(Number.isNaN(Date.parse(data))).toBe(false);
      expect(Date.parse(data)).toBeLessThanOrEqual(Date.now());
    }
  });
});

describe("sitemap de imagens", () => {
  it("não declara nenhuma imagem que não esteja no disco", async () => {
    const { GET } = await import("../../app/sitemaps/images.xml/route");
    const xml = await (await GET()).text();

    const imagens = todos(xml, /<image:loc>([^<]+)<\/image:loc>/g);
    expect(imagens.length).toBeGreaterThan(0);

    const ausentes = imagens.filter((url) => !arquivoExiste(url));
    expect(ausentes).toEqual([]);
  });

  it("declara cada imagem uma única vez, na página canônica dela", async () => {
    const { GET } = await import("../../app/sitemaps/images.xml/route");
    const xml = await (await GET()).text();

    const imagens = todos(xml, /<image:loc>([^<]+)<\/image:loc>/g);
    expect(imagens.length).toBe(new Set(imagens).size);
  });

  it("aponta apenas para páginas que existem", async () => {
    const { GET } = await import("../../app/sitemaps/images.xml/route");
    const xml = await (await GET()).text();

    const slugs = new Set(staticPuppies.map((p) => p.slug));
    for (const loc of todos(xml, /<loc>([^<]+)<\/loc>/g)) {
      const rota = loc.replace(SITE, "");
      if (rota === "/galeria") continue;
      const slug = rota.replace("/filhotes/", "");
      expect(slugs.has(slug)).toBe(true);
    }
  });

  it("não vaza ícone, logo nem fundo decorativo para o Google Imagens", async () => {
    const { GET } = await import("../../app/sitemaps/images.xml/route");
    const xml = await (await GET()).text();

    for (const url of todos(xml, /<image:loc>([^<]+)<\/image:loc>/g)) {
      expect(url).not.toMatch(/favicon|apple-touch|icon-\d|logo|og-image|placeholder/i);
    }
  });
});

describe("sitemap de vídeos", () => {
  it("dá a cada vídeo uma capa própria, e a capa existe no disco", async () => {
    const { GET } = await import("../../app/sitemaps/videos.xml/route");
    const xml = await (await GET()).text();

    const capas = todos(xml, /<video:thumbnail_loc>([^<]+)<\/video:thumbnail_loc>/g);
    expect(capas.length).toBe(GALLERY_VIDEOS.length);
    // Capa própria: nenhuma repetida entre os vídeos.
    expect(capas.length).toBe(new Set(capas).size);
    expect(capas.filter((url) => !arquivoExiste(url))).toEqual([]);
  });

  it("aponta para arquivos de vídeo que existem", async () => {
    const { GET } = await import("../../app/sitemaps/videos.xml/route");
    const xml = await (await GET()).text();

    const arquivos = todos(xml, /<video:content_loc>([^<]+)<\/video:content_loc>/g);
    expect(arquivos.length).toBeGreaterThan(0);
    expect(arquivos.filter((url) => !arquivoExiste(url))).toEqual([]);
  });

  // A asserção antiga era "um único valor, igual a VIDEO_UPLOAD_DATE" — que
  // era como se garantia, quando todos os vídeos herdavam a mesma constante,
  // que ninguém tinha trocado a data real pela data do build. Agora cada vídeo
  // declara a sua em gallery-videos.ts: herdar 2026-05-25 num arquivo que
  // entrou em agosto seria inventar data, exatamente o que este teste existe
  // para impedir. A regra não mudou, só passou a valer por vídeo — a data do
  // XML tem que ser a que o registro declara, e não a de hoje.
  it("usa a data real de entrada de cada vídeo, nunca a data do build", async () => {
    const { GET } = await import("../../app/sitemaps/videos.xml/route");
    const xml = await (await GET()).text();

    const datas = todos(xml, /<video:publication_date>([^<]+)<\/video:publication_date>/g);
    const declaradas = new Set(GALLERY_VIDEOS.map((v) => v.uploadDate));

    expect(datas.length).toBeGreaterThan(0);
    expect(datas.filter((d) => !declaradas.has(d))).toEqual([]);
    for (const data of new Set(datas)) {
      expect(data).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Date.parse(data)).toBeLessThanOrEqual(Date.now());
    }

    // O padrão de quem não declara data própria continua sendo o do primeiro
    // lote, conferido contra o git, e continua sendo usado por alguém.
    expect(VIDEO_UPLOAD_DATE).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Date.parse(VIDEO_UPLOAD_DATE)).toBeLessThanOrEqual(Date.now());
    expect(declaradas.has(VIDEO_UPLOAD_DATE)).toBe(true);
  });

  it("mantém a duração dentro do que o protocolo aceita", async () => {
    const { GET } = await import("../../app/sitemaps/videos.xml/route");
    const xml = await (await GET()).text();

    for (const bruto of todos(xml, /<video:duration>([^<]+)<\/video:duration>/g)) {
      const segundos = Number(bruto);
      expect(segundos).toBeGreaterThanOrEqual(1);
      expect(segundos).toBeLessThanOrEqual(28800);
    }
  });

  it("relaciona os vídeos com /galeria, que é onde eles são exibidos", async () => {
    const { GET } = await import("../../app/sitemaps/videos.xml/route");
    const xml = await (await GET()).text();

    expect(todos(xml, /<loc>([^<]+)<\/loc>/g)).toEqual([`${SITE}/galeria`]);
  });
});

describe("regressão comercial", () => {
  // A ordem importa: é a ordem em que a tabela de preços é apresentada, do
  // valor mais acessível ao mais caro. O Particolor entrou na frente porque
  // entrou por baixo do laranja, não por preferência editorial.
  it("mantém exatamente as cinco cores divulgadas", () => {
    expect([...CORES_DIVULGADAS]).toEqual([
      "particolor",
      "laranja",
      "creme",
      "preto",
      "branco",
    ]);
  });

  it("mantém o Cinza-Lobo fora das vitrines, sem quebrar a URL já indexada", () => {
    const cinzaLobo = staticPuppies.filter((p) => p.color === "wolf-sable");
    expect(cinzaLobo.length).toBeGreaterThan(0);

    // Fora de toda vitrine genérica…
    for (const filhote of cinzaLobo) {
      expect(puppiesPublicados.some((p) => p.slug === filhote.slug)).toBe(false);
      expect(CORES_DIVULGADAS).not.toContain(filhote.color);
    }

    // …mas a página específica continua existindo, senão uma URL que o Google
    // já conhece passaria a devolver 404.
    expect(staticPuppies.some((p) => p.color === "wolf-sable")).toBe(true);
  });
});
