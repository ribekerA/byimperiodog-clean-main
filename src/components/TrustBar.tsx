"use client";

/**
 * TrustBar — Prova social compacta para inserir próximo a CTAs.
 *
 * Exibe: famílias atendidas | tempo de resposta | localização.
 * Usado na homepage hero, página de filhote e formulário de lead.
 *
 * Não exibimos nota (★ 5.0): não existe plataforma pública de avaliações
 * verificadas do canil, então qualquer média seria inventada.
 */

interface TrustBarProps {
  className?: string;
  variant?: "light" | "dark";
}

export default function TrustBar({ className = "", variant = "light" }: TrustBarProps) {
  const textColor = variant === "dark" ? "text-white/80" : "text-zinc-500";
  const dividerColor = variant === "dark" ? "text-white/30" : "text-zinc-300";

  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs ${textColor} ${className}`}
      aria-label="Credenciais do canil"
    >
      {/* Famílias atendidas */}
      <span className="flex items-center gap-1">
        <span aria-hidden="true">🐾</span>
        <span className="font-semibold">Mais de 180 famílias atendidas</span>
      </span>

      <span className={dividerColor} aria-hidden="true">·</span>

      {/* Resposta rápida */}
      <span className="flex items-center gap-1">
        <span aria-hidden="true">⚡</span>
        <span>Resposta em até 2 horas</span>
      </span>

      <span className={dividerColor} aria-hidden="true">·</span>

      {/* Localização */}
      <span className="flex items-center gap-1">
        <span aria-hidden="true">📍</span>
        <span>Bragança Paulista, SP</span>
      </span>
    </div>
  );
}
