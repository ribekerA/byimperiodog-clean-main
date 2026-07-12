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

  const shareOnPinterest = () => {
    const target = encodeURIComponent(shareTarget.replace("%SOURCE%", "pinterest"));
    const desc = encodeURIComponent(`${title} — By Império Dog`);
    openWindow(`https://www.pinterest.com/pin/create/button/?url=${target}&description=${desc}`);
    trackShare("pinterest", title);
  };

  const shareOnThreads = () => {
    const target = shareTarget.replace("%SOURCE%", "threads");
    const text = encodeURIComponent(`${title}\n\n${target}`);
    openWindow(`https://www.threads.net/intent/post?text=${text}`);
    trackShare("threads", title);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-xs font-semibold uppercase tracking-[0.28em] text-text-soft">
        Compartilhar
      </span>

      <button
        type="button"
        onClick={shareOnWhatsApp}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-whatsapp text-whatsapp-contrast shadow-soft transition hover:scale-110 focus-ring"
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
        className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#1877f2] text-white shadow-soft transition hover:scale-110 focus-ring"
        aria-label="Compartilhar no Facebook"
      >
        <Facebook className="h-5 w-5" aria-hidden />
      </button>

      <button
        type="button"
        onClick={shareOnTwitter}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#1d9bf0] text-white shadow-soft transition hover:scale-110 focus-ring"
        aria-label="Compartilhar no X (Twitter)"
      >
        <Twitter className="h-5 w-5" aria-hidden />
      </button>

      {/* Pinterest — alto alcance para conteúdo visual de pets */}
      <button
        type="button"
        onClick={shareOnPinterest}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#e60023] text-white shadow-soft transition hover:scale-110 focus-ring"
        aria-label="Salvar no Pinterest"
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
        </svg>
      </button>

      {/* Threads */}
      <button
        type="button"
        onClick={shareOnThreads}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-zinc-900 text-white shadow-soft transition hover:scale-110 focus-ring"
        aria-label="Compartilhar no Threads"
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 192 192" aria-hidden>
          <path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.34c-14.986 0-27.449 6.396-35.12 18.035l13.695 9.398c5.581-8.437 14.32-10.266 21.425-10.266h.233c8.286.052 14.535 2.458 18.585 7.15 2.954 3.394 4.938 8.026 5.928 13.787-7.382-1.254-15.36-1.638-23.877-1.144-24.02 1.384-39.44 15.405-38.489 34.905.482 9.902 5.274 18.432 13.494 23.988 6.927 4.718 15.838 7.023 25.107 6.501 12.223-.689 21.82-5.437 28.52-14.112 5.078-6.644 8.299-15.271 9.75-26.1 5.846 3.528 10.179 8.187 12.637 13.745 4.547 10.355 4.817 27.414-9.349 41.457-12.476 12.376-27.44 17.274-50.053 17.434-25.01-.172-43.887-8.213-56.092-23.906C24.723 135.45 18.236 115.12 18 88.688v-.376c.236-26.432 6.723-46.762 19.296-60.429C49.501 14.575 68.378 6.533 93.388 6.36c25.179.174 44.492 8.243 57.404 21.979 6.368 6.768 11.063 15.12 14.018 24.76l16.144-4.305c-3.758-12.383-9.874-23.027-18.233-31.667C143.97 2.808 120.987-6.158 93.574-6.36h-.164c-27.292.2-50.735 9.219-67.834 26.105C9.317 36.37 1.487 58.49 1.172 87.568L1.166 88v.688l.006.432c.315 29.078 8.145 51.198 23.264 67.817 17.099 16.886 40.542 25.904 67.834 26.105h.164c23.62-.162 40.406-6.342 54.196-20.037 18.515-18.415 17.896-41.516 11.815-55.707-4.29-9.756-12.89-17.702-16.908-19.31z"/>
        </svg>
      </button>

      <button
        type="button"
        onClick={handleCopyLink}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-text shadow-soft transition hover:scale-110 focus-ring"
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
