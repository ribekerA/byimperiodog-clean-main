/**
 * Gera JSON-LD de BreadcrumbList para SEO
 * Melhora a navegação nos resultados de busca
 */

export interface BreadcrumbItem {
  name: string;
  href: string;
}

export function buildBreadcrumbLD(items: BreadcrumbItem[], baseUrl: string = 'https://byimperiodog.com.br') {
  if (!items || items.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.href}`,
    })),
  };
}
