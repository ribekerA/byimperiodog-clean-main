// components/SeoArticle.tsx
export function SeoArticle({ title, description, url, published, modified, author, faq, howTo }:{
  title:string; description:string; url:string; published:string; modified:string;
  author:{ name:string }; faq?: { question:string; answer:string }[];
  howTo?: { name:string; steps: { name:string; text?:string }[] } | null;
}) {
  const article = {
    "@context":"https://schema.org",
    "@type":"Article",
    "headline": title,
    "description": description,
    "author": { "@type":"Person", "name": author.name },
    "datePublished": published, "dateModified": modified,
    "mainEntityOfPage": url,
    "publisher": { "@type": "Organization", "name": "By Imperio Dog" }
  };

  const faqSchema = faq?.length ? {
    "@context":"https://schema.org",
    "@type":"FAQPage",
    "mainEntity": faq.map(q => ({
      "@type":"Question",
      "name": q.question,
      "acceptedAnswer": { "@type":"Answer", "text": q.answer }
    }))
  } : null;

  const howToSchema = howTo ? {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": howTo.name,
    "step": howTo.steps.map((s, i) => ({ "@type": "HowToStep", "name": s.name, "text": s.text || "" }))
  } : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(article) }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}
      {howToSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />}
    </>
  );
}
