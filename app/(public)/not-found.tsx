import Link from "next/link";

/**
 * O site nao tinha nenhum not-found. Toda URL publica que nao existe — filhote
 * ja entregue, post renomeado, link antigo compartilhado no WhatsApp — caia na
 * pagina padrao do Next: fundo branco, "404 | This page could not be found",
 * em ingles, sem cabecalho, sem rodape e sem um unico link de volta.
 *
 * O status 404 ja estava correto, entao isto nao muda nada para o buscador. O
 * que muda e para quem chega: em vez de um beco sem saida, a pessoa ve onde
 * esta e para onde ir. Esta dentro do grupo (public), entao herda o Header, o
 * Footer e o <main> do layout.
 *
 * Nao exporta `metadata`: not-found.tsx nao aceita esse export no App Router, e
 * o 404 ja mantem a pagina fora do indice sem precisar de noindex.
 */

const DESTINOS = [
  { href: "/filhotes", titulo: "Vitrine de filhotes", texto: "O catálogo atual, por cor e por sexo." },
  { href: "/preco-spitz-anao", titulo: "Tabela de preços", texto: "Valores por cor e sexo e o que está incluso." },
  { href: "/blog", titulo: "Blog", texto: "Guias sobre criação, saúde, rotina e comportamento." },
  { href: "/contato", titulo: "Contato", texto: "Falar direto com a criadora pelo WhatsApp." },
];

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-20 sm:px-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]">
          Erro 404
        </p>
        <h1 className="text-3xl font-semibold leading-tight text-[var(--text)] sm:text-4xl">
          Esta página não existe
        </h1>
        <p className="text-base leading-relaxed text-[var(--text-muted)]">
          O endereço pode ter mudado, ou o filhote desta página já foi para a casa dele. O
          restante do site continua no ar — escolha por onde seguir.
        </p>
      </header>

      <nav aria-label="Principais seções do site">
        <ul className="grid gap-4 sm:grid-cols-2">
          {DESTINOS.map(({ href, titulo, texto }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex h-full flex-col gap-1 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:border-emerald-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
              >
                <span className="text-sm font-semibold text-[var(--text)]">{titulo}</span>
                <span className="text-sm leading-relaxed text-[var(--text-muted)]">{texto}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <p className="text-sm text-[var(--text-muted)]">
        Prefere começar do início?{" "}
        <Link href="/" className="font-semibold text-emerald-700 underline underline-offset-4">
          Voltar para a página inicial
        </Link>
        .
      </p>
    </div>
  );
}
