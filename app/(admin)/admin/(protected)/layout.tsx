import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ToastProvider } from "@/components/ui/toast";
import { requireAdminLayout } from "@/lib/adminAuth";

import { AdminNav } from "./AdminNav";
import { AdminTopbar } from "./AdminTopbar";

export const metadata: Metadata = {
  title: "Admin | By Império Dog",
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
        {/* auto na primeira coluna: o menu decide a propria largura (aberto ou
            recolhido). Com 260px fixos, recolher deixava um vao vazio. */}
        <div className="grid min-h-screen grid-cols-1 md:grid-cols-[auto_minmax(0,1fr)]">
          {/* No celular o aside nao gera caixa (contents): a coluna do menu se
              esconde sozinha e o dialogo do menu movel continua renderizavel.
              Com "hidden" aqui, o dialogo abria com largura zero. */}
          <aside aria-label="Navegacao principal" className="contents md:sticky md:top-0 md:block md:h-screen md:border-r md:border-[var(--border)] md:bg-white">
            <AdminNav environment={environment} />
          </aside>

          <div className="flex min-w-0 flex-col">
            <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-white/85 backdrop-blur">
              <AdminTopbar environment={environment} userName={adminIdentity?.name ?? "Admin"} />
            </header>

            <main id="admin-main-content" tabIndex={-1} className="flex-1 bg-[var(--surface-2)] px-4 py-6 md:px-8 md:py-8 focus:outline-none" role="main">
              <div className="mx-auto w-full max-w-[1400px]">{children}</div>
            </main>

            <footer className="border-t border-[var(--border)] px-4 py-3 text-xs text-[var(--text-muted)] md:px-8">
              <p>By Império Dog · Painel · {environment}</p>
            </footer>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
