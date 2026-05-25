// Geração de JSON-LD estruturado para páginas de blog e site
// Uso: importar getPostJsonLd / getSiteJsonLd e injetar via <script type="application/ld+json">.

export function getSiteJsonLd(opts: { siteUrl: string; name: string; searchUrl?: string }) {
  const { siteUrl, name, searchUrl } = opts;
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: siteUrl,
    name,
    potentialAction: searchUrl ? {
      '@type': 'SearchAction',
      target: `${searchUrl}?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    } : undefined
  };
}

export function getOrgJsonLd(opts: { siteUrl: string; name: string; logo?: string; sameAs?: string[] }) {
  const { siteUrl, name, logo, sameAs } = opts;
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    url: siteUrl,
    name,
    logo,
    sameAs: sameAs && sameAs.length ? sameAs : undefined
  };
}

export function getPostJsonLd(opts: { siteUrl: string; slug: string; title: string; description?: string; datePublished?: string; dateModified?: string; image?: string; authorName?: string; }) {
  const { siteUrl, slug, title, description, datePublished, dateModified, image, authorName } = opts;
  const url = `${siteUrl.replace(/\/$/,'')}/blog/${slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    datePublished,
    dateModified: dateModified || datePublished,
    author: authorName ? { '@type': 'Person', name: authorName } : undefined,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    image: image ? [image] : undefined,
    url,
  };
}

export function getBreadcrumbJsonLd(opts: { siteUrl: string; items: { name: string; url: string }[] }) {
  const { siteUrl, items } = opts;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: it.name,
      item: it.url.startsWith('http') ? it.url : `${siteUrl.replace(/\/$/,'')}${it.url}`
    }))
  };
}

export function serializeJsonLd(obj: unknown) {
  return JSON.stringify(obj, null, 0);
}

// WebPage JSON-LD helper for institutional pages
export function getWebPageJsonLd(opts: {
  siteUrl: string;
  path: string; // e.g. '/sobre'
  name: string;
  description?: string;
}) {
  const base = opts.siteUrl.replace(/\/$/, "");
  const url = `${base}${opts.path}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: opts.name,
    description: opts.description,
    isPartOf: {
      '@type': 'WebSite',
      url: base,
      name: 'By Imperio Dog',
    },
  };
}

// ItemList JSON-LD helper to represent ordered lists (e.g., posts on a listing page)
export function getItemListJsonLd(opts: {
  siteUrl: string;
  items: Array<{ url: string; name?: string }>; // urls can be absolute or relative
  idPath?: string; // optional path to compose a stable @id
}) {
  const base = opts.siteUrl.replace(/\/$/, "");
  const toAbs = (u: string) => (u.startsWith('http') ? u : `${base}${u}`);
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': opts.idPath ? `${base}${opts.idPath}#itemlist` : undefined,
    itemListElement: opts.items.map((it, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: toAbs(it.url),
      name: it.name,
    })),
  };
}
