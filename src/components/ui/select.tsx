import { ChevronDown } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/cn';

// ============================================================================
// SELECT COMPONENT
// ============================================================================

/**
 * Select - Campo de seleção estilizado e acessível
 * 
 * @example
 * <Select
 *   label="Sexo"
 *   options={[
 *     { value: 'male', label: 'Macho' },
 *     { value: 'female', label: 'Fêmea' }
 *   ]}
 *   value={selectedValue}
 *   onChange={(e) => setSelectedValue(e.target.value)}
 * />
 */

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helper?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ 
    className, 
    label, 
    helper, 
    error, 
    options,
    placeholder = 'Selecione...',
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
          <select
            ref={ref}
            id={inputId}
            className={cn(
              'flex h-10 w-full appearance-none rounded-lg border bg-[var(--surface)] pl-3 pr-10 py-2 text-sm text-[var(--text)]',
              'shadow-sm cursor-pointer',
              'focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error 
                ? 'border-[var(--error)] focus:ring-[var(--error)]' 
                : 'border-[var(--border)]',
              className
            )}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={cn(helperId, errorId)}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          
          {/* Ícone de seta */}
          <ChevronDown
            className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
            aria-hidden="true"
          />
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
