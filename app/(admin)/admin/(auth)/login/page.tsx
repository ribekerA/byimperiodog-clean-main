"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailTrimmed = email.trim();
    if (!emailTrimmed) {
      setError("Informe um email valido.");
      return;
    }
    if (!password) {
      setError("Informe a senha.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailTrimmed, password }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Falha no login. Verifique as credenciais.");
      }
      router.push("/admin/dashboard");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-8 shadow-lg">
      <h1 className="text-2xl font-bold text-[var(--text)]">Acesso Admin</h1>
      <p className="mt-2 text-sm text-[var(--text-muted)]">Use suas credenciais para entrar no painel.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block text-sm font-semibold text-[var(--text)]">
          Email
          <div
            className={`mt-2 flex items-center gap-2 rounded-lg border bg-[var(--surface)] px-3 py-2 focus-within:ring-2 focus-within:ring-emerald-500 ${
              error?.toLowerCase().includes("email") ? "border-rose-300 ring-1 ring-rose-200" : "border-[var(--border)]"
            }`}
          >
            <Mail className="h-4 w-4 text-[var(--text-muted)]" aria-hidden />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent text-sm text-[var(--text)] outline-none"
              placeholder="admin@exemplo.com"
              autoComplete="email"
              aria-invalid={error?.toLowerCase().includes("email") || undefined}
            />
          </div>
        </label>

        <label className="block text-sm font-semibold text-[var(--text)]">
          Senha
          <div
            className={`mt-2 flex items-center gap-2 rounded-lg border bg-[var(--surface)] px-3 py-2 focus-within:ring-2 focus-within:ring-emerald-500 ${
              error?.toLowerCase().includes("senha") || error?.toLowerCase().includes("login") ? "border-rose-300 ring-1 ring-rose-200" : "border-[var(--border)]"
            }`}
          >
            <Lock className="h-4 w-4 text-[var(--text-muted)]" aria-hidden />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent text-sm text-[var(--text)] outline-none"
              placeholder="********"
              autoComplete="current-password"
              aria-invalid={error?.toLowerCase().includes("senha") || undefined}
            />
          </div>
        </label>

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
