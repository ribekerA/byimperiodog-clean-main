"use client";

import { useState } from "react";
import { CheckCircle, FileText, Loader2, Paperclip, Upload } from "lucide-react";

type Props = {
  code: string;
  puppyName?: string;
};

type Step = "form" | "sending" | "success" | "error";

type FileState = { file: File; preview?: string } | null;

function FileInput({
  label, hint, name, onChange, value,
}: {
  label: string; hint: string; name: string;
  onChange: (f: File | null) => void;
  value: FileState;
}) {
  return (
    <div>
      <p className="mb-1 text-sm font-semibold text-zinc-700">{label}</p>
      <p className="mb-2 text-xs text-zinc-400">{hint}</p>
      <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-500 hover:border-emerald-400 hover:bg-emerald-50/50 transition">
        <input
          type="file"
          name={name}
          accept=".pdf,image/*"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            onChange(f);
          }}
        />
        {value ? (
          <>
            <Paperclip className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span className="text-emerald-700 font-medium truncate">{value.file.name}</span>
            <span className="ml-auto text-[10px] text-zinc-400 flex-shrink-0">
              {(value.file.size / 1024).toFixed(0)} KB
            </span>
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 flex-shrink-0" />
            <span>Selecionar arquivo</span>
          </>
        )}
      </label>
    </div>
  );
}

export default function ContractForm({ code, puppyName }: Props) {
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState<string | null>(null);
  const [hemograma, setHemograma] = useState<FileState>(null);
  const [laudo,     setLaudo]     = useState<FileState>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setStep("sending");

    const fd   = new FormData(e.currentTarget);
    const nome = String(fd.get("nome") ?? "").trim();
    const cpf  = String(fd.get("cpf")  ?? "").replace(/\D/g, "");

    if (!nome || nome.length < 3)  { setError("Nome completo é obrigatório"); setStep("form"); return; }
    if (cpf.length < 11)           { setError("CPF inválido");               setStep("form"); return; }
    if (!fd.get("telefone"))       { setError("Telefone é obrigatório");     setStep("form"); return; }
    if (!fd.get("endereco"))       { setError("Endereço é obrigatório");     setStep("form"); return; }

    const form = new FormData();
    form.append("code", code);
    form.append("payload", JSON.stringify({
      nome,
      cpf,
      email:      String(fd.get("email")      ?? ""),
      telefone:   String(fd.get("telefone")   ?? "").replace(/\D/g, ""),
      endereco:   String(fd.get("endereco")   ?? ""),
      nascimento: String(fd.get("nascimento") ?? ""),
    }));
    if (hemograma?.file) form.append("hemograma", hemograma.file);
    if (laudo?.file)     form.append("laudo",     laudo.file);

    try {
      const res = await fetch("/api/contract", { method: "POST", body: form });
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
        <h2 className="text-xl font-bold text-emerald-900">Dados enviados com sucesso!</h2>
        <p className="text-sm text-emerald-700 max-w-sm mx-auto leading-relaxed">
          Recebemos suas informações{puppyName ? ` sobre o ${puppyName}` : ""}. Nossa criadora entrará em contato em breve para finalizar.
        </p>
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-xs font-semibold text-emerald-800">
          <FileText className="h-3.5 w-3.5" />
          Código: <span className="font-mono">{code}</span>
        </div>
        <p className="text-xs text-emerald-600">Guarde este código para referência futura.</p>
      </div>
    );
  }

  const inputCls = "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-800 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400/30 placeholder:text-zinc-400";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Dados pessoais */}
      <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Dados do comprador</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-zinc-600">Nome completo *</label>
            <input name="nome" required placeholder="Como consta no RG/CNH" className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-600">CPF *</label>
            <input name="cpf" required placeholder="000.000.000-00" className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-600">Data de nascimento</label>
            <input name="nascimento" type="date" className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-600">Telefone / WhatsApp *</label>
            <input name="telefone" required placeholder="(11) 99999-9999" className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-600">E-mail</label>
            <input name="email" type="email" placeholder="seu@email.com" className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-zinc-600">Endereço completo *</label>
            <input name="endereco" required placeholder="Rua, número, bairro, cidade — UF" className={inputCls} />
          </div>
        </div>
      </section>

      {/* Documentos da entrega */}
      <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Documentos do filhote</h2>
          <p className="mt-1 text-xs text-zinc-400">
            Envie os laudos recebidos no ato da entrega. Formatos aceitos: PDF, JPG, PNG (máx. 10 MB cada).
          </p>
        </div>
        <FileInput
          label="Hemograma completo"
          hint="Resultado do exame de sangue emitido pelo veterinário"
          name="hemograma"
          value={hemograma}
          onChange={(f) => setHemograma(f ? { file: f } : null)}
        />
        <FileInput
          label="Laudo veterinário"
          hint="Atestado de saúde e vacinação assinado pelo médico veterinário"
          name="laudo"
          value={laudo}
          onChange={(f) => setLaudo(f ? { file: f } : null)}
        />
      </section>

      <button
        type="submit"
        disabled={step === "sending"}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {step === "sending" ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
        ) : (
          <><FileText className="h-4 w-4" /> Confirmar dados do contrato</>
        )}
      </button>

      <p className="text-center text-xs text-zinc-400">
        Seus dados são protegidos conforme a LGPD. Código do contrato:{" "}
        <span className="font-mono font-semibold">{code}</span>
      </p>
    </form>
  );
}
