import { NextResponse } from "next/server";

export const revalidate = 300; // 5 min

const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br").replace(/\/$/, "");

function xmlEscape(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function GET() {
  const now = new Date().toISOString();
  // Lista consolidada dos sitemaps existentes no app
  const sitemaps = [
    `${site}/sitemap.xml`,
    `${site}/blog/sitemap.xml`,
    `${site}/sitemaps/posts.xml`,
    `${site}/sitemaps/tags.xml`,
    `${site}/sitemaps/authors.xml`,
    `${site}/sitemaps/categories.xml`,
    `${site}/sitemaps/puppies.xml`,
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemaps
    .map((loc) => `  <sitemap><loc>${xmlEscape(loc)}</loc><lastmod>${now}</lastmod></sitemap>`) 
    .join("\n")
  }\n</sitemapindex>`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
    },
  });
}
