"use client";

import { CheckCircle, FileText, Loader2, Paperclip, Upload } from "lucide-react";
import { useState } from "react";

import SignaturePad from "@/components/SignaturePad";

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = { code: string; puppyName?: string; puppyColor?: string; puppySex?: string };
type Step  = "form" | "sending" | "success" | "error";
type FileState = { file: File } | null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400/30";

function FileInput({ label, hint, name, value, onChange }: {
  label: string; hint: string; name: string;
  value: FileState; onChange: (f: File | null) => void;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold text-zinc-600">{label}</p>
      <p className="mb-2 text-[10px] text-zinc-400">{hint}</p>
      <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-500 hover:border-emerald-400 hover:bg-emerald-50/50 transition">
        <input type="file" name={name} accept=".pdf,image/*" className="sr-only"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
        {value ? (
          <><Paperclip className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span className="flex-1 truncate font-medium text-emerald-700">{value.file.name}</span>
            <span className="flex-shrink-0 text-[10px] text-zinc-400">{(value.file.size / 1024).toFixed(0)} KB</span></>
        ) : (
          <><Upload className="h-4 w-4 flex-shrink-0" /><span>Selecionar arquivo</span></>
        )}
      </label>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ContractForm({ code, puppyName, puppyColor, puppySex }: Props) {
  const [step,      setStep]      = useState<Step>("form");
  const [error,     setError]     = useState<string | null>(null);
  const [hemograma, setHemograma] = useState<FileState>(null);
  const [laudo,     setLaudo]     = useState<FileState>(null);
  const [signature, setSignature] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!signature) { setError("A assinatura digital é obrigatória."); return; }

    setStep("sending");
    const fd = new FormData(e.currentTarget);

    const nome     = String(fd.get("nome")     ?? "").trim();
    const cpf      = String(fd.get("cpf")      ?? "").replace(/\D/g, "");
    const telefone = String(fd.get("telefone") ?? "").replace(/\D/g, "");

    if (nome.length < 3)   { setError("Nome completo é obrigatório"); setStep("form"); return; }
    if (cpf.length  < 11)  { setError("CPF inválido");               setStep("form"); return; }
    if (!telefone)          { setError("Telefone é obrigatório");     setStep("form"); return; }
    if (!fd.get("endereco")){ setError("Endereço é obrigatório");     setStep("form"); return; }

    // Filhote — pré-preenchido pelo admin ou deixado em branco
    const nomeFilhote = String(fd.get("nome_filhote") ?? puppyName  ?? "").trim();
    const cor         = String(fd.get("cor")          ?? puppyColor ?? "").trim();
    const sexo        = String(fd.get("sexo")         ?? puppySex   ?? "").trim();
    const nascimento  = String(fd.get("nascimento_filhote") ?? "").trim();

    const form = new FormData();
    form.append("code", code);
    form.append("payload", JSON.stringify({
      // Comprador
      nome,
      cpf,
      rg:         String(fd.get("rg")         ?? ""),
      email:      String(fd.get("email")      ?? ""),
      telefone,
      endereco:   String(fd.get("endereco")   ?? ""),
      nascimento: String(fd.get("nascimento") ?? ""),
      // Filhote
      nome_filhote: nomeFilhote,
      cor,
      sexo,
      nascimento_filhote: nascimento,
      // Meta
      ip_timestamp: new Date().toISOString(),
    }));
    form.append("signature", signature); // base64 PNG
    if (hemograma?.file) form.append("hemograma", hemograma.file);
    if (laudo?.file)     form.append("laudo",     laudo.file);

    try {
      const res  = await fetch("/api/contract", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao enviar");
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar contrato. Tente novamente.");
      setStep("form");
    }
  };

  if (step === "success") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center space-y-4">
        <CheckCircle className="mx-auto h-14 w-14 text-emerald-500" />
        <h2 className="text-xl font-bold text-emerald-900">Contrato assinado com sucesso!</h2>
        <p className="text-sm text-emerald-700 max-w-sm mx-auto leading-relaxed">
          Seus dados foram registrados e a assinatura digital foi salva com validade jurídica.
          Nossa equipe entrará em contato em breve.
        </p>
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-xs font-semibold text-emerald-800">
          <FileText className="h-3.5 w-3.5" />
          Código: <span className="font-mono">{code}</span>
        </div>
        <p className="text-xs text-emerald-600">
          Guarde este código. Use-o para consultar o contrato a qualquer momento.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div role="alert" aria-live="assertive" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      {/* ── Dados do comprador ──────────────────────────────────────── */}
      <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Dados do comprador</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="nome" className="mb-1 block text-xs font-semibold text-zinc-600">Nome completo *</label>
            <input id="nome" name="nome" required placeholder="Exatamente como consta no documento" className={inputCls} />
          </div>
          <div>
            <label htmlFor="cpf" className="mb-1 block text-xs font-semibold text-zinc-600">CPF *</label>
            <input id="cpf" name="cpf" required placeholder="000.000.000-00" className={inputCls} />
          </div>
          <div>
            <label htmlFor="rg" className="mb-1 block text-xs font-semibold text-zinc-600">RG</label>
            <input id="rg" name="rg" placeholder="000000000" className={inputCls} />
          </div>
          <div>
            <label htmlFor="telefone" className="mb-1 block text-xs font-semibold text-zinc-600">Telefone / WhatsApp *</label>
            <input id="telefone" name="telefone" required placeholder="(11) 99999-9999" className={inputCls} />
          </div>
          <div>
            <label htmlFor="nascimento" className="mb-1 block text-xs font-semibold text-zinc-600">Data de nascimento</label>
            <input id="nascimento" name="nascimento" type="date" className={inputCls} />
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-semibold text-zinc-600">E-mail</label>
            <input id="email" name="email" type="email" placeholder="seu@email.com" className={inputCls} />
          </div>
          <div>
            <label htmlFor="endereco" className="mb-1 block text-xs font-semibold text-zinc-600">Endereço completo *</label>
            <input id="endereco" name="endereco" required placeholder="Rua, nº, bairro, cidade — UF" className={inputCls} />
          </div>
        </div>
      </section>

      {/* ── Dados do filhote ────────────────────────────────────────── */}
      <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Dados do filhote</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="nome_filhote" className="mb-1 block text-xs font-semibold text-zinc-600">Nome do filhote</label>
            <input id="nome_filhote" name="nome_filhote" defaultValue={puppyName ?? ""} placeholder="Nome dado ao filhote" className={inputCls} />
          </div>
          <div>
            <label htmlFor="nascimento_filhote" className="mb-1 block text-xs font-semibold text-zinc-600">Data de nascimento</label>
            <input id="nascimento_filhote" name="nascimento_filhote" type="date" className={inputCls} />
          </div>
          <div>
            <label htmlFor="cor" className="mb-1 block text-xs font-semibold text-zinc-600">Cor</label>
            <input id="cor" name="cor" defaultValue={puppyColor ?? ""} placeholder="Ex.: Laranja, Creme, Preto" className={inputCls} />
          </div>
          <div>
            <label htmlFor="sexo" className="mb-1 block text-xs font-semibold text-zinc-600">Sexo</label>
            <select id="sexo" name="sexo" defaultValue={puppySex ?? ""} className={inputCls}>
              <option value="">Selecione</option>
              <option value="Fêmea">Fêmea</option>
              <option value="Macho">Macho</option>
            </select>
          </div>
        </div>
      </section>

      {/* ── Documentos da entrega ───────────────────────────────────── */}
      <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Documentos do filhote</h2>
          <p className="mt-1 text-[11px] text-zinc-400">PDF, JPG ou PNG — máx. 10 MB cada.</p>
        </div>
        <FileInput label="Hemograma completo" hint="Exame de sangue emitido pelo veterinário (CRMV)"
          name="hemograma" value={hemograma} onChange={(f) => setHemograma(f ? { file: f } : null)} />
        <FileInput label="Laudo / Atestado veterinário" hint="Atestado de saúde e vacinação assinado pelo médico veterinário"
          name="laudo" value={laudo} onChange={(f) => setLaudo(f ? { file: f } : null)} />
      </section>

      {/* ── Assinatura digital ──────────────────────────────────────── */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Assinatura digital</h2>
          <p className="mt-1 text-[11px] text-zinc-400">
            Ao assinar, você confirma que leu e concorda com todos os termos do contrato.
            A assinatura digital tem validade jurídica conforme a MP 2.200-2/2001 e a Lei 14.063/2020.
          </p>
        </div>
        <SignaturePad onChange={setSignature} />
      </section>

      <button type="submit" disabled={step === "sending" || !signature}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
        {step === "sending"
          ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
          : <><FileText className="h-4 w-4" /> Assinar e confirmar contrato</>}
      </button>

      <p className="text-center text-xs text-zinc-400">
        Dados protegidos (LGPD) · Código: <span className="font-mono font-semibold">{code}</span>
      </p>
    </form>
  );
}
