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
