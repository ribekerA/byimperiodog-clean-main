
import { readFileSync, readdirSync } from "node:fs";
import { extname, join, relative } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { OG_DEFAULT_IMAGE, pageMetadata, resolveRobots } from "@/lib/seo";
import { BUSINESS_ID, buildWebPageLD } from "@/lib/structured-data";

describe("pageMetadata helper", () => {
  it("generates basic metadata with canonical and OG defaults", () => {
    const meta = pageMetadata({
      title: "Test Page",
      description: "Test description",
      path: "/test",
    });

    expect(meta.title).toBe("Test Page");
    expect(meta.description).toBe("Test description");
    expect(meta.alternates?.canonical).toContain("/test");
    expect(meta.openGraph?.url).toContain("/test");
    expect(meta.openGraph?.type).toBe("website");
  });

  it("includes default OG image when none is provided", () => {
    const meta = pageMetadata({
      title: "FAQ",
      path: "/faq",
    });

    expect(meta.openGraph?.images).toBeDefined();
    expect(Array.isArray(meta.openGraph?.images)).toBe(true);
    const images = meta.openGraph?.images as Array<{
      url: string;
      alt?: string;
      width?: number;
      height?: number;
    }>;
    // Era `spitz-hero-desktop.webp`. Trocado de proposito em src/lib/seo.ts: o
    // arquivo tem 1400x933, entao as medidas declaradas mentiam, e WhatsApp e
    // Facebook tratam WebP de forma irregular na previa de link. O teste ficou
    // para tras e reprovava desde entao.
    expect(images[0]?.url).toContain("og-default.jpg");
    expect(images[0]?.alt).toContain("Lulu da Pomerânia");
    // As medidas fazem parte do contrato: e o que quebrou da ultima vez.
    expect(images[0]?.width).toBe(1200);
    expect(images[0]?.height).toBe(630);
  });

  it("accepts custom image objects", () => {
    const meta = pageMetadata({
      title: "Custom",
      path: "/custom",
      images: [{ url: "/custom.jpg", width: 800, height: 600, alt: "Custom image" }],
    });

    const images = meta.openGraph?.images as Array<{ url: string; alt?: string }>;
    expect(images[0]?.url).toBe("/custom.jpg");
    expect(images[0]?.alt).toBe("Custom image");
  });

  it("sets Twitter card metadata", () => {
    const meta = pageMetadata({
      title: "Twitter Test",
      description: "Twitter desc",
      path: "/twitter",
    });

    expect(meta.twitter?.card).toBe("summary_large_image");
    expect(meta.twitter?.title).toBe("Twitter Test");
    expect(meta.twitter?.description).toBe("Twitter desc");
  });
});

// As diretivas de exibicao ficam num lugar so. Antes nenhuma pagina declarava
// max-image-preview, entao o Google exibia miniatura pequena ao lado de todo
// resultado — num site cujo produto e a foto do filhote.
describe("resolveRobots", () => {
  const vercelAntes = process.env.VERCEL_ENV;

  beforeEach(() => {
    // NODE_ENV em teste e "test", que conta como preview. VERCEL_ENV tem
    // precedencia e e o que simula producao aqui.
    process.env.VERCEL_ENV = "production";
  });

  afterEach(() => {
    if (vercelAntes === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = vercelAntes;
  });

  it("aplica as diretivas de exibicao na pagina indexavel", () => {
    const robots = resolveRobots() as Record<string, unknown>;
    expect(robots.index).toBe(true);
    expect(robots.follow).toBe(true);
    expect(robots["max-image-preview"]).toBe("large");
    expect(robots["max-snippet"]).toBe(-1);
    expect(robots["max-video-preview"]).toBe(-1);
  });

  it("nao aplica diretiva de exibicao em pagina noindex", () => {
    const robots = resolveRobots({ index: false, follow: false }) as Record<string, unknown>;
    expect(robots.index).toBe(false);
    expect(robots["max-image-preview"]).toBeUndefined();
  });

  it("preserva o noindex do admin, do contrato e da busca interna", () => {
    for (const override of [{ index: false, follow: false }, { index: false }, { index: false, follow: true }]) {
      const robots = resolveRobots(override) as Record<string, unknown>;
      expect(robots.index).toBe(false);
    }
  });

  it("preview nunca e indexado, mesmo com override que pede index", () => {
    process.env.VERCEL_ENV = "preview";
    const robots = resolveRobots({ index: true, follow: true }) as Record<string, unknown>;
    expect(robots.index).toBe(false);
    expect(robots.follow).toBe(false);
  });

  it("respeita a forma string sem misturar com objeto", () => {
    expect(resolveRobots("noindex, nofollow")).toBe("noindex, nofollow");
  });

  it("pageMetadata leva as diretivas para a pagina", () => {
    const meta = pageMetadata({ title: "T", description: "D", path: "/t" });
    const robots = meta.robots as Record<string, unknown>;
    expect(robots["max-image-preview"]).toBe("large");
  });
});

// O rich result de FAQ foi encerrado pelo Google em 07/05/2026 para todos os
// sites — o markup continua valido em schema.org, mas nao rende mais nenhum
// resultado na busca. O projeto removeu FAQPage em 26/08/2026, de JSON-LD e de
// microdata, mantendo as perguntas visiveis. Este teste existe para que o
// markup nao volte por copiar-e-colar de uma pagina antiga.
const EXTENSOES_DE_CODIGO = new Set([".ts", ".tsx", ".js", ".jsx"]);

/** Todo arquivo de codigo sob `dir`, ignorando build e dependencias. */
function arquivosDeCodigo(dir: string): string[] {
  const saida: string[] = [];
  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    const caminho = join(dir, entrada.name);
    if (entrada.isDirectory()) {
      if (entrada.name === "node_modules" || entrada.name === ".next") continue;
      saida.push(...arquivosDeCodigo(caminho));
    } else if (EXTENSOES_DE_CODIGO.has(extname(entrada.name))) {
      saida.push(caminho);
    }
  }
  return saida;
}

describe("FAQPage nao volta ao codigo", () => {
  const raiz = process.cwd();
  const pastas = ["app", "src", "content"];

  it("nenhum arquivo de codigo emite FAQPage", () => {
    const culpados: string[] = [];
    for (const pasta of pastas) {
      for (const caminho of arquivosDeCodigo(join(raiz, pasta))) {
        const texto = readFileSync(caminho, "utf8");
        // So conta linha de codigo: os comentarios que registram a remocao
        // citam o termo de proposito e nao emitem nada.
        const acusa = texto
          .split(/\r?\n/)
          .some((linha) => /FAQPage/.test(linha) && !/^\s*(\/\/|\*|\/\*)/.test(linha));
        if (acusa) culpados.push(relative(raiz, caminho));
      }
    }
    expect(culpados).toEqual([]);
  });

  it("nenhum arquivo de codigo usa microdata de FAQ", () => {
    const culpados: string[] = [];
    for (const pasta of pastas) {
      for (const caminho of arquivosDeCodigo(join(raiz, pasta))) {
        const texto = readFileSync(caminho, "utf8");
        if (/itemProp="(mainEntity|acceptedAnswer)"/.test(texto)) {
          culpados.push(relative(raiz, caminho));
        }
      }
    }
    expect(culpados).toEqual([]);
  });
});

describe("LastUpdated date formatting (sanity)", () => {
  it("formats ISO date to pt-BR", () => {
    const formatted = new Date("2025-10-25").toLocaleDateString("pt-BR");
    expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it("handles invalid dates gracefully", () => {
    const invalid = new Date("not-a-date");
    expect(Number.isNaN(invalid.getTime())).toBe(true);
  });

  it("formats today without throwing", () => {
    const today = new Date();
    const formatted = today.toLocaleDateString("pt-BR");
    expect(formatted).toBeTypeOf("string");
  });
});

describe("buildWebPageLD", () => {
  it("declara a imagem principal da pagina", () => {
    const ld = buildWebPageLD({ path: "/sobre", name: "Sobre" }) as Record<string, any>;

    expect(ld["@type"]).toBe("WebPage");
    expect(ld["@id"]).toMatch(/\/sobre#webpage$/);
    expect(ld.primaryImageOfPage).toBeTruthy();
    expect(ld.primaryImageOfPage["@type"]).toBe("ImageObject");
    expect(ld.primaryImageOfPage.url).toMatch(/^https?:\/\//);
  });

  it("por padrao a imagem principal e a mesma do og:image", () => {
    const ld = buildWebPageLD({ path: "/sobre", name: "Sobre" }) as Record<string, any>;

    expect(ld.primaryImageOfPage.url).toContain(OG_DEFAULT_IMAGE.url);
    expect(ld.primaryImageOfPage.width).toBe(OG_DEFAULT_IMAGE.width);
    expect(ld.primaryImageOfPage.height).toBe(OG_DEFAULT_IMAGE.height);
  });

  it("aceita imagem propria com as medidas reais", () => {
    const ld = buildWebPageLD({
      path: "/filhotes/sao-paulo",
      name: "SP",
      image: "/spitz-hero-desktop.webp",
      imageWidth: 1400,
      imageHeight: 933,
    }) as Record<string, any>;

    expect(ld.primaryImageOfPage.url).toContain("/spitz-hero-desktop.webp");
    expect(ld.primaryImageOfPage.width).toBe(1400);
    expect(ld.primaryImageOfPage.height).toBe(933);
  });

  it("nao inventa medida quando ela nao foi informada", () => {
    const ld = buildWebPageLD({ path: "/x", name: "X", image: "/qualquer.webp" }) as Record<string, any>;

    expect(ld.primaryImageOfPage.width).toBeUndefined();
    expect(ld.primaryImageOfPage.height).toBeUndefined();
  });

  it("aponta para o no unico da empresa em vez de repetir os dados dela", () => {
    const ld = buildWebPageLD({ path: "/sobre", name: "Sobre" }) as Record<string, any>;

    expect(ld.about).toEqual({ "@id": BUSINESS_ID });
    expect(ld.inLanguage).toBe("pt-BR");
  });
});

describe("nenhuma pagina monta WebPage a mao", () => {
  it("todo WebPage publico sai de buildWebPageLD", () => {
    const raiz = process.cwd();
    const permitidos = new Set([
      // O unico lugar autorizado a construir o objeto.
      "src/lib/structured-data.ts",
      // `mainEntityOfPage` do Article: referencia, nao um no WebPage proprio.
      "src/lib/blog/seo.ts",
    ]);

    const culpados: string[] = [];
    for (const pasta of ["app", "src"]) {
      for (const arquivo of arquivosDeCodigo(join(raiz, pasta))) {
        const rel = relative(raiz, arquivo).split("\\").join("/");
        if (permitidos.has(rel)) continue;
        const texto = readFileSync(arquivo, "utf8");
        if (/["']@type["']\s*:\s*["']WebPage["']/.test(texto)) culpados.push(rel);
      }
    }

    expect(culpados).toEqual([]);
  });
});
