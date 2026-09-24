import { describe, expect, it } from "vitest";

import { generatedPosts } from "@/lib/_generated-posts";
import { buildArticleJsonLd, buildBlogMetadata } from "@/lib/blog/seo";
import { editorialImage } from "@/lib/editorial-image";

describe("contrato automático de imagem editorial", () => {
  it("usa dimensões medidas e URL absoluta para a imagem original", () => {
    const image = editorialImage("/spitz-hero-desktop.webp", "Spitz", "https://byimperiodog.com.br/blog/exemplo")!;
    expect(image.url).toBe("https://byimperiodog.com.br/spitz-hero-desktop.webp");
    expect(image.width).toBe(1400);
    expect(image.height).toBe(933);
    expect(image.largeImage).toBe(true);
  });
  it("não inventa capa ou dimensões", () => {
    expect(editorialImage(null, "Artigo", "https://example.test")).toBeUndefined();
    expect(editorialImage("/nao-existe.jpg", "Artigo", "https://example.test")).toBeUndefined();
    expect(editorialImage("data:image/png;base64,invalid", "Artigo", "https://example.test")).toBeUndefined();
    expect(editorialImage("/favicon.ico", "Artigo", "https://example.test")).toBeUndefined();
    const remote = editorialImage("https://media.example.test/photo.jpg", "Artigo", "https://example.test")!;
    expect(remote.width).toBeUndefined();
    expect(remote.largeImage).toBeUndefined();
  });
  it("os 31 artigos mantêm a mesma capa em OG, Article e primaryImageOfPage", () => {
    expect(generatedPosts.length).toBe(31);
    for (const p of generatedPosts) {
      const post = { id: p.slug, slug: p.slug, title: p.title, cover_url: p.cover };
      const meta = buildBlogMetadata(post);
      const { article } = buildArticleJsonLd(post, null);
      const image = editorialImage(p.cover, p.title, meta.alternates.canonical)!;
      expect(image, p.slug).toBeDefined();
      expect(meta.openGraph.images[0].url).toBe(image.url);
      expect(article.image).toEqual([image.schema]);
      expect(article.mainEntityOfPage).toMatchObject({ primaryImageOfPage: image.schema });
    }
  });
});
