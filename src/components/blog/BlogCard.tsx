// Server component de proposito. Card de artigo: imagem, texto e links. Nao ha interacao em JS, so hover em CSS.

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { BLUR_DATA_URL } from "@/lib/placeholders";
import { buildWhatsAppLink } from "@/lib/whatsapp";

// ─── Types ────────────────────────────────────────────────────────────────────

type BlogCardPost = {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  cover_url?: string | null;
  cover_alt?: string | null;
  published_at?: string | null;
  content_mdx?: string | null;
  category?: string | null;
  tags?: string[] | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  comportamento: { bg: "bg-violet-50",  text: "text-violet-700"  },
  saude:         { bg: "bg-emerald-50", text: "text-emerald-700" },
  preco:         { bg: "bg-amber-50",   text: "text-amber-700"   },
  cuidados:      { bg: "bg-sky-50",     text: "text-sky-700"     },
  raca:          { bg: "bg-rose-50",    text: "text-rose-700"    },
};

const CATEGORY_LABELS: Record<string, string> = {
  comportamento: "Comportamento",
  saude:         "Saúde",
  preco:         "Preços",
  cuidados:      "Cuidados",
  raca:          "Raça",
};

function formatDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

function estimateMinutes(content?: string | null) {
  if (!content) return null;
  const words = content.split(/\s+/).filter(Boolean).length;
  return words < 50 ? null : Math.max(1, Math.round(words / 180));
}

function deriveCategory(post: BlogCardPost): string | null {
  if (post.category) return post.category.toLowerCase();
  const tags = (post.tags ?? []).map((t) => t.toLowerCase());
  for (const key of Object.keys(CATEGORY_COLORS)) {
    if (tags.some((t) => t.includes(key))) return key;
  }
  return null;
}

// ─── Placeholder image ────────────────────────────────────────────────────────

function CoverPlaceholder({ category }: { category: string | null }) {
  const c = category ? CATEGORY_COLORS[category] : null;
  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center gap-2 ${
        c ? `${c.bg}` : "bg-emerald-50"
      }`}
      aria-hidden
    >
      <span className="text-4xl opacity-40">🐾</span>
    </div>
  );
}

// ─── Featured variant ─────────────────────────────────────────────────────────

export function FeaturedBlogCard({ post }: { post: BlogCardPost }) {
  const href      = `/blog/${post.slug}`;
  const minutes   = estimateMinutes(post.content_mdx ?? post.excerpt ?? "");
  const published = formatDate(post.published_at);
  const category  = deriveCategory(post);
  const cat       = category ? (CATEGORY_COLORS[category] ?? CATEGORY_COLORS.saude) : null;
  const catLabel  = category ? (CATEGORY_LABELS[category] ?? category) : null;

  const waLink = buildWhatsAppLink({
    message:    `Olá! Acabei de ler "${post.title}" e quero saber mais sobre o Spitz Alemão Anão (Lulu da Pomerânia).`,
    utmSource:  "site", utmMedium: "blog_featured", utmCampaign: "blog_lead", utmContent: post.slug,
  });

  return (
    <article className="group grid overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-sm transition-shadow hover:shadow-md sm:grid-cols-[1fr_auto]">
      {/* Content */}
      <div className="flex flex-col justify-between gap-5 p-6 sm:p-8">
        <div className="space-y-3">
          {catLabel && cat && (
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${cat.bg} ${cat.text}`}>
              {catLabel}
            </span>
          )}
          <h2 className="text-xl font-bold leading-snug tracking-tight text-zinc-900 sm:text-2xl">
            <Link href={href} className="transition hover:text-emerald-700">
              {post.title}
            </Link>
          </h2>
          {post.excerpt && (
            <p className="line-clamp-3 text-sm leading-relaxed text-zinc-500">{post.excerpt}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            {published && <span>{published}</span>}
            {minutes   && <><span aria-hidden>·</span><span>{minutes} min</span></>}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <a href={waLink} target="_blank" rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100">
              <WhatsAppIcon className="h-3.5 w-3.5" aria-hidden />
              Tirar dúvida
            </a>
            <Link href={href}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-700">
              Ler artigo <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </div>
      </div>

      {/* Image — fixed 16/10 ratio prevents CLS */}
      <div className="relative w-full overflow-hidden sm:w-72 sm:shrink-0">
        <div className="relative aspect-[16/10] w-full sm:h-full sm:aspect-auto">
          {post.cover_url ? (
            <Image
              src={post.cover_url}
              alt={post.cover_alt || post.title}
              fill
              priority
              fetchPriority="high"
              sizes="(max-width: 640px) 100vw, 288px"
              className="object-cover object-center transition duration-500 group-hover:scale-[1.03]"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
            />
          ) : (
            <CoverPlaceholder category={category} />
          )}
          <span className="absolute left-3 top-3 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm">
            ✨ Destaque
          </span>
        </div>
      </div>
    </article>
  );
}

// ─── Default card ─────────────────────────────────────────────────────────────

export default function BlogCard({ post }: { post: BlogCardPost }) {
  const href      = `/blog/${post.slug}`;
  const minutes   = estimateMinutes(post.content_mdx ?? post.excerpt ?? "");
  const published = formatDate(post.published_at);
  const category  = deriveCategory(post);
  const cat       = category ? (CATEGORY_COLORS[category] ?? CATEGORY_COLORS.saude) : null;
  const catLabel  = category ? (CATEGORY_LABELS[category] ?? category) : null;

  const waLink = buildWhatsAppLink({
    message:    `Olá! Acabei de ler "${post.title}" e quero saber mais sobre o Spitz Alemão Anão (Lulu da Pomerânia).`,
    utmSource:  "site", utmMedium: "blog_card", utmCampaign: "blog_lead", utmContent: post.slug,
  });

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      {/* Image — fixed aspect prevents CLS and misaligned grids */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-emerald-50 shrink-0">
        {post.cover_url ? (
          <Image
            src={post.cover_url}
            alt={post.cover_alt || post.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover object-center transition duration-500 group-hover:scale-[1.03]"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <CoverPlaceholder category={category} />
        )}
        {catLabel && cat && (
          <span className={`absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-sm ${cat.bg} ${cat.text}`}>
            {catLabel}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        {/* Date + reading time */}
        <div className="flex items-center gap-2 text-[11px] text-zinc-400">
          {published && <span>{published}</span>}
          {minutes   && <><span aria-hidden>·</span><span>{minutes} min de leitura</span></>}
        </div>

        {/* Title */}
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-zinc-900 sm:text-base">
          <Link href={href} className="transition hover:text-emerald-700">
            {post.title}
          </Link>
        </h3>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="line-clamp-2 text-xs leading-relaxed text-zinc-500">{post.excerpt}</p>
        )}

        {/* CTAs */}
        <div className="mt-auto flex gap-2 pt-1">
          <Link href={href}
            className="flex flex-1 min-h-[44px] items-center justify-center gap-1 rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700">
            Ler artigo <ArrowRight className="h-3 w-3" aria-hidden />
          </Link>
          <a href={waLink} target="_blank" rel="noopener noreferrer"
            title="Tirar dúvidas pelo WhatsApp"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-700"
            aria-label="Tirar dúvida pelo WhatsApp">
            <WhatsAppIcon className="h-4 w-4" aria-hidden />
          </a>
        </div>
      </div>
    </article>
  );
}
