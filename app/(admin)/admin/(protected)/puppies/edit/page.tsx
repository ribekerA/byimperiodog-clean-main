import Link from "next/link";
import { PawPrint, RefreshCw, Search, Upload } from "lucide-react";

import { PuppyEditLauncher } from "./pageClient";

const tips = [
  {
    icon: PawPrint,
    title: "Dados essenciais",
    description: "Nome, cor, sexo e cidade aparecem nas páginas públicas e precisam estar sempre atualizados.",
  },
  {
    icon: RefreshCw,
    title: "Preço e status",
    description: "Mantenha o preço em centavos e marque o status corretamente para liberar ou pausar campanhas.",
  },
  {
    icon: Upload,
    title: "Mídias",
    description: "Envie pelo menos uma foto e organize a ordem; vídeos ajudam a aumentar conversão.",
  },
];

export default function EditPuppyLandingPage() {
  return (
    <div className="space-y-8 px-6 py-8">
      <Link
        href="/admin/puppies"
        className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text)] transition hover:bg-[var(--surface-2)]"
      >
        <Search className="h-4 w-4" aria-hidden /> Voltar para listagem
      </Link>

      <header className="space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]">Editar filhote</p>
          <h1 className="text-3xl font-semibold text-[var(--text)]">Atualize informações, preço, status e mídias</h1>
        </div>
        <p className="max-w-3xl text-sm text-[var(--text-muted)]">
          Cole o identificador do filhote ou escolha diretamente na lista. Depois de salvar, o card público é atualizado automaticamente no site
          e nas campanhas conectadas.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[2fr_3fr]">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--text)]">Acessar formulário</h2>
          <p className="text-sm text-[var(--text-muted)]">Informe o ID ou slug para abrir o modo de edição completo.</p>
          <div className="mt-4">
            <PuppyEditLauncher />
          </div>
          <div className="mt-4 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-3 text-xs text-[var(--text-muted)]">
            Dica: copie o ID na listagem principal ou no painel de leads. Você também pode colar o slug público (ex.: <code>spitz-lulu-creme</code>).
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--text)]">Boas práticas antes de publicar</h2>
          <div className="mt-4 space-y-3">
            {tips.map((tip) => (
              <article key={tip.title} className="flex gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                <tip.icon className="h-5 w-5 text-[var(--text-muted)]" aria-hidden />
                <div>
                  <p className="text-sm font-semibold text-[var(--text)]">{tip.title}</p>
                  <p className="text-sm text-[var(--text-muted)]">{tip.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--text)]">Fluxo recomendado</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-6 text-sm text-[var(--text)]">
          <li>Abra a listagem de filhotes, filtre pelo status e copie o ID desejado.</li>
          <li>Cole o ID acima para abrir o formulário de edição e revise cada campo obrigatório.</li>
          <li>Envie novas mídias, defina a ordem das fotos e remova arquivos antigos se necessário.</li>
          <li>Salve e aguarde a confirmação; o painel atualizará automaticamente.</li>
        </ol>
      </section>
    </div>
  );
}
