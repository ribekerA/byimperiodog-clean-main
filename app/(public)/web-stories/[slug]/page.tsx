import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

interface WebStoryPage {
  id: string;
  type: "image" | "video";
  media_url: string;
  text?: string;
  duration?: number;
}

interface WebStory {
  id: string;
  title: string;
  slug: string;
  publisher: string;
  poster_url: string;
  logo_url: string;
  pages: WebStoryPage[];
  created_at: string;
  updated_at: string;
  status: string;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const supabase = supabaseAdmin();
  const { data: story } = await supabase
    .from("web_stories")
    .select("*")
    .eq("slug", params.slug)
    .eq("status", "published")
    .single();

  if (!story) {
    return {
      title: "Web Story não encontrada",
    };
  }

  return {
    title: story.title,
    description: `Web Story: ${story.title}`,
    openGraph: {
      title: story.title,
      images: [story.poster_url],
      type: "article",
    },
  };
}

async function getWebStory(slug: string): Promise<WebStory | null> {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("web_stories")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !data) return null;

  return data as WebStory;
}

export default async function WebStoryPage({
  params,
}: {
  params: { slug: string };
}) {
  const story = await getWebStory(params.slug);

  if (!story) {
    notFound();
  }

  const pages = story.pages as WebStoryPage[];

  // Generate AMP-valid HTML
  const ampHtml = `<!DOCTYPE html>
<html amp lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1" />
  <script async src="https://cdn.ampproject.org/v0.js"></script>
  <script async custom-element="amp-story" src="https://cdn.ampproject.org/v0/amp-story-1.0.js"></script>
  <script async custom-element="amp-video" src="https://cdn.ampproject.org/v0/amp-video-0.1.js"></script>
  <title>${story.title}</title>
  <link rel="canonical" href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://byimperiodogkennel.com'}/web-stories/${story.slug}" />
  <meta name="description" content="${story.title}" />
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
    title="${story.title}"
    publisher="${story.publisher}"
    publisher-logo-src="${story.logo_url}"
    poster-portrait-src="${story.poster_url}">
    ${pages
      .map(
        (page, index) => `
    <amp-story-page id="page-${index + 1}">
      <amp-story-grid-layer template="fill">
        ${
          page.type === "image"
            ? `<amp-img src="${page.media_url}" width="720" height="1280" layout="responsive" alt="${story.title} - Página ${index + 1}"></amp-img>`
            : `<amp-video autoplay loop width="720" height="1280" poster="${story.poster_url}" layout="responsive">
          <source src="${page.media_url}" type="video/mp4" />
        </amp-video>`
        }
      </amp-story-grid-layer>
      ${
        page.text
          ? `<amp-story-grid-layer template="vertical">
        <div class="story-text">
          <p>${page.text}</p>
        </div>
      </amp-story-grid-layer>`
          : ""
      }
    </amp-story-page>`
      )
      .join("")}
  </amp-story>
</body>
</html>`;

  return (
    <div
      dangerouslySetInnerHTML={{ __html: ampHtml }}
      suppressHydrationWarning
    />
  );
}
