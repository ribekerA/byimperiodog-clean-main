"use client";

import { useId, useState } from "react";

/** Mantém o texto inteiro no HTML e permite abrir comentários longos. */
export default function ReviewComment({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const long = text.length > 150;
  return (
    <div className="flex-1">
      <p id={id} className={`whitespace-pre-line text-sm leading-6 text-[var(--text)] ${long && !expanded ? "line-clamp-4" : ""}`}>{text}</p>
      {long && <button type="button" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded(!expanded)} className="mt-1 min-h-11 rounded px-1 text-sm font-medium text-[var(--accent-ink)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">{expanded ? "Mostrar menos" : "Ler mais"}</button>}
    </div>
  );
}
