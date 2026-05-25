import * as React from 'react';

import { cn } from '@/lib/cn';

// ============================================================================
// CARD COMPONENTS
// ============================================================================

/**
 * Card - Container reutilizável para agrupar conteúdo relacionado
 * 
 * Composição:
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Título</CardTitle>
 *     <CardDescription>Descrição</CardDescription>
 *   </CardHeader>
 *   <CardContent>Conteúdo principal</CardContent>
 *   <CardFooter>Ações</CardFooter>
 * </Card>
 * 
 * @example
 * <Card variant="elevated">
 *   <CardHeader>
 *     <CardTitle>Filhote Disponível</CardTitle>
 *   </CardHeader>
 *   <CardContent>
 *     <p>Detalhes do filhote...</p>
 *   </CardContent>
 * </Card>
 */

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outline' | 'highlight';
  interactive?: boolean;
}

const cardVariants = {
  default: 'bg-[var(--surface)] border border-[var(--border)] shadow-sm',
  elevated: 'bg-[var(--surface)] border border-[var(--border)] shadow-lg',
  outline: 'bg-transparent border-2 border-[var(--border)]',
  highlight: 'bg-gradient-to-br from-[var(--surface)] to-[var(--surface-2)] border border-[var(--border)] shadow-md',
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  function Card({ className, variant = 'default', interactive = false, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl transition-all duration-200',
          cardVariants[variant],
          interactive && 'hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 cursor-pointer',
          className
        )}
        {...props}
      />
    );
  }
);

// ============================================================================
// CARD HEADER
// ============================================================================

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  function CardHeader({ className, noPadding = false, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col space-y-1.5',
          !noPadding && 'p-5 sm:p-6',
          className
        )}
        {...props}
      />
    );
  }
);

// ============================================================================
// CARD TITLE
// ============================================================================

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  function CardTitle({ className, as: Comp = 'h3', ...props }, ref) {
    return (
      <Comp
        ref={ref}
        className={cn(
          'text-lg font-semibold leading-tight tracking-tight text-[var(--text)]',
          className
        )}
        {...props}
      />
    );
  }
);

// ============================================================================
// CARD DESCRIPTION
// ============================================================================

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(function CardDescription({ className, ...props }, ref) {
  return (
    <p
      ref={ref}
      className={cn('text-sm text-[var(--text-muted)] leading-relaxed', className)}
      {...props}
    />
  );
});

// ============================================================================
// CARD CONTENT
// ============================================================================

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
}

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  function CardContent({ className, noPadding = false, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(!noPadding && 'p-5 sm:p-6 pt-0', className)}
        {...props}
      />
    );
  }
);

// ============================================================================
// CARD FOOTER
// ============================================================================

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
}

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  function CardFooter({ className, noPadding = false, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center',
          !noPadding && 'p-5 sm:p-6 pt-0',
          className
        )}
        {...props}
      />
    );
  }
);
