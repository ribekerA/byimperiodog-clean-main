import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ToastProvider } from "@/components/ui/toast";
import { requireAdminLayout } from "@/lib/adminAuth";

import { AdminNav } from "./AdminNav";
import { AdminTopbar } from "./AdminTopbar";

export const metadata: Metadata = {
  title: "Admin | By Imperio Dog",
  robots: { index: false, follow: false },
};

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const adminIdentity = await (async () => {
    try {
      return await requireAdminLayout();
    } catch {
      redirect("/admin/login");
    }
  })();

  const environment = process.env.NODE_ENV === "production" ? "Producao" : "Desenvolvimento";

  return (
    <ToastProvider>
      <a
        href="#admin-main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[var(--brand)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
      >
        Pular para o conteúdo principal
      </a>
      <div className="min-h-screen bg-[var(--surface-2)] text-[var(--text)] antialiased">
        <div className="grid min-h-screen grid-cols-1 md:grid-cols-[260px_1fr]">
          <nav aria-label="Navegacao principal" className="hidden border-b border-[var(--border)] bg-white shadow-sm md:block md:border-b-0 md:border-r">
            <AdminNav environment={environment} />
          </nav>

          <div className="flex flex-col">
            <header className="border-b border-[var(--border)] bg-white/90 backdrop-blur">
              <AdminTopbar environment={environment} userName={adminIdentity?.name ?? "Admin"} />
            </header>

            <main id="admin-main-content" tabIndex={-1} className="flex-1 bg-[var(--surface-2)] px-4 py-6 md:px-8 focus:outline-none" role="main">
              {children}
            </main>

            <footer className="border-t border-[var(--border)] bg-white px-4 py-3 text-xs text-[var(--text-muted)] md:px-8">
              <p>By Imperio Dog - Painel operacional - {environment}</p>
            </footer>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
