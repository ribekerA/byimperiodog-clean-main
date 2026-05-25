// PATH: src/lib/blog/types.ts
// Tipos base unificados do módulo de Blog
// Evitam duplicidade entre Supabase / Contentlayer e padronizam integração com Admin.

export type BlogPostStatus = 'draft' | 'published' | 'scheduled';

type BlogAuthor = {
  id?: string;
  name: string;
  slug?: string;
  avatarUrl?: string | null;
};

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  coverUrl?: string | null;
  coverAlt?: string | null;
  content?: string | null; // MDX/HTML serializado ou blocks JSON
  excerpt?: string | null;
  tags?: string[];
  category?: string | null;
  status: BlogPostStatus;
  publishAt?: string | null; // ISO agendado
  updatedAt?: string | null;
  createdAt?: string | null;
  author?: BlogAuthor | null;
  readingTime?: number | null; // minutos estimados
  ogImageUrl?: string | null;
  relatedIds?: string[];
}

type EditorAIMode =
  | 'title'
  | 'subtitle'
  | 'outline'
  | 'section'
  | 'full'
  | 'tags'
  | 'meta'
  | 'altText'
  | 'coverIdea';

export interface EditorAIRequest {
  mode: EditorAIMode;
  topic?: string;
  tone?: string;
  audience?: string;
  keywords?: string[];
  currentText?: string;
  sectionHeading?: string;
  imageContext?: string;
  count?: number;
  locale?: string; // default pt-BR
  outlineStyle?: 'detailed' | 'bulleted'; // opcional para refinar respostas
  persona?: string; // persona textual adicional
}

export interface EditorAIResponse {
  ok: boolean;
  mode: EditorAIMode;
  suggestions?: string[];
  title?: string;
  subtitle?: string;
  outline?: { heading: string; children?: string[] }[];
  content?: string;
  tags?: string[];
  metaDescription?: string;
  altText?: string;
  coverPrompt?: string;
  error?: string;
}
