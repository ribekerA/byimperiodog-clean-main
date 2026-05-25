import * as React from 'react';

import { cn } from '@/lib/cn';

// ============================================================================
// TEXTAREA COMPONENT
// ============================================================================

/**
 * Textarea - Campo de texto multilinha com validação e contador de caracteres
 * 
 * @example
 * <Textarea
 *   label="Mensagem"
 *   placeholder="Digite sua mensagem..."
 *   maxLength={500}
 *   showCounter
 *   error="Campo obrigatório"
 * />
 */

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helper?: string;
  error?: string;
  showCounter?: boolean;
  maxLength?: number;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ 
    className, 
    label, 
    helper, 
    error, 
    showCounter = false,
    maxLength,
    id,
    ...props 
  }, ref) {
    const [charCount, setCharCount] = React.useState(0);
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const helperId = helper ? `${inputId}-helper` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length);
      props.onChange?.(e);
    };
    
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
        
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'flex min-h-[80px] w-full rounded-lg border bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]',
            'shadow-sm resize-y',
            'focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error 
              ? 'border-[var(--error)] focus:ring-[var(--error)]' 
              : 'border-[var(--border)]',
            className
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={cn(helperId, errorId)}
          maxLength={maxLength}
          onChange={handleChange}
          {...props}
        />
        
        <div className="flex items-center justify-between">
          <div className="flex-1">
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
          
          {showCounter && maxLength && (
            <span 
              className={cn(
                'text-xs',
                charCount > maxLength * 0.9 ? 'text-[var(--warning)]' : 'text-[var(--text-muted)]'
              )}
              aria-live="polite"
            >
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);
