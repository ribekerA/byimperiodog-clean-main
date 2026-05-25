import { describe, expect, it } from "vitest";

import { faqPageSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";

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
    const images = meta.openGraph?.images as Array<{ url: string; alt?: string }>;
    expect(images[0]?.url).toContain("spitz-hero-desktop.webp");
    expect(images[0]?.alt).toContain("Lulu da Pomerânia");
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

describe("faqPageSchema helper", () => {
  it("generates FAQPage JSON-LD", () => {
    const faqs = [
      { question: "What is this?", answer: "This is a test." },
      { question: "How does it work?", answer: "It works like this." },
    ];
    const schema = faqPageSchema(faqs, "https://example.com/faq");

    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("FAQPage");
    expect(schema.mainEntity).toHaveLength(2);
    expect(schema.mainEntity[0]["@type"]).toBe("Question");
    expect(schema.mainEntity[0].name).toBe("What is this?");
    expect(schema.mainEntity[0].acceptedAnswer["@type"]).toBe("Answer");
    expect(schema.mainEntity[0].acceptedAnswer.text).toBe("This is a test.");
  });

  it("handles empty FAQ arrays", () => {
    const schema = faqPageSchema([], "https://example.com/faq");
    expect(schema.mainEntity).toHaveLength(0);
  });

  it("includes canonical URL in schema", () => {
    const schema = faqPageSchema(
      [{ question: "Q1", answer: "A1" }],
      "https://example.com/custom-faq"
    );
    expect(schema.url).toBe("https://example.com/custom-faq");
  });

  it("keeps special characters in Q&A", () => {
    const schema = faqPageSchema(
      [{ question: 'What is "special"?', answer: "It's <special>." }],
      "https://example.com/faq"
    );
    expect(schema.mainEntity[0].name).toContain('"special"');
    expect(schema.mainEntity[0].acceptedAnswer.text).toContain("<special>");
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
