// Componente simples para injetar JSON-LD no head/corpo da página
// Uso: <SeoJsonLd data={objOuArray} />
// Mantém suppressHydrationWarning e serialização estável
import React from 'react';

type JsonLd = Record<string, any> | Array<Record<string, any>>;

function safeStringify(data: JsonLd) {
  try {
    return JSON.stringify(data);
  } catch {
    return 'null';
  }
}

export function SeoJsonLd({ data }: { data: JsonLd }) {
  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: safeStringify(data) }}
    />
  );
}

export default SeoJsonLd;
