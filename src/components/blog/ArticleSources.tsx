import type { ArticleSource } from "@/lib/blog/sources";

/**
 * Bloco "Fontes" no fim do artigo.
 *
 * Reaproveita as mesmas classes do <aside> de links relacionados logo abaixo —
 * borda, raio e sombra idênticos — para não introduzir um cartão com aparência
 * própria no meio do artigo.
 *
 * `rel="nofollow"` não entra aqui de propósito: são links para FCI, WSAVA e
 * afins, citados porque sustentam o texto. Marcar como nofollow diria ao
 * buscador que o site não se responsabiliza por eles, que é o oposto do motivo
 * de estarem na página.
 */
export default function ArticleSources({ sources }: { sources: ArticleSource[] }) {
  if (!sources.length) return null;

  return (
    <section
      aria-labelledby="fontes-do-artigo"
      className="rounded-3xl border border-border bg-surface-subtle p-5 shadow-soft"
    >
      <h2 id="fontes-do-artigo" className="text-base font-semibold text-text">
        Fontes
      </h2>
      <p className="mt-1 text-sm text-text-muted">
        Referências consultadas para as afirmações técnicas deste artigo.
      </p>

      <ol className="mt-4 space-y-3 text-sm">
        {sources.map((s) => (
          <li key={s.url} className="leading-relaxed">
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="link-brand underline-always font-medium"
            >
              {s.title}
            </a>
            {s.publisher && <span className="text-text-muted"> — {s.publisher}</span>}
          </li>
        ))}
      </ol>
    </section>
  );
}
