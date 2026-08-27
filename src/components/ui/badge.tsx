import * as React from 'react';

import { cn } from '@/lib/cn';

// ============================================================================
// BADGE COMPONENT
// ============================================================================

/**
 * Badge - Rótulo visual para status, tags, contadores
 *
 * @example
 * <Badge variant="success">Disponível</Badge>
 * <Badge variant="warning" size="sm">Reservado</Badge>
 * <Badge variant="error">Vendido</Badge>
 */

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'brand' | 'outline' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
}

const badgeVariants = {
  default: 'bg-[var(--surface-2)] text-[var(--text)] ring-1 ring-[var(--border)]',
  success: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300',
  warning: 'bg-amber-100 text-amber-800 ring-1 ring-amber-300',
  error: 'bg-rose-100 text-rose-800 ring-1 ring-rose-300',
  brand: 'bg-[var(--brand)] text-[var(--brand-foreground)]',
  outline: 'border border-[var(--border)] text-[var(--text-muted)] bg-transparent',
  neutral: 'bg-zinc-100 text-zinc-700 ring-1 ring-zinc-300',
};

const badgeSizes = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-xs px-3 py-1',
  lg: 'text-sm px-4 py-1.5',
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  function Badge({ className, variant = 'default', size = 'md', children, ...props }, ref) {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1 rounded-full font-semibold tracking-wide transition-colors',
          badgeVariants[variant],
          badgeSizes[size],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

// ============================================================================
// STATUS BADGE (Especialização para filhotes) — USO INTERNO, ADMIN APENAS
// ============================================================================
//
// Este selo NÃO pode aparecer em página pública. "Disponível", "Reservado" e
// "Vendido" são estado operacional do canil: eles vivem no painel, onde quem
// administra precisa enxergar a situação de cada filhote. Na vitrine, a mesma
// palavra vira promessa de estoque em cima de uma foto que continua no ar
// depois que o filhote encontra a família dele — e o site não tem como manter
// essa promessa verdadeira sem um deploy por venda.
//
// O último consumidor público foi src/components/puppy/PuppyHero.tsx, que
// carimbava o selo sobre a foto principal da ficha. Aquela pasta inteira estava
// órfã (nenhuma rota a importava) e foi removida em 26/08/2026. Se este
// componente voltar a ser importado por algo em app/(public), é regressão.

export interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: 'disponivel' | 'available' | 'reservado' | 'reserved' | 'vendido' | 'sold' | 'em-breve' | 'coming-soon';
}

export function StatusBadge({ status, ...props }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();

  const statusMap: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    disponivel: { variant: 'success', label: 'Disponível' },
    available: { variant: 'success', label: 'Disponível' },
    reservado: { variant: 'warning', label: 'Reservado' },
    reserved: { variant: 'warning', label: 'Reservado' },
    vendido: { variant: 'error', label: 'Vendido' },
    sold: { variant: 'error', label: 'Vendido' },
    'em-breve': { variant: 'neutral', label: 'Em breve' },
    'coming-soon': { variant: 'neutral', label: 'Em breve' },
  };

  const config = statusMap[normalizedStatus] || { variant: 'default', label: status };

  return (
    <Badge variant={config.variant} {...props} role="status" aria-label={`Status: ${config.label}`}>
      {config.label}
    </Badge>
  );
}