/**
 * Gera JSON-LD de Product para páginas de filhotes
 * Melhora aparência nos resultados de busca e Google Shopping
 */

import type { Puppy } from '@/domain/puppy';

export function buildProductLD(puppy: Puppy, baseUrl: string = 'https://byimperiodog.com.br') {
  const availability = 
    puppy.status === 'available' ? 'https://schema.org/InStock' :
    puppy.status === 'reserved' ? 'https://schema.org/PreOrder' :
    'https://schema.org/OutOfStock';

  const condition = 'https://schema.org/NewCondition'; // Filhotes sempre "novos"

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: puppy.title || puppy.name,
    description: puppy.description,
    image: puppy.images?.[0] || puppy.thumbnailUrl,
    brand: {
      '@type': 'Brand',
      name: 'By Império Dog',
    },
    offers: {
      '@type': 'Offer',
      url: `${baseUrl}/filhotes/${puppy.slug}`,
      priceCurrency: 'BRL',
      price: (puppy.priceCents / 100).toFixed(2),
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
      availability,
      itemCondition: condition,
      seller: {
        '@type': 'Organization',
        name: 'By Império Dog',
      },
    },
    aggregateRating: puppy.reviewCount > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: puppy.averageRating.toFixed(1),
      reviewCount: puppy.reviewCount,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
    category: 'Spitz Alemão Anão',
    color: puppy.color,
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'Sexo',
        value: puppy.sex === 'male' ? 'Macho' : 'Fêmea',
      },
      {
        '@type': 'PropertyValue',
        name: 'Pedigree CBKC',
        value: puppy.hasPedigree ? 'Sim' : 'Não',
      },
      {
        '@type': 'PropertyValue',
        name: 'Vacinação',
        value: puppy.vaccinationStatus === 'up-to-date' ? 'Em dia' : 'Parcial',
      },
    ],
  };
}
