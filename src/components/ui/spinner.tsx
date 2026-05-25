import * as React from 'react';

import { cn } from '@/lib/cn';

// ============================================================================
// SPINNER COMPONENT
// ============================================================================

/**
 * Spinner - Indicador de carregamento
 * 
 * @example
 * <Spinner size="sm" />
 * <Spinner size="lg" variant="brand" />
 */

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'brand' | 'accent' | 'white';
}

const spinnerSizes = {
  xs: 'h-3 w-3 border',
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-2',
  xl: 'h-12 w-12 border-[3px]',
};

const spinnerVariants = {
  default: 'border-[var(--border)] border-t-[var(--text)]',
  brand: 'border-emerald-100 border-t-[var(--brand)]',
  accent: 'border-amber-100 border-t-[var(--accent)]',
  white: 'border-white/20 border-t-white',
};

export const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  function Spinner({ className, size = 'md', variant = 'default', ...props }, ref) {
    return (
      <div
        ref={ref}
        role="status"
        aria-label="Carregando"
        className={cn('inline-block', className)}
        {...props}
      >
        <div
          className={cn(
            'animate-spin rounded-full',
            spinnerSizes[size],
            spinnerVariants[variant]
          )}
        />
        <span className="sr-only">Carregando...</span>
      </div>
    );
  }
);

// ============================================================================
// INLINE SPINNER (para usar dentro de botões, etc)
// ============================================================================

export interface InlineSpinnerProps extends SpinnerProps {
  label?: string;
}

export function InlineSpinner({ label = 'Carregando...', ...props }: InlineSpinnerProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <Spinner {...props} />
      {label && <span className="text-sm">{label}</span>}
    </span>
  );
}
