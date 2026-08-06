/* eslint-disable import/order */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Root } from 'hast';
import { compile } from '@mdx-js/mdx';
import * as runtime from 'react/jsx-runtime';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypePrettyCode from 'rehype-pretty-code';
import { buildToc } from './toc';
import type { TocItem } from './toc';
import { VFile } from 'vfile';

export interface CompileResult {
  code: string; // ESM code string for evaluation via new Function
  toc: TocItem[];
  wordCount: number;
  readingTimeMinutes: number;
  firstImage?: string;
}

interface Options {
  syntaxTheme?: string;
}

function estimateReadingTime(words:number){
  return Math.max(1, Math.round(words/200));
}

export async function compileBlogMdx(source: string, opts: Options = {}): Promise<CompileResult> {
  const file = new VFile({ value: source });
  const result = await compile(file, {
    outputFormat: 'function-body',
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: 'wrap' }],
      // Tipagem relaxada devido diferenças entre versões de vfile / pretty-code
      [rehypePrettyCode as unknown as any, { theme: opts.syntaxTheme || 'github-dark' }],
      demoteBodyH1Plugin,
      collectTocPlugin
    ],
    jsx: true,
  });

  const data = (result as unknown as { data?: Record<string, unknown> }).data || {};
  const toc = (data.__toc as TocItem[] | undefined) || [];
  const words = countWords(source);
  return {
    code: String(result),
    toc,
    wordCount: words,
    readingTimeMinutes: estimateReadingTime(words),
    firstImage: data.__firstImage as string | undefined
  };
}

function countWords(src:string){
  return src.split(/\s+/).filter(Boolean).length;
}

/**
 * Rebaixa qualquer <h1> do corpo do artigo para <h2>.
 *
 * O template de /blog/[slug] já renderiza o título do post como o <h1> da
 * página. Quando o corpo em Markdown também começava com "# Título", o HTML
 * público saía com DOIS <h1> — o Google trata isso como estrutura ambígua e o
 * leitor de tela perde a referência de qual é o título da página.
 *
 * Roda antes do collectTocPlugin, então o sumário enxerga o heading já como h2.
 * Vale também para posts vindos do Supabase, que não passam por content/posts.
 */
export function demoteBodyH1Plugin() {
  return (tree: Root & { children: unknown[] }) => {
    const visit = (node: any) => {
      if (node?.type === 'element' && node.tagName === 'h1') node.tagName = 'h2';
      if (node?.children) node.children.forEach(visit);
    };
    visit(tree);
  };
}

// Rehype plugin para coletar TOC e primeira imagem
function collectTocPlugin() {
  return (tree: Root & { children: unknown[] }, file: { data: Record<string, unknown> }) => {
    try {
      const toc = buildToc(tree as unknown as any);
      file.data.__toc = toc;
      let firstImage: string | undefined;
      const visit = (node: any) => {
        if(!firstImage && node.type === 'element' && node.tagName === 'img' && (node as any).properties?.src) {
          firstImage = String((node as any).properties.src);
        }
        if((node as any).children) (node as any).children.forEach(visit);
      };
      visit(tree);
      file.data.__firstImage = firstImage;
    } catch {
      // falha silenciosa
    }
  };
}

// Utilidade para avaliar código resultante em runtime (edge-safe se evitar eval global)
export function evaluateMdx(code: string, components: Record<string, unknown> = {}) {
  // eslint-disable-next-line no-new-func
  const fn = new Function(String(code));
  return fn({ ...runtime, components });
}
