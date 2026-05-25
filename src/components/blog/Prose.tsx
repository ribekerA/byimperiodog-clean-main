import clsx from 'classnames';
import React from 'react';

interface ProseProps extends React.HTMLAttributes<HTMLDivElement> {
  spacious?: boolean;
}

export default function Prose({ className, children, spacious = false, ...rest }: ProseProps){
  return (
    <div
      className={clsx(
        'prose prose-lg max-w-none dark:prose-invert',
        // Cores de texto melhoradas
        'prose-headings:text-[var(--text)] prose-headings:font-bold',
        'prose-p:text-[var(--text)] prose-p:leading-relaxed',
        'prose-li:text-[var(--text)]',
        'prose-strong:text-[var(--text)] prose-strong:font-semibold',
        // Títulos
        'prose-h1:text-3xl prose-h1:tracking-tight prose-h1:mb-4',
        'prose-h2:text-2xl prose-h2:tracking-tight prose-h2:mt-12 prose-h2:mb-4',
        'prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3',
        'prose-h4:text-lg prose-h4:mt-6 prose-h4:mb-2',
        // Links com melhor contraste
        'prose-a:text-emerald-700 dark:prose-a:text-emerald-400',
        'prose-a:font-medium prose-a:underline prose-a:decoration-emerald-600/30',
        'hover:prose-a:decoration-emerald-600 dark:hover:prose-a:decoration-emerald-400',
        // Imagens
        'prose-img:rounded-xl prose-img:border prose-img:border-[var(--border)] prose-img:shadow-md',
        // Citações
        'prose-blockquote:border-l-4 prose-blockquote:border-l-emerald-600 dark:prose-blockquote:border-l-emerald-400',
        'prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-[var(--text-muted)]',
        // Código inline
        'prose-code:rounded-md prose-code:bg-zinc-100 dark:prose-code:bg-zinc-800',
        'prose-code:px-2 prose-code:py-1 prose-code:text-sm',
        'prose-code:text-emerald-700 dark:prose-code:text-emerald-300',
        'prose-code:font-mono prose-code:font-medium',
        'prose-code:before:content-none prose-code:after:content-none',
        // Listas
        'prose-ul:text-[var(--text)] prose-ol:text-[var(--text)]',
        'prose-li:marker:text-emerald-600 dark:prose-li:marker:text-emerald-400',
        // Tabelas
        'prose-table:text-[var(--text)]',
        'prose-thead:border-b-2 prose-thead:border-[var(--border)]',
        'prose-th:text-left prose-th:font-semibold prose-th:text-[var(--text)]',
        'prose-td:border-t prose-td:border-[var(--border)]',
        // Espaçamento adicional se necessário
        spacious && 'prose-p:my-6 prose-ul:my-6 prose-ol:my-6',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
