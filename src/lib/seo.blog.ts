// Wrapper legado que reexporta utilidades agora centralizadas em seo.core.
// Mantido para não quebrar imports existentes até refactor completo.
export { canonical as blogCanonical, baseBlogMetadata, buildBlogPostMetadata, blogJsonLdOrg } from './seo.core';
export { SITE_ORIGIN } from './seo.core';

