import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Relatórios | Admin",
  robots: { index: false, follow: false },
};

export default function RelatoriosPage() {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold text-[var(--text)]">Relatórios & Métricas</h1>
      <p className="text-sm text-[var(--text-muted)]">Em breve: leads por dia, filhotes vendidos, funil de conversão.</p>
      <div className="rounded-2xl border border-[var(--border)] bg-white p-4 text-sm text-[var(--text-muted)]">
        Placeholder para gráficos e KPIs. Ajuste conforme dados reais do Supabase.
      </div>
    </div>
  );
}
