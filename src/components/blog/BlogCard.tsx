"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { BLOG_CARD_SIZES } from "@/lib/image-sizes";
import { BLUR_DATA_URL } from "@/lib/placeholders";
import { buildWhatsAppLink } from "@/lib/whatsapp";

type BlogCardPost = {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  cover_url?: string | null;
  cover_alt?: string | null;
  published_at?: string | null;
  content_mdx?: string | null;
};

type BlogCardProps = {
  post: BlogCardPost;
};

function formatDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function estimateMinutes(content?: string | null) {
  if (!content) return null;
  const words = content.split(/\s+/).filter(Boolean).length;
  if (!words) return null;
  return Math.max(1, Math.round(words / 180));
}

export default function BlogCard({ post }: BlogCardProps) {
  const articleHref = `/blog/${post.slug}`;
  const minutes = estimateMinutes(post.content_mdx ?? post.excerpt ?? "");
  const published = formatDate(post.published_at);

  const whatsappLink = buildWhatsAppLink({
    message: `Olá! Acabei de ler "${post.title}" e gostaria de receber orientação sobre Spitz Alemão Anão.`,
    utmSource: "site",
    utmMedium: "blog_card",
    utmCampaign: "blog_lead",
    utmContent: post.slug,
  });

  return (
    <article className="grid h-full grid-rows-[auto,1fr] overflow-hidden rounded-2xl border border-border bg-surface shadow-soft transition hover:-translate-y-1">
      <figure className="relative aspect-[4/3] w-full overflow-hidden bg-surface-subtle">
        {post.cover_url ? (
          <Image
            src={post.cover_url}
            alt={post.cover_alt || post.title}
            fill
            sizes={BLOG_CARD_SIZES}
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-xs font-semibold uppercase tracking-[0.3em] text-text-soft">
            Conteúdo evergreen
          </div>
        )}
      </figure>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <header className="space-y-2">
          <h3 className="line-clamp-2 text-lg font-semibold text-text">
            <Link href={articleHref} className="transition hover:text-brand">
              {post.title}
            </Link>
          </h3>
          {post.excerpt ? (
            <p className="line-clamp-3 text-sm leading-relaxed text-text-muted">{post.excerpt}</p>
          ) : null}
        </header>

        <div className="mt-auto space-y-3">
          <div className="flex items-center justify-between text-xs text-text-soft">
            <span>{published || "Atualizado recentemente"}</span>
            {minutes ? <span>{minutes} min</span> : null}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href={articleHref}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground shadow-sm transition hover:bg-brand-600"
            >
              Ler artigo
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              title="Tirar dúvidas sobre este artigo no WhatsApp"
            >
              <WhatsAppIcon className="h-4 w-4" aria-hidden />
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
