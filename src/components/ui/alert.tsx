import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/cn';

// ============================================================================
// ALERT COMPONENT
// ============================================================================

/**
 * Alert - Mensagem contextual para feedback visual
 * 
 * @example
 * <Alert variant="success" title="Sucesso!" dismissible>
 *   Filhote reservado com sucesso!
 * </Alert>
 * 
 * <Alert variant="error" title="Erro">
 *   Não foi possível processar sua solicitação.
 * </Alert>
 */

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: React.ReactNode;
}

const alertVariants = {
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-900',
    icon: 'text-blue-600',
    IconComponent: Info,
  },
  success: {
    container: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    icon: 'text-emerald-600',
    IconComponent: CheckCircle2,
  },
  warning: {
    container: 'bg-amber-50 border-amber-200 text-amber-900',
    icon: 'text-amber-600',
    IconComponent: AlertTriangle,
  },
  error: {
    container: 'bg-rose-50 border-rose-200 text-rose-900',
    icon: 'text-rose-600',
    IconComponent: AlertCircle,
  },
};

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  function Alert({ 
    className, 
    variant = 'info', 
    title, 
    dismissible = false,
    onDismiss,
    icon,
    children,
    ...props 
  }, ref) {
    const [dismissed, setDismissed] = React.useState(false);
    const config = alertVariants[variant];
    const DefaultIcon = config.IconComponent;
    
    const handleDismiss = () => {
      setDismissed(true);
      onDismiss?.();
    };
    
    if (dismissed) return null;
    
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          'relative rounded-xl border p-4 shadow-sm',
          config.container,
          className
        )}
        {...props}
      >
        <div className="flex gap-3">
          {/* Ícone */}
          <div className={cn('flex-shrink-0', config.icon)}>
            {icon || <DefaultIcon className="h-5 w-5" aria-hidden="true" />}
          </div>
          
          {/* Conteúdo */}
          <div className="flex-1 space-y-1">
            {title && (
              <h5 className="font-semibold leading-tight tracking-tight">
                {title}
              </h5>
            )}
            
            {children && (
              <div className="text-sm leading-relaxed">
                {children}
              </div>
            )}
          </div>
          
          {/* Botão de fechar */}
          {dismissible && (
            <button
              type="button"
              onClick={handleDismiss}
              className={cn(
                'flex-shrink-0 rounded-lg p-1 transition-colors hover:bg-black/5',
                config.icon
              )}
              aria-label="Fechar alerta"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    );
  }
);

// ============================================================================
// ALERT TITLE (composição)
// ============================================================================

export const AlertTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(function AlertTitle({ className, children, ...props }, ref) {
  return (
    <h5
      ref={ref}
      className={cn('font-semibold leading-tight tracking-tight', className)}
      {...props}
    >
      {children}
    </h5>
  );
});

// ============================================================================
// ALERT DESCRIPTION (composição)
// ============================================================================

export const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(function AlertDescription({ className, ...props }, ref) {
  return (
    <p
      ref={ref}
      className={cn('text-sm leading-relaxed', className)}
      {...props}
    />
  );
});
