/**
 * Busca do site — a fonte unica que a rota /api/search e a pagina /search usam.
 *
 * Por que existe
 * -------------
 * O blog tem duas fontes: os 30 artigos de content/posts e as linhas de
 * `blog_posts`. A busca so enxergava a segunda, entao quem procurava "cores" ou
 * "vacinas" nao achava os artigos que o site de fato publica — e as unicas
 * linhas que o banco tinha a oferecer reprovam no portao editorial, ou seja, a
 * busca entregava link que respondia 404.
 *
 * A logica mora aqui, e nao dentro da rota, porque a pagina /search precisava
 * dela e estava buscando a propria API por HTTP com
 * `process.env.NEXT_PUBLIC_SITE_URL` na frente. Essa variavel nunca foi
 * definida — nem local, nem na Netlify — entao a URL saia relativa, o fetch de
 * servidor falhava e a pagina respondia "Erro ao buscar" para qualquer termo.
 * Chamando esta funcao direto, como a listagem de /blog ja faz com o
 * repositorio, some a variavel, some a ida e volta HTTP e some a falha.
 */
import { generatedPosts } from "@/lib/_generated-posts";
import { isPublishableSupabasePost } from "@/lib/blog/publishable";
import { supabaseAnon } from "@/lib/supabaseAnon";

export type ResultadoBusca = {
  id: string;
  slug: string;
  url: string;
  title: string;
  excerpt: string | null;
  cover_url: string | null;
  published_at: string | null;
};

/**
 * Compara sem caixa e sem acento. Quem digita "spitz alemao" no celular, sem o
 * til, esta procurando o mesmo artigo de quem digita "Spitz Alemao" com til.
 */
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * O corpus MDX chega como uniao dos 30 literais que gen-contentlayer emite, e o
 * TS colapsa essa uniao para `never` na primeira operacao de array. O tipo
 * abaixo descreve os campos que a busca usa — os 30 artigos tem todos eles.
 */
type ArtigoMdx = {
  slug: string;
  title: string;
  excerpt: string | null;
  description: string | null;
  cover: string | null;
  date: string | null;
  url: string;
};

/** Artigos de content/posts que casam com o termo — o corpus principal do blog. */
function buscarNoMdx(q: string): ResultadoBusca[] {
  const alvo = normalizar(q);

  return (generatedPosts as readonly ArtigoMdx[])
    .filter((p) => normalizar(`${p.title ?? ""} ${p.excerpt ?? p.description ?? ""}`).includes(alvo))
    .map((p) => ({
      id: p.slug,
      slug: p.slug,
      url: p.url ?? `/blog/${p.slug}`,
      title: p.title,
      excerpt: p.excerpt ?? p.description ?? null,
      cover_url: p.cover ?? null,
      published_at: p.date ?? null,
    }));
}

interface LinhaDoBanco {
  slug: string;
  title: string;
  excerpt?: string | null;
  seo_description?: string | null;
  content_mdx?: string | null;
  cover_url?: string | null;
  published_at?: string | null;
  status?: string | null;
}

/**
 * Linhas do banco que viram pagina de verdade.
 *
 * Devolve lista vazia — e nao erro — quando o Supabase nao responde. Entre
 * 08/06 e 20/08/2026 a producao apontou para um host inalcancavel e a busca
 * inteira morria por causa da metade que quase nunca tem resultado. Os 30
 * artigos nao precisam do banco para serem encontrados, e agora nao dependem
 * mesmo dele.
 */
async function buscarNoBanco(q: string, tag: string): Promise<ResultadoBusca[]> {
  try {
    const sb = supabaseAnon();
    const pattern = `%${q.replace(/%/g, "")}%`;

    let base = sb
      .from("blog_posts")
      // content_mdx, seo_description e status entram no SELECT porque o portao
      // editorial avalia esses campos — consulta estreita reprovaria por falta
      // de dado. Mesmo SELECT de /sitemaps/posts.xml, pela mesma razao.
      .select("id,slug,title,excerpt,seo_description,content_mdx,cover_url,published_at,status")
      .eq("status", "published")
      // Supabase aceita string expression no or()
      .or(`title.ilike.${pattern},excerpt.ilike.${pattern}`);

    if (tag) {
      const { data: tagsRows } = await sb.from("blog_tags").select("id,slug").eq("slug", tag).limit(1);
      const tagId = tagsRows?.[0]?.id;
      if (!tagId) return [];

      const { data: tagPosts } = await sb
        .from("blog_post_tags")
        .select("post_id,tag_id")
        .eq("tag_id", tagId)
        .limit(5000);
      const allowed = ((tagPosts || []) as { post_id: string; tag_id: string }[]).map((tp) => tp.post_id);
      if (!allowed.length) return [];

      base = base.in("id", allowed);
    }

    // Teto largo em vez de paginar no banco: o corte por pagina e feito depois
    // do portao e da fusao com o MDX, e paginar antes de filtrar devolveria
    // pagina curta sempre que um reprovado caisse dentro da janela.
    const { data, error } = await base.order("published_at", { ascending: false }).limit(500);
    if (error) return [];

    // `status=published` nao basta: ILIKE nao sabe medir artigo fino nem ver que
    // o texto e beco sem saida no grafo do site. A listagem de /blog, a rota
    // /blog/[slug] e os dois sitemaps ja passavam por isPublishableSupabasePost
    // e a busca nao — por isso ela oferecia link quebrado.
    return ((data || []) as LinhaDoBanco[])
      .filter((r) => isPublishableSupabasePost(r))
      .map((r) => ({
        id: r.slug,
        slug: r.slug,
        url: `/blog/${r.slug}`,
        title: r.title,
        excerpt: r.excerpt || r.seo_description || null,
        cover_url: r.cover_url || null,
        published_at: r.published_at || null,
      }));
  } catch {
    return [];
  }
}

export type OpcoesBusca = { limit?: number; offset?: number; tag?: string };

/**
 * Junta as duas fontes do jeito que /blog/[slug] e os dois sitemaps ja juntam:
 * o MDX vence slug repetido, porque e ele quem a rota serve.
 */
export async function buscarConteudo(
  termo: string,
  opts: OpcoesBusca = {}
): Promise<{ results: ResultadoBusca[]; total: number }> {
  const q = termo.trim().replace(/\s+/g, " ");
  if (q.length < 2) return { results: [], total: 0 };

  const limit = Math.min(Math.max(opts.limit || 10, 1), 50);
  const offset = Math.max(opts.offset || 0, 0);
  const tag = (opts.tag || "").trim();

  // `tag` filtra por blog_tags, que so existe no banco; o MDX guarda tag como
  // nome de exibicao, nao como slug. Enquanto for assim, busca com tag responde
  // so pela metade do banco — nenhuma tela do site usa esse parametro hoje.
  const doMdx = tag ? [] : buscarNoMdx(q);
  const doBanco = await buscarNoBanco(q, tag);

  const porSlug = new Map<string, ResultadoBusca>();
  for (const r of doMdx) porSlug.set(r.slug, r);
  for (const r of doBanco) if (!porSlug.has(r.slug)) porSlug.set(r.slug, r);

  const ordenados = [...porSlug.values()].sort(
    (a, b) => new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime()
  );

  return { results: ordenados.slice(offset, offset + limit), total: ordenados.length };
}
