import * as React from 'react';

import { cn } from '@/lib/cn';

// ============================================================================
// INPUT COMPONENT
// ============================================================================

/**
 * Input - Campo de entrada de texto com validação e ícones
 * 
 * @example
 * <Input
 *   label="Nome"
 *   placeholder="Digite seu nome"
 *   error="Campo obrigatório"
 *   leftIcon={<User />}
 * />
 */

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helper?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ 
    className, 
    label, 
    helper, 
    error, 
    leftIcon,
    rightIcon,
    type = 'text',
    id,
    ...props 
  }, ref) {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const helperId = helper ? `${inputId}-helper` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    
    return (
      <div className="w-full space-y-2">
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-[var(--text)]"
          >
            {label}
            {props.required && <span className="ml-1 text-[var(--error)]" aria-label="obrigatório">*</span>}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              {leftIcon}
            </div>
          )}
          
          <input 
            ref={ref}
            id={inputId}
            type={type}
            className={cn(
              'flex h-10 w-full rounded-lg border bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]',
              'shadow-sm',
              'focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]',
              'disabled:cursor-not-allowed disabled:opacity-50',
              !!leftIcon && 'pl-10',
              !!rightIcon && 'pr-10',
              error 
                ? 'border-[var(--error)] focus:ring-[var(--error)]' 
                : 'border-[var(--border)]',
              className
            )} 
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={cn(helperId, errorId)}
            {...props}
          />
          
          {rightIcon && (
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              {rightIcon}
            </div>
          )}
        </div>
        
        {helper && !error && (
          <p id={helperId} className="text-xs text-[var(--text-muted)]">
            {helper}
          </p>
        )}
        
        {error && (
          <p id={errorId} className="text-xs text-[var(--error)]" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);
