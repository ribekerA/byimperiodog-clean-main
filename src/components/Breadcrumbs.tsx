import clsx from 'classnames';
import Link from 'next/link';

type Crumb = {
  label: string;
  href?: string;
};

export default function Breadcrumbs({
  items,
  className,
}: {
  items: Crumb[];
  className?: string;
}) {
  if (!items?.length) return null;
  return (
    <nav aria-label="breadcrumb" className={clsx('text-sm text-zinc-600', className)}>
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((it, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${it.label}-${i}`} className="flex items-center gap-2">
              {it.href && !isLast ? (
                <Link href={it.href} className="hover:underline text-zinc-700">
                  {it.label}
                </Link>
              ) : (
                <span className="text-zinc-500" aria-current={isLast ? 'page' : undefined}>
                  {it.label}
                </span>
              )}
              {!isLast && <span className="text-zinc-400">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
