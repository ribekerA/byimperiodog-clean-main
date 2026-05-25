'use client';

import { useEffect } from 'react';

/**
 * SeoHead - Componente cliente para injetar tags SEO dinamicamente
 * 
 * Use em situações onde metadata estática não for suficiente.
 * Em caso normal, use a exportação de `metadata` em layout.tsx ou page.tsx.
 * 
 * @example
 * 'use client';
 * import { SeoHead } from '@/components/SeoHead';
 * 
 * export default function MyPage() {
 *   return (
 *     <>
 *       <SeoHead 
 *         canonical="https://www.canilspitzalemao.com.br/minha-pagina"
 *         title="Mra Página | By Imperio Dog"
 *         description="Descrição da minha página"
 *       />
 *       <div>Conteúdo</div>
 *     </>
 *   );
 * }
 */
export interface SeoHeadProps {
  /** URL canônica da página (essencial para SEO) */
  canonical?: string;
  
  /** Título da página (se não usar metadata de Next.js) */
  title?: string;
  
  /** Descrição meta (if not using Next.js metadata) */
  description?: string;
  
  /** robots meta tag (index, follow, noindex, nofollow, etc) */
  robots?: string;
  
  /** Palavras-chave (comma-separated) */
  keywords?: string;
  
  /** URL da imagem para Open Graph / Twitter Card */
  ogImage?: string;
  
  /** Tipo de página (website, article, etc) */
  ogType?: string;
  
  /** URL da página para OG (se diferente de canonical) */
  ogUrl?: string;
}

export function SeoHead({
  canonical,
  title,
  description,
  robots,
  keywords,
  ogImage,
  ogType = 'website',
  ogUrl,
}: SeoHeadProps) {
  useEffect(() => {
    // Injetar canonical tag
    if (canonical) {
      let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      link.href = canonical;
    }

    // Atualizar title
    if (title) {
      document.title = title;
    }

    // Atualizar description meta
    if (description) {
      let metaDesc = document.querySelector<HTMLMetaElement>('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
      }
      metaDesc.content = description;
    }

    // Atualizar robots meta
    if (robots) {
      let metaRobots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
      if (!metaRobots) {
        metaRobots = document.createElement('meta');
        metaRobots.name = 'robots';
        document.head.appendChild(metaRobots);
      }
      metaRobots.content = robots;
    }

    // Atualizar keywords
    if (keywords) {
      let metaKeywords = document.querySelector<HTMLMetaElement>('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.name = 'keywords';
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.content = keywords;
    }

    // Atualizar Open Graph tags
    if (ogImage || ogUrl || ogType || title) {
      const updateOGTag = (property: string, content: string | undefined) => {
        if (!content) return;
        let meta = document.querySelector<HTMLMetaElement>(`meta[property="og:${property}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('property', `og:${property}`);
          document.head.appendChild(meta);
        }
        meta.content = content;
      };

      updateOGTag('type', ogType);
      updateOGTag('url', ogUrl || canonical);
      updateOGTag('image', ogImage);
      updateOGTag('title', title);
      updateOGTag('description', description);
    }

    // Atualizar Twitter Card tags
    if (ogImage || title || description) {
      const updateTwitterTag = (name: string, content: string | undefined) => {
        if (!content) return;
        let meta = document.querySelector<HTMLMetaElement>(`meta[name="twitter:${name}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.name = `twitter:${name}`;
          document.head.appendChild(meta);
        }
        meta.content = content;
      };

      updateTwitterTag('card', 'summary_large_image');
      updateTwitterTag('title', title);
      updateTwitterTag('description', description);
      updateTwitterTag('image', ogImage);
    }
  }, [canonical, title, description, robots, keywords, ogImage, ogType, ogUrl]);

  // Este componente é apenas para efeitos colaterais
  return null;
}
