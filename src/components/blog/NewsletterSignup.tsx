"use client";

import { useState } from "react";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!consent) return;
    setStatus("sending");
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consent_lgpd: consent, consent_version: "1.0", source: "blog" }),
      });
      if (!response.ok) throw new Error("subscription_failed");
      setStatus("success");
      setEmail("");
      setConsent(false);
    } catch {
      setStatus("error");
    }
  }

  return (
    <form className="w-full space-y-2 sm:w-auto sm:min-w-[320px]" onSubmit={submit}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="newsletter-email-blog" className="sr-only">Seu melhor e-mail</label>
        <input
          id="newsletter-email-blog"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoComplete="email"
          placeholder="Seu melhor e-mail"
          className="flex-1 rounded-pill border border-border bg-white px-4 py-2.5 text-sm text-text shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
        <button
          type="submit"
          disabled={!consent || status === "sending"}
          className="inline-flex items-center justify-center rounded-pill bg-brand px-5 py-2.5 text-sm font-semibold text-on-brand shadow-soft transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "sending" ? "Enviando..." : "Quero receber"}
        </button>
      </div>
      <label className="flex items-start gap-2 text-[11px] leading-relaxed text-text-muted">
        <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} required className="mt-0.5 h-4 w-4" />
        <span>
          Aceito receber conteúdo por e-mail conforme a <a href="/politica-de-privacidade" target="_blank" rel="noopener noreferrer" className="underline">Política de Privacidade</a>. Posso cancelar quando quiser.
        </span>
      </label>
      <p role="status" aria-live="polite" className="text-xs text-text-muted">
        {status === "success" ? "Inscrição registrada com sucesso." : status === "error" ? "Não foi possível registrar agora. Tente novamente." : ""}
      </p>
    </form>
  );
}
