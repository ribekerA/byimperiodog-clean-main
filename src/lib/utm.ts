export type PageType = "catalog" | "puppy" | "color" | "city" | "intent" | "blog";

export type LeadContext = {
  pageType: PageType;
  url: string;
  slug?: string;
  color?: string;
  city?: string;
  intent?: string;
};

export function withUTM(baseUrl: string, params: Record<string, string | undefined>) {
  const url = new URL(baseUrl, typeof window !== "undefined" ? window.location.origin : "https://byimperiodog.com.br");
  Object.entries(params).forEach(([k, v]) => {
    if (v) url.searchParams.set(k, v);
  });
  return url.toString();
}

export function whatsappLeadUrl(phoneE164: string, context: LeadContext) {
  const base = `https://wa.me/${phoneE164}`;
  const text = `Olá! Tenho interesse em Spitz. Página: ${context.pageType}${context.slug ? `/${context.slug}` : ""}${context.color ? ` | cor: ${context.color}` : ""}${context.city ? ` | cidade: ${context.city}` : ""}${context.intent ? ` | intenção: ${context.intent}` : ""}`;
  return withUTM(base, {
    utm_source: "site",
    utm_medium: "whatsapp_button",
    utm_campaign: "lead_funnel",
    utm_content: context.pageType,
    text,
  });
}
