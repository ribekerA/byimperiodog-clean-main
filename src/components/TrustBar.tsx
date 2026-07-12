"use client";

/**
 * TrustBar — Prova social compacta para inserir próximo a CTAs.
 *
 * Exibe: avaliação ★ 5.0 | famílias atendidas | tempo de resposta.
 * Usado na homepage hero, página de filhote e formulário de lead.
 */

interface TrustBarProps {
  className?: string;
  variant?: "light" | "dark";
}

export default function TrustBar({ className = "", variant = "light" }: TrustBarProps) {
  const textColor = variant === "dark" ? "text-white/80" : "text-zinc-500";
  const starColor = variant === "dark" ? "text-yellow-300" : "text-yellow-500";
  const dividerColor = variant === "dark" ? "text-white/30" : "text-zinc-300";

  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs ${textColor} ${className}`}
      aria-label="Avaliações e credenciais"
    >
      {/* Estrelas */}
      <span className="flex items-center gap-1">
        <span className={`flex ${starColor}`} aria-hidden="true">
          {"★★★★★"}
        </span>
        <span className="font-semibold">5.0</span>
        <span className="font-normal opacity-75">(180+ famílias)</span>
      </span>

      <span className={dividerColor} aria-hidden="true">·</span>

      {/* Resposta rápida */}
      <span className="flex items-center gap-1">
        <span aria-hidden="true">⚡</span>
        <span>Resposta em até 30 min</span>
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
