// components/SeoOrg.tsx
export function SeoOrg() {
  const json = {
    "@context": "https://schema.org",
    "@type": "Organization",
  "name": "By Imperio Dog",
    "url": process.env.NEXT_PUBLIC_SITE_URL,
    "logo": `${process.env.NEXT_PUBLIC_SITE_URL}/logo.png`,
    "sameAs": [
      "https://www.instagram.com/byimperiodog",
      "https://www.facebook.com/byimperiodog"
    ],
    "contactPoint": [{
      "@type": "ContactPoint",
      "telephone": "+55-11-96863-3239",
      "contactType": "customer service",
      "areaServed": "BR",
      "availableLanguage": ["pt-BR"]
    }]
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />;
}
