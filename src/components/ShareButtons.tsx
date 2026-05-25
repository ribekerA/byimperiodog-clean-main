"use client";
import { Share2, Link as LinkIcon, Twitter, Facebook, Linkedin } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { WhatsAppIcon as WAIcon } from '@/components/icons/WhatsAppIcon';
import { logEvent } from '@/lib/analytics';

type Props = {
  url: string;
  title: string;
  summary?: string;
  className?: string;
  utm?: string; // e.g. utm_source=share&utm_medium=blog
};

export default function ShareButtons({ url, title, summary, className, utm }: Props) {
  const [copied, setCopied] = useState(false);
  const shareUrl = useMemo(() => {
    if (!utm) return url;
    try {
      const u = new URL(url);
      for (const part of utm.split('&')) {
        const [k, v] = part.split('=');
        if (k && v) u.searchParams.set(k, v);
      }
      return u.toString();
    } catch {
      return url;
    }
  }, [url, utm]);

  const shareNative = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, text: summary, url: shareUrl });
        logEvent('share_click', { channel: 'native', url: shareUrl, title });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
        logEvent('share_click', { channel: 'copy_fallback', url: shareUrl, title });
      }
    } catch {
      // ignore
    }
  }, [shareUrl, title, summary]);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      logEvent('share_click', { channel: 'copy', url: shareUrl, title });
    } catch {}
  }, [shareUrl, title]);

  const socials = useMemo(() => {
    const encUrl = encodeURIComponent(shareUrl);
    const encTitle = encodeURIComponent(title);
    const encSummary = encodeURIComponent(summary || title);
    return {
      twitter: `https://twitter.com/intent/tweet?url=${encUrl}&text=${encTitle}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encUrl}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encUrl}&title=${encTitle}&summary=${encSummary}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(title + ' ' + shareUrl)}`,
    };
  }, [shareUrl, title, summary]);

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={shareNative}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50"
          aria-label="Compartilhar"
          title="Compartilhar"
        >
          <Share2 className="h-4 w-4" /> {copied ? 'Link copiado!' : 'Compartilhar'}
        </button>
  <a href={socials.whatsapp} target="_blank" rel="noopener" onClick={() => logEvent('share_click', { channel: 'whatsapp', url: shareUrl, title })} className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50" aria-label="Compartilhar no WhatsApp" title="WhatsApp">
    <WAIcon size={16} className="h-4 w-4" /> WhatsApp
        </a>
  <a href={socials.twitter} target="_blank" rel="noopener" onClick={() => logEvent('share_click', { channel: 'twitter', url: shareUrl, title })} className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50" aria-label="Compartilhar no X/Twitter" title="X/Twitter">
          <Twitter className="h-4 w-4" /> X
        </a>
  <a href={socials.facebook} target="_blank" rel="noopener" onClick={() => logEvent('share_click', { channel: 'facebook', url: shareUrl, title })} className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50" aria-label="Compartilhar no Facebook" title="Facebook">
          <Facebook className="h-4 w-4" /> Facebook
        </a>
  <a href={socials.linkedin} target="_blank" rel="noopener" onClick={() => logEvent('share_click', { channel: 'linkedin', url: shareUrl, title })} className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50" aria-label="Compartilhar no LinkedIn" title="LinkedIn">
          <Linkedin className="h-4 w-4" /> LinkedIn
        </a>
        <button onClick={copy} className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50" aria-label="Copiar link">
          <LinkIcon className="h-4 w-4" /> Copiar link
        </button>
      </div>
    </div>
  );
}
