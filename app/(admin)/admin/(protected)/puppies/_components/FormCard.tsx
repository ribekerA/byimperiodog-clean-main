"use client";
import React from 'react';

interface FormCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  footer?: React.ReactNode;
  asFieldset?: boolean;
}

export function FormCard({ title, description, className='', children, footer, asFieldset=false, ...rest }: FormCardProps){
  const Wrapper: any = asFieldset ? 'fieldset' : 'div';
  return (
    <Wrapper className={`rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 md:p-5 grid gap-4 ${className}`} {...rest}>
      {(title || description) && (
        <div className="grid gap-1">
          {title && (asFieldset ? <legend className="text-sm font-semibold tracking-tight">{title}</legend> : <h3 className="text-sm font-semibold tracking-tight">{title}</h3>)}
          {description && <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">{description}</p>}
        </div>
      )}
      <div className="grid gap-3">
        {children}
      </div>
      {footer && (
        <div className="pt-2 border-t border-[var(--border)] mt-1">
          {footer}
        </div>
      )}
    </Wrapper>
  );
}
