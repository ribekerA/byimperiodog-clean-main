import type { JSX } from "react";
export type BlogPost = {
  slug: string;
  title: string;
  subtitle?: string | null;
  excerpt?: string | null;
  coverUrl?: string | null;
  coverAlt?: string | null;
  publishedAt: string; // ISO date
  updatedAt?: string | null; // ISO date
  author?: { name: string } | null;
  category?: string | null;
  // Content rendered as React component to avoid extra deps
  Content: () => JSX.Element;
  tags?: string[];
  seo?: { title?: string; description?: string; ogImage?: string };
};

import { posts } from "../../content/blog/posts";

export function getAllPosts(): BlogPost[] {
  // Already ordered newest first in source; sort defensively
  return [...posts].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return getAllPosts().find((p) => p.slug === slug);
}

export function getAllSlugs(): string[] {
  return getAllPosts().map((p) => p.slug);
}
