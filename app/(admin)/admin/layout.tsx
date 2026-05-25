import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Admin | By Imperio Dog",
    template: "%s | Admin • By Imperio Dog",
  },
  description: "Painel administrativo interno da By Imperio Dog.",
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
  return <>{children}</>;
}

