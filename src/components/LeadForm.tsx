"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { trackLeadFormSubmit } from "@/lib/events";
import { buildWhatsAppLink } from "@/lib/whatsapp";

type LeadFormContext = {
  pageType?: string;
  slug?: string;
  color?: string;
  city?: string;
  intent?: string;
};

type Props = {
  context?: LeadFormContext;
  className?: string;
};

// Validação do formulário (LGPD + campos de qualificação)
const schema = z.object({
  nome: z.string().min(2, "Informe seu nome completo"),
  telefone: z
    .string()
    .min(10, "Informe um WhatsApp válido com DDD")
    .regex(/^\d{10,11}$/, "Use apenas números (DDD + telefone)"),
  cidade: z.string().min(2, "Informe a cidade"),
  estado: z.string().length(2, "Informe a UF (ex: SP)").toUpperCase(),
  sexo_preferido: z
    .enum(["macho", "femea", "tanto_faz"], {
      errorMap: () => ({ message: "Selecione uma preferência" }),
    })
    .optional(),
  cor_preferida: z.string().optional(),
  prazo_aquisicao: z
    .enum(["imediato", "1_mes", "2_3_meses", "3_mais"], {
      errorMap: () => ({ message: "Selecione um prazo" }),
    })
    .optional(),
  mensagem: z.string().optional(),
  consent_lgpd: z.literal(true, {
    errorMap: () => ({ message: "É necessário aceitar a Política de Privacidade" }),
  }),
});

type FormValues = z.infer<typeof schema>;
type SubmitStatus = "idle" | "success" | "error";

export default function LeadForm({ context, className }: Props) {
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const whatsappUTMs = useMemo(
    () => ({
      utmSource: "lead_form",
      utmMedium: "form_main",
      utmCampaign: context?.color
        ? `filhotes_cor_${context.color}`
        : context?.city
          ? `filhotes_cidade_${context.city}`
          : "filhotes",
      utmContent: context?.slug ? `lead_${context.slug}` : "lead_geral",
    }),
    [context?.city, context?.color, context?.slug]
  );

  const onSubmit = async (data: FormValues) => {
    setStatus("idle");
    setErrorMessage(null);

    try {
      const payload = {
        ...data,
        consent_timestamp: new Date().toISOString(),
        consent_version: "1.0",
        page_type: context?.pageType,
        page_slug: context?.slug,
        page_color: context?.color,
        page_city: context?.city,
        page_intent: context?.intent,
      };

      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const payloadError = await response.json().catch(() => ({}));
        const errorMsg =
          payloadError?.error ||
          "Não foi possível enviar agora. Verifique os dados ou tente novamente em instantes.";
        throw new Error(errorMsg);
      }

      trackLeadFormSubmit("lead-form-main");

      setStatus("success");
      reset();

      setTimeout(() => {
        const mensagemWhatsApp = `Olá! Acabei de preencher o formulário no site. Meu nome é *${data.nome}* e estou interessado(a) em conhecer os filhotes disponíveis.${
          data.mensagem ? `\n\nMinhas observações: ${data.mensagem}` : ""
        }`;

        const whatsappURL = buildWhatsAppLink({
          message: mensagemWhatsApp,
          ...whatsappUTMs,
        });
        window.open(whatsappURL, "_blank");
      }, 1200);
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Erro inesperado. Recarregue a página e tente novamente."
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn(
        "mt-4 space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm",
        className
      )}
      noValidate
      aria-live="polite"
    >
      {/* Nome e WhatsApp */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="contato-nome" className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Nome completo *
          </label>
          <input
            id="contato-nome"
            type="text"
            autoComplete="name"
            {...register("nome")}
            aria-invalid={errors.nome ? "true" : "false"}
            aria-required="true"
            aria-describedby={errors.nome ? "erro-nome" : undefined}
            className="w-full rounded-xl border border-[var(--border)] bg-white/90 px-3 py-2 text-sm text-[var(--text)] shadow-sm placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40"
            placeholder="Ex: Ana Souza"
          />
          {errors.nome && (
            <p id="erro-nome" className="text-sm text-rose-600" role="alert">
              {errors.nome.message}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="contato-telefone"
            className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]"
          >
            WhatsApp *
          </label>
          <input
            id="contato-telefone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            {...register("telefone")}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
              setValue("telefone", digits, { shouldValidate: true });
            }}
            aria-invalid={errors.telefone ? "true" : "false"}
            aria-required="true"
            aria-describedby={errors.telefone ? "erro-telefone" : undefined}
            className="w-full rounded-xl border border-[var(--border)] bg-white/90 px-3 py-2 text-sm text-[var(--text)] shadow-sm placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40"
            placeholder="11999887766"
            maxLength={11}
          />
          <p className="text-[11px] text-[var(--text-muted)]" aria-live="polite">
            Somente números com DDD — ex: <span className="font-mono">11999887766</span>
          </p>
          {errors.telefone && (
            <p id="erro-telefone" className="text-sm text-rose-600" role="alert">
              {errors.telefone.message}
            </p>
          )}
        </div>
      </div>

      {/* Cidade e Estado */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="contato-cidade" className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Cidade *
          </label>
          <input
            id="contato-cidade"
            type="text"
            autoComplete="address-level2"
            {...register("cidade")}
            aria-invalid={errors.cidade ? "true" : "false"}
            aria-required="true"
            className="w-full rounded-xl border border-[var(--border)] bg-white/90 px-3 py-2 text-sm text-[var(--text)] shadow-sm placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40"
            placeholder="Ex: Bragança Paulista"
          />
          {errors.cidade && (
            <p className="text-sm text-rose-600" role="alert">
              {errors.cidade.message}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="contato-estado" className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            UF *
          </label>
          <input
            id="contato-estado"
            type="text"
            autoComplete="address-level1"
            {...register("estado")}
            aria-invalid={errors.estado ? "true" : "false"}
            aria-required="true"
            className="w-full rounded-xl border border-[var(--border)] bg-white/90 px-3 py-2 text-sm text-[var(--text)] shadow-sm placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40 uppercase"
            placeholder="SP"
            maxLength={2}
          />
          {errors.estado && (
            <p className="text-sm text-rose-600" role="alert">
              {errors.estado.message}
            </p>
          )}
        </div>
      </div>

      {/* Preferências */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="contato-sexo" className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Sexo do filhote
          </label>
          <select
            id="contato-sexo"
            {...register("sexo_preferido")}
            className="w-full select-styled rounded-xl border border-[var(--border)] bg-white/90 px-3 py-2 text-sm text-[var(--text)] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40"
          >
            <option value="">Selecione...</option>
            <option value="macho">Macho</option>
            <option value="femea">Fêmea</option>
            <option value="tanto_faz">Tanto faz</option>
          </select>
          {errors.sexo_preferido && (
            <p className="text-sm text-rose-600" role="alert">
              {errors.sexo_preferido.message}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="contato-cor" className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Cor preferida
          </label>
          <input
            id="contato-cor"
            type="text"
            {...register("cor_preferida")}
            className="w-full rounded-xl border border-[var(--border)] bg-white/90 px-3 py-2 text-sm text-[var(--text)] shadow-sm placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40"
            placeholder="Ex: creme, preto, particolor..."
          />
        </div>
      </div>

      {/* Prazo de aquisição */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="contato-prazo" className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
          Prazo para aquisição
        </label>
        <select
          id="contato-prazo"
          {...register("prazo_aquisicao")}
          className="w-full select-styled rounded-xl border border-[var(--border)] bg-white/90 px-3 py-2 text-sm text-[var(--text)] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40"
        >
          <option value="">Selecione...</option>
          <option value="imediato">Imediato (até 15 dias)</option>
          <option value="1_mes">Até 1 mês</option>
          <option value="2_3_meses">2 a 3 meses</option>
          <option value="3_mais">Mais de 3 meses</option>
        </select>
        {errors.prazo_aquisicao && (
          <p className="text-sm text-rose-600" role="alert">
            {errors.prazo_aquisicao.message}
          </p>
        )}
      </div>

      {/* Mensagem */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="contato-mensagem" className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
          Conte-nos mais
        </label>
        <textarea
          id="contato-mensagem"
          rows={4}
          {...register("mensagem")}
          className="w-full rounded-xl border border-[var(--border)] bg-white/90 px-3 py-2 text-sm text-[var(--text)] shadow-sm placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40"
          placeholder="Como será a rotina do filhote? Existe data ideal para a chegada?"
          aria-describedby={errors.mensagem ? "erro-mensagem" : undefined}
        />
        {errors.mensagem && (
          <p id="erro-mensagem" className="text-sm text-rose-600" role="alert">
            {errors.mensagem.message}
          </p>
        )}
      </div>

      {/* Consentimento LGPD */}
      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-2">
          <input
            id="contato-consent"
            type="checkbox"
            {...register("consent_lgpd")}
            aria-invalid={errors.consent_lgpd ? "true" : "false"}
            aria-required="true"
            aria-describedby="consent-description"
            className="mt-0.5 h-4 w-4 rounded border-[var(--border)] text-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/40"
          />
          <label htmlFor="contato-consent" className="text-xs leading-relaxed text-[var(--text-muted)]" id="consent-description">
            Li e aceito a{" "}
            <a
              href="/politica-de-privacidade"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--brand)] underline hover:no-underline"
            >
              Política de Privacidade
            </a>{" "}
            e autorizo o uso dos meus dados para contato sobre os filhotes. *
          </label>
        </div>
        {errors.consent_lgpd && (
          <p className="text-sm text-rose-600" role="alert">
            {errors.consent_lgpd.message}
          </p>
        )}
      </div>

      {/* Submit e feedback */}
      <div className="space-y-3">
        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className={cn(
            buttonVariants({ variant: "solid", size: "lg" }),
            "w-full justify-center gap-2 rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] shadow-md transition hover:brightness-110 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-70"
          )}
        >
          {isSubmitting && (
            <svg
              className="animate-spin-fast h-4 w-4 shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          )}
          {isSubmitting ? "Enviando..." : "Quero receber orientação personalizada"}
        </button>

        <div className="text-xs text-[var(--text-muted)]" aria-live="polite">
          {status === "success" && (
            <p className="rounded-xl bg-emerald-50 px-3 py-2 text-emerald-900">
              Tudo certo. Recebemos seu contato! Você será redirecionado ao WhatsApp em instantes.
            </p>
          )}
          {status === "error" && errorMessage && (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-rose-600">
              Ops, não conseguimos enviar. {errorMessage}
            </p>
          )}
        </div>

        <p className="text-xs text-[var(--text-muted)]">
          * Campos obrigatórios. Respondemos de segunda a sábado, das 9h às 19h. Seus dados são protegidos conforme
          LGPD.
        </p>
      </div>
    </form>
  );
}
