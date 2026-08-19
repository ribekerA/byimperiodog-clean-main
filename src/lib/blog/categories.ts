// PATH: src/lib/blog/categories.ts
// Definicao das categorias do blog e o filtro que /blog aplica.
//
// Isto morava dentro de app/(public)/blog/page.tsx. Saiu de la porque a
// listagem passou a filtrar no cliente (ver BlogFilterShell) e `match` era uma
// funcao: funcao nao atravessa a fronteira servidor/cliente como prop. Como
// modulo, os dois lados importam a mesma regra em vez de duplicar.

import { FOUNDING_YEAR } from "@/domain/config";

/** Forma minima que o filtro precisa — serializavel, sem `content_mdx`. */
export type BlogListPost = {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  cover_url?: string | null;
  cover_alt?: string | null;
  published_at?: string | null;
  updated_at?: string | null;
  category?: string | null;
  tags?: string[] | null;
  /** Calculado no servidor: evita mandar o corpo inteiro do artigo para o cliente. */
  reading_minutes?: number | null;
};

export type BlogCategory = {
  id: string;
  title: string;
  description: string;
  highlight: string;
  color: string;
  /** Trechos procurados em `category` e em `tags`, sem acento dos dois lados. */
  keywords: string[];
  cta: { label: string; href: string };
};

export const BLOG_CATEGORIES: BlogCategory[] = [
  {
    id: "comportamento",
    title: "Comportamento",
    description:
      "Socialização guiada, enriquecimento ambiental e reforço positivo focado em lares urbanos.",
    highlight: "Protocolos semanais com vídeos e check-ins pelo WhatsApp.",
    color: "bg-violet-50 border-violet-200 text-violet-700",
    keywords: ["adestramento", "comportamento", "socializacao", "tutor", "guia"],
    cta: { label: "Conhecer nosso processo", href: "/sobre#processo" },
  },
  {
    id: "saude",
    title: "Saúde",
    description:
      "Cuidado preventivo: sinais de alerta, rotina veterinária e saúde do Spitz no dia a dia.",
    highlight: "Transparência total com laudos digitais e acompanhamento pós-entrega.",
    color: "bg-emerald-50 border-emerald-200 text-emerald-700",
    keywords: ["saude", "clínico", "veterin", "check-up", "exame"],
    // /faq nunca existiu como rota: a pagina e /faq-do-tutor. O link respondia 404.
    cta: { label: "Entender exames", href: "/faq-do-tutor#faq-principais" },
  },
  {
    id: "preco",
    title: "Preços",
    description:
      "Respostas diretas sobre investimento, formas de pagamento e o que está incluído no valor.",
    highlight: "Conteúdo didático produzido com base nas dúvidas reais dos tutores.",
    color: "bg-amber-50 border-amber-200 text-amber-700",
    keywords: ["preco", "investimento", "valor", "custo"],
    cta: { label: "Ver preços", href: "/preco-spitz-anao" },
  },
  {
    id: "cuidados",
    title: "Cuidados",
    description:
      "Nutrição personalizada, higiene estratégica e protocolos preventivos para manter o Spitz saudável.",
    highlight: "Orientações da neonatologia ao primeiro ano com suporte contínuo.",
    color: "bg-blue-50 border-blue-200 text-blue-700",
    keywords: ["cuidado", "rotina", "nutri", "higiene", "enxoval"],
    cta: { label: "Ver dicas de cuidados", href: "/faq-do-tutor#primeiros-cuidados" },
  },
  {
    id: "raca",
    title: "Raça",
    description:
      "Tudo sobre o Spitz Alemão Anão (Lulu da Pomerânia): características, padrão e história da raça.",
    highlight: `Guias completos escritos pela criadora, que cria a raça desde ${FOUNDING_YEAR}.`,
    color: "bg-rose-50 border-rose-200 text-rose-700",
    keywords: ["raca", "spitz", "pomerani", "historico", "caracteristica"],
    cta: { label: "Conhecer a raça", href: "/spitz-alemao" },
  },
];

// Sem acento e por trecho, dos dois lados.
//
// A comparação de `category` era por trecho mas com acento, e a de `tags` era
// por igualdade exata: a tag "saúde" nunca batia com o termo "saude" da
// definição, e "lulu da pomerânia" nunca batia com "pomerani". O guia
// definitivo da raça ficava fora de todas as categorias e, por consequência,
// sem um único link interno no site inteiro.
const DIACRITICS = /[\u0300-\u036f]/g;

export function stripAccents(value: string) {
  return value.normalize("NFD").replace(DIACRITICS, "").toLowerCase();
}

export function matchesCategory(
  post: Pick<BlogListPost, "category" | "tags">,
  category: BlogCategory
) {
  const haystack = [post.category ?? "", ...((post.tags ?? []) as string[])].map(stripAccents);
  return category.keywords.some((keyword) => {
    const needle = stripAccents(keyword);
    return haystack.some((value) => value.includes(needle));
  });
}

/** Mesma precedência da versão que rodava no servidor: busca ganha da categoria. */
export function filterBlogPosts<T extends BlogListPost>(
  posts: T[],
  { q, categoria }: { q: string; categoria: string }
): T[] {
  const term = q.trim().toLowerCase();
  if (term) {
    return posts.filter((post) => {
      const target = `${post.title} ${post.excerpt ?? ""} ${post.category ?? ""}`.toLowerCase();
      return target.includes(term);
    });
  }
  if (categoria !== "todos") {
    const definition = BLOG_CATEGORIES.find((item) => item.id === categoria);
    return definition ? posts.filter((post) => matchesCategory(post, definition)) : posts;
  }
  return posts;
}
