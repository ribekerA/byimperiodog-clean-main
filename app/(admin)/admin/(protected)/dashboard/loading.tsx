export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <div className="h-6 w-48 animate-pulse rounded bg-[var(--border)]" />
        <div className="h-4 w-64 animate-pulse rounded bg-[var(--border)]" />
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={`metric-skeleton-${idx}`} className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm">
            <div className="h-3 w-24 animate-pulse rounded bg-[var(--border)]" />
            <div className="mt-4 h-8 w-20 animate-pulse rounded bg-[var(--border)]" />
            <div className="mt-3 h-3 w-32 animate-pulse rounded bg-[var(--border)]" />
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
        <div className="h-5 w-40 animate-pulse rounded bg-[var(--border)]" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={`lead-skeleton-${idx}`} className="h-12 animate-pulse rounded bg-[var(--border)]/70" />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
        <div className="h-5 w-48 animate-pulse rounded bg-[var(--border)]" />
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={`issue-skeleton-${idx}`} className="h-20 animate-pulse rounded bg-[var(--border)]/70" />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
        <div className="h-5 w-56 animate-pulse rounded bg-[var(--border)]" />
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={`demand-skeleton-${idx}`} className="h-24 animate-pulse rounded bg-[var(--border)]/70" />
          ))}
        </div>
      </section>
    </div>
  );
}
