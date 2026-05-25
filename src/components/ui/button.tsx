import * as React from 'react';

import { cn } from '../../lib/cn';

// Implementação leve de cva local para evitar dependência externa agora
type CVADef = { variants: Record<string, Record<string,string>>; defaultVariants: Record<string,string> };
function cva(base:string, def:CVADef){
  return (opts:Record<string,any>)=>{
    let cls = base;
    for(const k of Object.keys(def.variants)){
      const v = (opts && opts[k]) || def.defaultVariants[k];
      if(v && def.variants[k][v]) cls += ' '+def.variants[k][v];
    }
    return cls;
  };
}
type VariantProps<T> = any;

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-[var(--bg)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none',
  {
    variants: {
      variant: {
        solid: 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm hover:bg-[var(--accent-hover)]',
        outline: 'border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--text)]',
        subtle: 'bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--surface)] border border-transparent',
        ghost: 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]',
        danger: 'bg-[var(--error)] text-white hover:bg-red-600',
      },
      size: {
        sm: 'h-8 px-3',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-base',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: { variant: 'solid', size: 'md' },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { loading?:boolean; variant?:'solid'|'outline'|'subtle'|'ghost'|'danger'; size?:'sm'|'md'|'lg'|'icon'; }

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button({ className, variant, size, loading, children, ...props }, ref){
  return (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), loading && 'relative', className)} {...props} aria-busy={loading||undefined}>
      {loading && <span className="absolute inset-0 flex items-center justify-center"><span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--accent-contrast)] border-t-transparent" /></span>}
      <span className={loading? 'opacity-0':''}>{children}</span>
    </button>
  );
});

export { buttonVariants };
