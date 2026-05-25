import { Search, Package, AlertCircle, FileQuestion } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/cn';

import { Button, type ButtonProps } from './button';

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================

/**
 * EmptyState - Estado vazio com ícone, título, descrição e ação opcional
 * 
 * @example
 * <EmptyState
 *   variant="search"
 *   title="Nenhum filhote encontrado"
 *   description="Tente ajustar os filtros de busca"
 *   action={{
 *     label: "Limpar filtros",
 *     onClick: handleClearFilters
 *   }}
 * />
 */

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'search' | 'error' | 'empty';
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: ButtonProps['variant'];
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

const emptyStateVariants = {
  default: {
    container: 'border-zinc-200 bg-zinc-50/50',
    icon: 'bg-zinc-100 text-zinc-400',
    IconComponent: Package,
  },
  search: {
    container: 'border-zinc-200 bg-zinc-50/50',
    icon: 'bg-zinc-100 text-zinc-400',
    IconComponent: Search,
  },
  error: {
    container: 'border-rose-200 bg-rose-50/50',
    icon: 'bg-rose-100 text-rose-600',
    IconComponent: AlertCircle,
  },
  empty: {
    container: 'border-zinc-200 bg-zinc-50/50',
    icon: 'bg-zinc-100 text-zinc-400',
    IconComponent: FileQuestion,
  },
};

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  function EmptyState({ 
    className,
    variant = 'default',
    icon,
    title,
    description,
    action,
    secondaryAction,
    ...props 
  }, ref) {
    const config = emptyStateVariants[variant];
    const DefaultIcon = config.IconComponent;
    
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center gap-6 rounded-2xl border-2 border-dashed px-6 py-16 text-center',
          config.container,
          className
        )}
        {...props}
      >
        {/* Ícone */}
        <div className={cn(
          'flex h-16 w-16 items-center justify-center rounded-full',
          config.icon
        )}>
          {icon || <DefaultIcon className="h-8 w-8" aria-hidden="true" />}
        </div>
        
        {/* Conteúdo */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-zinc-900">
            {title}
          </h3>
          
          {description && (
            <p className="text-sm text-zinc-600 max-w-md">
              {description}
            </p>
          )}
        </div>
        
        {/* Ações */}
        {(action || secondaryAction) && (
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {action && (
              <Button
                onClick={action.onClick}
                variant={action.variant || 'solid'}
                size="md"
              >
                {action.label}
              </Button>
            )}
            
            {secondaryAction && (
              <Button
                onClick={secondaryAction.onClick}
                variant="outline"
                size="md"
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }
);
