"use client";

import { Facebook, Link as LinkIcon, Twitter } from "lucide-react";
import { useMemo, useState } from "react";

import { trackShare } from "@/lib/events";
import { buildWhatsAppLink } from "@/lib/whatsapp";

interface ShareButtonsProps {
  title: string;
  url: string;
}

const SHARE_UTM = {
  medium: "share",
  campaign: "blog_post",
} as const;

export default function ShareButtons({ title, url }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const shareTarget = useMemo(() => {
    const base = url.replace(/\/$/, "");
    const separator = base.includes("?") ? "&" : "?";
    return `${base}${separator}utm_source=%SOURCE%&utm_medium=${SHARE_UTM.medium}&utm_campaign=${SHARE_UTM.campaign}`;
  }, [url]);

  const handleCopyLink = async () => {
    try {
      const formatted = shareTarget.replace("%SOURCE%", "copy");
      await navigator.clipboard.writeText(formatted);
      setCopied(true);
      trackShare("copy", title);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      // silencioso
    }
  };

  const openWindow = (shareUrl: string) => {
    const features = "noopener,noreferrer,width=600,height=560";
    window.open(shareUrl, "_blank", features);
  };

  const shareOnWhatsApp = () => {
    const target = shareTarget.replace("%SOURCE%", "whatsapp");
    const link = buildWhatsAppLink({
      message: `${title} - ${target}`,
      utmSource: "blog",
      utmMedium: SHARE_UTM.medium,
      utmCampaign: SHARE_UTM.campaign,
      utmContent: "whatsapp_share",
    });
    window.open(link, "_blank", "noopener,noreferrer");
    trackShare("whatsapp", title);
  };

  const shareOnFacebook = () => {
    const target = encodeURIComponent(shareTarget.replace("%SOURCE%", "facebook"));
    openWindow(`https://www.facebook.com/sharer/sharer.php?u=${target}`);
    trackShare("facebook", title);
  };

  const shareOnTwitter = () => {
    const target = encodeURIComponent(shareTarget.replace("%SOURCE%", "twitter"));
    const text = encodeURIComponent(title);
    openWindow(`https://twitter.com/intent/tweet?text=${text}&url=${target}`);
    trackShare("twitter", title);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-xs font-semibold uppercase tracking-[0.28em] text-text-soft">
        Compartilhar
      </span>

      <button
        type="button"
        onClick={shareOnWhatsApp}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-whatsapp text-whatsapp-contrast shadow-soft transition hover:scale-110 focus-ring"
        aria-label="Compartilhar no WhatsApp"
        data-track-event="share_whatsapp"
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M17.5 14.4c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.1-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.2.3-.4.5-.6.2-.2.2-.3.3-.5.1-.2.1-.4 0-.5s-.7-1.6-.9-2.2c-.3-.6-.5-.5-.7-.5-.2 0-.4 0-.6 0-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5 0 1.5 1.1 2.9 1.2 3.1.2.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4 0-.1-.3-.2-.6-.3zM12 22h-.1c-1.7 0-3.4-.4-4.8-1.2l-.4-.2-3.7 1 1-3.6-.2-.4C3 16.6 2.6 15.1 2.6 13.5 2.6 7.6 7.5 2.7 13.4 2.7c2.6 0 5.1 1 6.9 2.9 1.8 1.9 2.8 4.3 2.8 6.9C23.1 17.9 18.2 22 12 22z" />
        </svg>
      </button>

      <button
        type="button"
        onClick={shareOnFacebook}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#1877f2] text-white shadow-soft transition hover:scale-110 focus-ring"
        aria-label="Compartilhar no Facebook"
      >
        <Facebook className="h-5 w-5" aria-hidden />
      </button>

      <button
        type="button"
        onClick={shareOnTwitter}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#1d9bf0] text-white shadow-soft transition hover:scale-110 focus-ring"
        aria-label="Compartilhar no Twitter"
      >
        <Twitter className="h-5 w-5" aria-hidden />
      </button>

      <button
        type="button"
        onClick={handleCopyLink}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-text shadow-soft transition hover:scale-110 focus-ring"
        aria-label="Copiar link para a area de transferencia"
      >
        {copied ? (
          <svg className="h-5 w-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4 10-10" />
          </svg>
        ) : (
          <LinkIcon className="h-5 w-5" aria-hidden />
        )}
      </button>

      <span className="min-h-[1.25rem] text-sm text-brand" role="status" aria-live="polite">
        {copied ? "Link copiado com sucesso." : null}
      </span>
    </div>
  );
}
