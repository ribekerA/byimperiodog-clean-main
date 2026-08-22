import { z } from "zod";

import { escapeHtml } from "@/lib/contentSecurity";

export interface WebStoryPageData {
  id?: string;
  type: "image" | "video";
  media_url: string;
  text?: string;
  duration?: number;
}

export interface WebStoryData {
  title: string;
  slug: string;
  publisher: string;
  poster_url: string;
  logo_url: string;
  pages: WebStoryPageData[];
}

export function sanitizeWebStoryUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  if (
    !trimmed ||
    trimmed.length > 2_048 ||
    /[\u0000-\u0020\u007f"'<>]/.test(trimmed)
  ) {
    return undefined;
  }

  if (trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.includes("\\")) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? trimmed : undefined;
  } catch {
    return undefined;
  }
}

const assetUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(2_048)
  .refine((value) => Boolean(sanitizeWebStoryUrl(value)), "URL de mídia inválida");

const webStoryPageSchema = z.object({
  id: z.string().trim().max(100).optional(),
  type: z.enum(["image", "video"]),
  media_url: assetUrlSchema,
  text: z.string().trim().max(280).optional(),
  duration: z.number().int().min(1).max(20).optional(),
});

export const webStoryInputSchema = z.object({
  title: z.string().trim().min(1).max(70),
  slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  publisher: z.string().trim().min(1).max(100),
  poster_url: assetUrlSchema,
  logo_url: assetUrlSchema,
  status: z.enum(["draft", "published"]).default("draft"),
  pages: z.array(webStoryPageSchema).max(50).default([]),
});

function canonicalStoryUrl(siteUrl: string, slug: string) {
  const fallback = "https://byimperiodog.com.br";
  const safeSiteUrl = sanitizeWebStoryUrl(siteUrl);
  const base = safeSiteUrl && /^https?:\/\//i.test(safeSiteUrl) ? safeSiteUrl : fallback;

  try {
    return new URL(`/web-stories/${encodeURIComponent(slug)}`, base).toString();
  } catch {
    return `${fallback}/web-stories/${encodeURIComponent(slug)}`;
  }
}

/** Generates the trusted AMP shell while escaping every database-backed field. */
export function renderWebStoryAmpHtml(story: WebStoryData, siteUrl: string): string {
  const title = escapeHtml(story.title);
  const publisher = escapeHtml(story.publisher);
  const posterUrl = escapeHtml(sanitizeWebStoryUrl(story.poster_url) ?? "");
  const logoUrl = escapeHtml(sanitizeWebStoryUrl(story.logo_url) ?? "");
  const canonicalUrl = escapeHtml(canonicalStoryUrl(siteUrl, String(story.slug ?? "")));
  const pages = Array.isArray(story.pages) ? story.pages : [];

  const pageHtml = pages
    .flatMap((page, index) => {
      if (!page || (page.type !== "image" && page.type !== "video")) return [];

      const mediaUrl = sanitizeWebStoryUrl(page.media_url);
      if (!mediaUrl) return [];

      const media = escapeHtml(mediaUrl);
      const alt = escapeHtml(`${story.title} - Página ${index + 1}`);
      const mediaHtml =
        page.type === "image"
          ? `<amp-img src="${media}" width="720" height="1280" layout="responsive" alt="${alt}"></amp-img>`
          : `<amp-video autoplay loop width="720" height="1280" poster="${posterUrl}" layout="responsive">
          <source src="${media}" type="video/mp4" />
        </amp-video>`;
      const textHtml = page.text
        ? `<amp-story-grid-layer template="vertical">
        <div class="story-text">
          <p>${escapeHtml(page.text)}</p>
        </div>
      </amp-story-grid-layer>`
        : "";

      return [`
    <amp-story-page id="page-${index + 1}">
      <amp-story-grid-layer template="fill">
        ${mediaHtml}
      </amp-story-grid-layer>
      ${textHtml}
    </amp-story-page>`];
    })
    .join("");

  return `<!DOCTYPE html>
<html amp lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1" />
  <script async src="https://cdn.ampproject.org/v0.js"></script>
  <script async custom-element="amp-story" src="https://cdn.ampproject.org/v0/amp-story-1.0.js"></script>
  <script async custom-element="amp-video" src="https://cdn.ampproject.org/v0/amp-video-0.1.js"></script>
  <title>${title}</title>
  <link rel="canonical" href="${canonicalUrl}" />
  <meta name="description" content="${title}" />
  <style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
  <style amp-custom>
    amp-story {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
    }
    amp-story-page {
      background-color: #fff;
    }
    .story-text {
      position: absolute;
      bottom: 10%;
      left: 5%;
      right: 5%;
      padding: 1.5em;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      border-radius: 12px;
      font-size: 1.1em;
      line-height: 1.5;
      text-align: center;
    }
  </style>
</head>
<body>
  <amp-story
    standalone
    title="${title}"
    publisher="${publisher}"
    publisher-logo-src="${logoUrl}"
    poster-portrait-src="${posterUrl}">
    ${pageHtml}
  </amp-story>
</body>
</html>`;
}
