import type { Metadata } from "next";

import "../globals.css";
import "../../design-system/tokens.css";
import { dmSans } from "../fonts";

export const metadata: Metadata = {
  robots: { index: false, follow: false, noarchive: true },
  referrer: "no-referrer",
};
export const viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" as const };

/** Root separado: entrada/saída faz navegação completa; nenhum GTM herdado da SPA. */
export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return <html lang="pt-BR" className={dmSans.variable}>
    <body className="min-h-screen bg-[var(--bg)] text-[var(--text)] antialiased">
      <main>{children}</main>
    </body>
  </html>;
}
