type Props = {
  title?: string;
  message?: string;
  actionHref?: string;
  actionLabel?: string;
};

export function AdminErrorState({ title = "Falha ao carregar", message = "Ocorreu um erro inesperado.", actionHref = "/admin", actionLabel = "Tentar novamente" }: Props) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-8 text-center text-[var(--text)]">
      <p className="text-lg font-semibold text-rose-700">{title}</p>
      <p className="mt-2 text-sm text-rose-700/80">{message}</p>
      <div className="mt-4">
        <a
          href={actionHref}
          className="inline-flex items-center justify-center rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500"
        >
          {actionLabel}
        </a>
      </div>
    </div>
  );
}
