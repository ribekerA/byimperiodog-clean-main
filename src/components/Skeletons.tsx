// src/components/Skeletons.tsx
"use client";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function shimmer(className?: string) {
  return cn(
    "animate-pulse rounded-md bg-zinc-200/80",
    className
  );
}

export function PuppyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border bg-white shadow-sm ring-1 ring-black/5">
      <div className={shimmer("aspect-[4/3] w-full")} />
      <div className="space-y-3 p-4">
        <div className={shimmer("h-4 w-1/3")} />
        <div className={shimmer("h-3 w-1/2")} />
        <div className="flex items-center justify-between pt-2">
          <div className={shimmer("h-5 w-24")} />
          <div className={shimmer("h-9 w-24 rounded-xl")} />
        </div>
      </div>
    </div>
  );
}

export function PuppiesGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <PuppyCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ModalSkeleton() {
  return (
    <div className="grid max-h-[calc(90vh-60px)] grid-cols-1 gap-6 overflow-y-auto p-5 lg:grid-cols-2">
      <div>
        <div className={shimmer("aspect-[4/3] w-full rounded-xl")} />
        <div className="mt-3 grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={shimmer("h-16 rounded-md")} />
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <div className={shimmer("h-6 w-40")} />
        <div className={shimmer("h-5 w-28")} />
        <div className={shimmer("h-20 w-full")} />
        <div className="grid grid-cols-3 gap-3">
          <div className={shimmer("h-10 w-full")} />
          <div className={shimmer("h-10 w-full")} />
          <div className={shimmer("h-10 w-full")} />
        </div>
      </div>
    </div>
  );
}
