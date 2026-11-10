import { describe, expect, it } from "vitest";

import { generatedPosts } from "@/lib/_generated-posts";
import { AUTORES_DO_BLOG, autorDoBlog } from "@/lib/blog/autores";
import {
  BLOG_CATEGORIES,
  matchesCategory,
  rotuloDaCategoria,
} from "@/lib/blog/categories";
import {
  montarRelacionadosPorAssunto,
  RELACIONADOS_VISIVEIS,
} from "@/lib/blog/related-by-subject";
import { buildArticleJsonLd } from "@/lib/blog/seo";
import { getRelatedPosts } from "@/lib/content";

// Corre sobre os artigos reais: o defeito que isto impede só existe nos dados.
// Antes, o bloco de relacionados dava cerca de 30 links a 4 artigos e 0 a 20 dos 31.
const FORA_DA_VITRINE = "spitz-alemao-anao-wolf-sable";
const listaveis = generatedPosts.filter((p) => p.slug !== FORA_DA_VITRINE);

async function relacionadosDe(slug: string) {
  return (await getRelatedPosts(slug, RELACIONADOS_VISIVEIS)).map((p) => p.slug);
}

describe("relacionados por assunto", () => {
  it("todo artigo recebe 4 relacionados, sem repetir e sem apontar para si mesmo", async () => {
    for (const { slug } of generatedPosts) {
      const bloco = await relacionadosDe(slug);
      expect(bloco, slug).toHaveLength(RELACIONADOS_VISIVEIS);
      expect(new Set(bloco).size, slug).toBe(RELACIONADOS_VISIVEIS);
      expect(bloco, slug).not.toContain(slug);
    }
  });

  it("nenhum bloco aponta para o artigo que está fora da vitrine", async () => {
    for (const { slug } of generatedPosts) {
      expect(await relacionadosDe(slug), slug).not.toContain(FORA_DA_VITRINE);
    }
  });

  it("nenhum artigo listável fica órfão e nenhum concentra os links", async () => {
    const entrantes = new Map<string, number>(listaveis.map((p) => [p.slug, 0]));
    for (const { slug } of generatedPosts) {
      for (const alvo of await relacionadosDe(slug)) {
        entrantes.set(alvo, (entrantes.get(alvo) ?? 0) + 1);
      }
    }
    for (const [slug, total] of entrantes) {
      expect(total, slug).toBeGreaterThanOrEqual(1);
      expect(total, slug).toBeLessThanOrEqual(8);
    }
  });

  it("o resultado não depende da ordem dos artigos", () => {
    const artigos = generatedPosts.map((p) => ({
      slug: p.slug,
      category: p.category,
      tags: p.tags,
    }));
    const fora = new Set([FORA_DA_VITRINE]);
    const direto = montarRelacionadosPorAssunto(artigos, fora);
    const invertido = montarRelacionadosPorAssunto([...artigos].reverse(), fora);
    expect(invertido.get("spitz-alemao-anao-preco")).toEqual(direto.get("spitz-alemao-anao-preco"));
  });

  it.each([
    ["adestramento", "latido"],
    ["saude", "vacinas"],
    ["alimentacao", "cuidados"],
    ["qual-mais-cara", "preco"],
  ])("artigo sobre %s liga com artigo sobre %s", async (origem, esperado) => {
    const artigo = generatedPosts.find((p) => p.slug.includes(origem));
    expect(artigo, origem).toBeDefined();
    const bloco = await relacionadosDe(artigo!.slug);
    expect(bloco.some((s) => s.includes(esperado)), bloco.join(", ")).toBe(true);
  });
});

describe("categorias dos artigos", () => {
  const ids = BLOG_CATEGORIES.map((c) => c.id);

  it("todo artigo usa um id de categoria da lista", () => {
    for (const post of generatedPosts) {
      expect(ids, post.slug).toContain(post.category);
    }
  });

  it("todo artigo listável continua em ao menos uma seção de /blog", () => {
    for (const post of listaveis) {
      const secoes = BLOG_CATEGORIES.filter((c) => matchesCategory(post, c));
      expect(secoes.length, post.slug).toBeGreaterThan(0);
    }
  });

  it("o selo mostra o nome de leitura, não o id", () => {
    expect(rotuloDaCategoria("raca")).toBe("Raça");
    expect(rotuloDaCategoria("preco")).toBe("Preços");
    expect(rotuloDaCategoria("SAUDE")).toBe("Saúde");
    expect(rotuloDaCategoria("Texto livre do banco")).toBe("Texto livre do banco");
    expect(rotuloDaCategoria("  ")).toBeNull();
    expect(rotuloDaCategoria(null)).toBeNull();
  });
});

describe("autor no schema do artigo", () => {
  const post = { id: "x", slug: "x", title: "Título", category: "raca" };

  it("sem autor cadastrado, sai a empresa e nenhuma pessoa inventada", () => {
    const { article } = buildArticleJsonLd(post, null);
    expect(article.author).toMatchObject({ "@type": "LocalBusiness", name: "By Império Dog" });
    expect(article.articleSection).toBe("Raça");
  });

  it("com autor cadastrado, sai a pessoa", () => {
    const { article } = buildArticleJsonLd(post, { name: "Pessoa Real" } as never);
    expect(article.author).toMatchObject({ "@type": "Person", name: "Pessoa Real" });
    // Sem apresentação informada, nada é acrescentado à pessoa.
    expect(article.author).not.toHaveProperty("description");
    expect(article.author).not.toHaveProperty("worksFor");
  });

  it("quem assina o blog sai como pessoa da empresa, com a apresentação informada", () => {
    const karen = autorDoBlog("Karen Cristina");
    expect(karen).not.toBeNull();
    const { article } = buildArticleJsonLd(post, karen);
    expect(article.author).toMatchObject({
      "@type": "Person",
      name: "Karen Cristina",
      worksFor: { "@id": expect.stringMatching(/#business$/) },
    });
    const pessoa = article.author as { description?: string; url?: string };
    expect(pessoa.description).toContain("desde 2013");
    expect(pessoa.description).toContain("com amor e carinho");
    // Não existe página pública de autor, então não se anuncia endereço.
    expect(pessoa.url).toBeUndefined();
  });

  it("nome que não está no cadastro não vira pessoa", () => {
    expect(autorDoBlog("By Império Dog")).toBeNull();
    expect(autorDoBlog("Alguém de fora")).toBeNull();
    expect(autorDoBlog("")).toBeNull();
    expect(autorDoBlog(null)).toBeNull();
    expect(autorDoBlog("  karen cristina ")?.name).toBe("Karen Cristina");
  });

  it("todo artigo é assinado por um dos dois nomes, em alternância", () => {
    const nomes = AUTORES_DO_BLOG.map((a) => a.name);
    expect(nomes).toEqual(["Karen Cristina", "Arthur Ribeker"]);
    const contagem = new Map<string, number>();
    for (const p of generatedPosts) {
      expect(nomes, `autor de ${p.slug}`).toContain(p.author);
      contagem.set(p.author as string, (contagem.get(p.author as string) ?? 0) + 1);
    }
    const [a, b] = nomes.map((n) => contagem.get(n) ?? 0);
    expect(Math.abs(a - b)).toBeLessThanOrEqual(1);
  });
});
