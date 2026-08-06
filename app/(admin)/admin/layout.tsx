import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import "../../globals.css";
import "../../../design-system/tokens.css";
import ToastContainer from "@/components/Toast";
import { dmSans, inter } from "../../fonts";

export const metadata: Metadata = {
  title: {
    default: "Admin | By Império Dog",
    template: "%s | Admin • By Império Dog",
  },
  description: "Painel administrativo interno da By Império Dog.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
  other: {
    "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet",
  },
  openGraph: undefined,
  twitter: undefined,
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`scroll-smooth ${dmSans.variable} ${inter.variable}`}>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className="min-h-screen bg-[var(--bg)] text-[var(--text)] antialiased admin-shell">
        {children}
        <SpeedInsights />
        <ToastContainer />
      </body>
    </html>
  );
}

