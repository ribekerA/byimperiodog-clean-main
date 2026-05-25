"use client";

import { useEffect, useState } from "react";

import { WhatsAppIcon as WAIcon } from "@/components/icons/WhatsAppIcon";
import { PawConfettiButton } from "@/components/motion/PawConfetti";
import { cn } from "@/lib/cn";

interface StickyCTAProps {
  href: string;
  label?: string;
  scrollThreshold?: number;
}

export default function StickyCTA({
  href,
  label = "Falar com a criadora",
  scrollThreshold = 300,
}: StickyCTAProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const shouldShow = window.scrollY > scrollThreshold;
      setVisible(shouldShow);
    };

    handleScroll(); // Check initial state
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrollThreshold]);

  return (
    <div
      className={cn(
        "fixed bottom-4 left-1/2 z-50 -translate-x-1/2 transition-all duration-300 lg:hidden",
        visible ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0 pointer-events-none"
      )}
      aria-hidden={!visible}
    >
      <PawConfettiButton
        href={href}
        rel="noopener noreferrer"
        target="_blank"
        className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-emerald-700 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        emojis="paw"
        count={12}
        aria-label={label}
      >
        <WAIcon size={20} className="h-5 w-5" aria-hidden />
        <span className="whitespace-nowrap">{label}</span>
      </PawConfettiButton>
    </div>
  );
}
