export function buildArticleLD(input: {
  title: string;
  description: string;
  url: string;
  datePublished?: string;
  dateModified?: string;
  authorName?: string;
  image?: string;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    url: input.url,
    datePublished: input.datePublished,
    dateModified: input.dateModified || input.datePublished,
    author: input.authorName
      ? {
          "@type": "Organization",
          name: input.authorName,
        }
      : undefined,
    image: input.image ? [input.image] : undefined,
  };
}
