// Componente simples para injetar JSON-LD no head/corpo da página
// Uso: <SeoJsonLd data={objOuArray} />
// Mantém suppressHydrationWarning e serialização estável
import React from 'react';

import { safeJsonLdStringify } from '@/lib/contentSecurity';

type JsonLd = Record<string, any> | Array<Record<string, any>>;

export function SeoJsonLd({ data }: { data: JsonLd }) {
  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(data) }}
    />
  );
}

export default SeoJsonLd;
