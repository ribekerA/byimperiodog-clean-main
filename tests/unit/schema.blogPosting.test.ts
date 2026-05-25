import { describe, expect, it } from "vitest";

import { blogPostingSchema } from "@/lib/schema";

describe("blogPostingSchema", () => {
  it("gera estrutura basica para BlogPosting", () => {
    const schema = blogPostingSchema("https://example.com", {
      slug: "post-exemplo",
      title: "Post de exemplo",
      description: "Descricao teste",
      publishedAt: "2024-09-30T08:00:00.000Z",
      image: { url: "https://example.com/cover.jpg" },
      author: { name: "Equipe" },
      keywords: ["spitz", "guia"],
      articleSection: "Guia do Tutor",
    });

    expect(schema["@type"]).toBe("BlogPosting");
    expect(schema.headline).toBe("Post de exemplo");
    expect(schema.image).toEqual(["https://example.com/cover.jpg"]);
    expect(schema.author).toEqual({
      "@type": "Person",
      name: "Equipe",
      url: undefined,
    });
    expect(schema.articleSection).toBe("Guia do Tutor");
    expect(schema.keywords).toEqual(["spitz", "guia"]);
  });
});
