import React from 'react';

interface Props { title?:string; children:React.ReactNode; actions?:React.ReactNode; padded?:boolean; id?:string; }

export function Panel({ title, children, actions, padded=true, id }: Props){
  const Heading = title? 'h2':'div';
  return (
    <section id={id} aria-labelledby={title? `${id||title}-heading`:undefined} className="relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
      {(title || actions) && (
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-5 py-3">
          {title && <Heading id={`${id||title}-heading`} className="text-sm font-semibold tracking-wide text-[var(--text)]">{title}</Heading>}
          <div className="ml-auto flex items-center gap-2 text-xs text-[var(--text-muted)]">{actions}</div>
        </div>
      )}
      <div className={padded? 'p-5':'p-0'}>{children}</div>
    </section>
  );
}
