import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { renderWebStoryAmpHtml, type WebStoryData } from "@/lib/webStoryAmp";

interface WebStory extends WebStoryData {
  id: string;
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

  const ampHtml = renderWebStoryAmpHtml(
    story,
    process.env.NEXT_PUBLIC_SITE_URL || "https://byimperiodog.com.br"
  );

  return <div dangerouslySetInnerHTML={{ __html: ampHtml }} suppressHydrationWarning />;
}
