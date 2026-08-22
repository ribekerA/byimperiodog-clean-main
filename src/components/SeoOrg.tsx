// components/SeoOrg.tsx
import { safeJsonLdStringify } from "@/lib/contentSecurity";

export function SeoOrg() {
  const json = {
    "@context": "https://schema.org",
    "@type": "Organization",
  "name": "By Império Dog",
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
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(json) }} />;
}
