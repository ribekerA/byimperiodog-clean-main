import { defineDocumentType, makeSource } from '@contentlayer/source-files';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import remarkGfm from 'remark-gfm';
// @ts-ignore - tipos conflitantes de vfile entre dependências
import rehypePrettyCode from 'rehype-pretty-code';

// Observação: os resolvers de computedFields usam cast interno para compatibilidade de tipos do Contentlayer.

export const Post = defineDocumentType(() => ({
  name: 'Post',
  filePathPattern: `posts/**/*.mdx`,
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    description: { type: 'string', required: true },
    date: { type: 'date', required: true },
    updated: { type: 'date', required: false },
    cover: { type: 'string', required: false },
    tags: { type: 'list', of: { type: 'string' }, required: false },
    category: { type: 'string', required: false },
    author: { type: 'string', required: false },
  },
  computedFields: {
  slug: { type: 'string', resolve: (doc) => (doc as any)._raw.sourceFileName.replace(/\.mdx$/, '') },
  url: { type: 'string', resolve: (doc) => `/blog/${(doc as any)._raw.sourceFileName.replace(/\.mdx$/, '')}` },
  readingTime: { type:'number', resolve: (doc)=> {
    const text = ((doc as any).body?.raw || '') as string;
        const words = text.split(/\s+/).filter(Boolean).length;
        return Math.max(1, Math.round(words/200));
      }
    }
  },
}));

export default makeSource({
  contentDirPath: 'content',
  // Disable noisy warning about path alias when TS paths are not configured
  disableImportAliasWarning: true,
  documentTypes: [Post],
  mdx: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: 'wrap' }],
  // Wrapper para evitar erro de tipo entre múltiplas versões de vfile
  [rehypePrettyCode as any, { theme: 'github-dark' }],
    ],
  },
});
