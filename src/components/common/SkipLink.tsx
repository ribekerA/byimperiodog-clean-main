"use client";

import Link from "next/link";

type SkipLinkProps = {
  href?: string;
  children?: React.ReactNode;
  className?: string;
};

export function SkipLink({
  href = "#conteudo-principal",
  children = "Ir direto para o conteúdo principal",
  className,
}: SkipLinkProps) {
  return (
    <Link
      href={href}
      className={`skip-link sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-4 focus-visible:left-4 focus-visible:z-[9999] focus-visible:rounded-full focus-visible:bg-white focus-visible:px-6 focus-visible:py-3 focus-visible:text-sm focus-visible:font-semibold focus-visible:text-emerald-900 focus-visible:shadow-2xl focus-visible:ring-4 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 transition-all ${className ?? ""}`}
    >
      {children}
    </Link>
  );
}

export default SkipLink;
