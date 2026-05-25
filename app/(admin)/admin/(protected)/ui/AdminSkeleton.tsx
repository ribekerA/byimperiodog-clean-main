export function AdminSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-48 animate-pulse rounded-full bg-[var(--surface)]" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, idx) => (
          <div key={idx} className="h-24 animate-pulse rounded-xl bg-[var(--surface)]" />
        ))}
      </div>
      <div className="space-y-2">
        {[...Array(3)].map((_, idx) => (
          <div key={idx} className="h-12 animate-pulse rounded-xl bg-[var(--surface)]" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-[var(--surface)]" />
    </div>
  );
}
