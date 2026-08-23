#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const phase = (process.argv[2] || "baseline").replace(/[^a-z0-9-]/gi, "-").toLowerCase();
const baseUrl = (process.env.MIGRATION_AUDIT_URL || "http://localhost:3000").replace(/\/$/, "");
const reportDir = path.resolve("reports", "migration-next16");
const sitemapPaths = ["/sitemap.xml", "/sitemap-index.xml", "/sitemaps/posts.xml"];

function decodeEntities(value) {
  return value
    ?.replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function attributes(tag) {
  const result = {};
  for (const match of tag.matchAll(/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
    result[match[1].toLowerCase()] = decodeEntities(match[2] ?? match[3] ?? "");
  }
  return result;
}

function metaContent(html, attribute, value) {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs = attributes(match[0]);
    if (attrs[attribute] === value) return attrs.content || null;
  }
  return null;
}

function linkHref(html, rel) {
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const attrs = attributes(match[0]);
    if ((attrs.rel || "").split(/\s+/).includes(rel)) return attrs.href || null;
  }
  return null;
}

function jsonLdTypes(html) {
  const types = new Set();
  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(decodeEntities(match[1]));
      const visit = (item) => {
        if (!item || typeof item !== "object") return;
        if (Array.isArray(item)) return item.forEach(visit);
        if (item["@type"]) {
          const values = Array.isArray(item["@type"]) ? item["@type"] : [item["@type"]];
          values.forEach((value) => types.add(String(value)));
        }
        if (item["@graph"]) visit(item["@graph"]);
      };
      visit(data);
    } catch {
      types.add("INVALID_JSON_LD");
    }
  }
  return [...types].sort();
}

function pageMetadata(html) {
  const title = decodeEntities(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim()) || null;
  const whatsappLinks = [...html.matchAll(/href=["']([^"']*(?:wa\.me|api\.whatsapp\.com)[^"']*)["']/gi)]
    .map((match) => decodeEntities(match[1]))
    .filter(Boolean);

  return {
    title,
    description: metaContent(html, "name", "description"),
    robots: metaContent(html, "name", "robots"),
    canonical: linkHref(html, "canonical"),
    openGraph: {
      title: metaContent(html, "property", "og:title"),
      description: metaContent(html, "property", "og:description"),
      url: metaContent(html, "property", "og:url"),
      image: metaContent(html, "property", "og:image"),
    },
    twitterCard: metaContent(html, "name", "twitter:card"),
    h1Count: (html.match(/<h1\b/gi) || []).length,
    jsonLdTypes: jsonLdTypes(html),
    whatsappLinks: [...new Set(whatsappLinks)].sort(),
  };
}

function localizeUrl(url) {
  const parsed = new URL(decodeEntities(url), baseUrl);
  return new URL(`${parsed.pathname}${parsed.search}`, `${baseUrl}/`).toString();
}

async function fetchText(url, redirect = "follow") {
  const startedAt = performance.now();
  try {
    const response = await fetch(url, {
      redirect,
      headers: { "user-agent": "Next16MigrationLocalAudit/1.0" },
    });
    const body = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      finalUrl: response.url,
      location: response.headers.get("location"),
      durationMs: Math.round(performance.now() - startedAt),
      body,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      finalUrl: url,
      durationMs: Math.round(performance.now() - startedAt),
      body: "",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

const sitemapDocuments = [];
const discovered = [];

for (const sitemapPath of sitemapPaths) {
  const result = await fetchText(`${baseUrl}${sitemapPath}`);
  const locations = [...result.body.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)].map((match) => decodeEntities(match[1].trim()));
  discovered.push(...locations.filter((location) => !new URL(location, baseUrl).pathname.endsWith(".xml")));
  sitemapDocuments.push({
    path: sitemapPath,
    status: result.status,
    durationMs: result.durationMs,
    locationCount: locations.length,
    error: result.error,
  });
}

const localizedUrls = discovered.map(localizeUrl);
const uniqueUrls = [...new Set(localizedUrls)].sort();
const pages = [];

for (let index = 0; index < uniqueUrls.length; index += 8) {
  const batch = uniqueUrls.slice(index, index + 8);
  const results = await Promise.all(batch.map((url) => fetchText(url)));
  results.forEach((result, offset) => {
    const requestedUrl = batch[offset];
    pages.push({
      path: new URL(requestedUrl).pathname,
      status: result.status,
      finalPath: new URL(result.finalUrl, baseUrl).pathname,
      durationMs: result.durationMs,
      error: result.error,
      ...pageMetadata(result.body),
    });
  });
}

const adminRedirects = {};
for (const adminPath of ["/admin", "/admin/dashboard", "/admin/login"]) {
  const result = await fetchText(`${baseUrl}${adminPath}`, "manual");
  adminRedirects[adminPath] = {
    status: result.status,
    location: result.status >= 300 && result.status < 400
      ? new URL(result.location || result.finalUrl, baseUrl).pathname
      : null,
  };
}

const report = {
  phase,
  generatedAt: new Date().toISOString(),
  baseUrl,
  sitemapDocuments,
  sitemap: {
    discoveredLocationCount: localizedUrls.length,
    uniquePageCount: uniqueUrls.length,
    duplicateCount: localizedUrls.length - uniqueUrls.length,
  },
  summary: {
    pageCount: pages.length,
    statusCounts: pages.reduce((counts, page) => {
      counts[page.status] = (counts[page.status] || 0) + 1;
      return counts;
    }, {}),
    missingTitle: pages.filter((page) => !page.title).map((page) => page.path),
    missingDescription: pages.filter((page) => !page.description).map((page) => page.path),
    missingCanonical: pages.filter((page) => !page.canonical).map((page) => page.path),
    invalidH1Count: pages.filter((page) => page.h1Count !== 1).map((page) => ({ path: page.path, count: page.h1Count })),
    invalidJsonLd: pages.filter((page) => page.jsonLdTypes.includes("INVALID_JSON_LD")).map((page) => page.path),
  },
  adminRedirects,
  pages,
};

await mkdir(reportDir, { recursive: true });
const outputPath = path.join(reportDir, `${phase}-seo-routes.json`);
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify({ outputPath, ...report.summary, sitemap: report.sitemap }, null, 2));
