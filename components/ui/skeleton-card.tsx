function SkeletonCard() {
  return (
    <div
      className="deal-card relative flex h-full flex-col overflow-hidden"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="skeleton-fill h-11 w-11 shrink-0 rounded-xl sm:h-12 sm:w-12" />
          <div className="min-w-0 flex-1 space-y-2 pt-0.5">
            <div className="skeleton-fill h-5 w-16 rounded-md" />
            <div className="skeleton-fill h-4 w-24 rounded" />
          </div>
          <div className="skeleton-fill h-10 w-14 shrink-0 rounded-xl" />
        </div>

        <div className="space-y-1.5">
          <div className="skeleton-fill h-5 w-full rounded" />
          <div className="skeleton-fill h-5 w-2/3 rounded" />
        </div>

        <div className="skeleton-fill h-4 w-1/2 rounded" />

        <div className="rounded-xl border border-dashed border-[color:var(--border)] px-3 py-2.5">
          <div className="skeleton-fill h-7 w-40 rounded" />
        </div>

        <div className="mt-auto pt-1">
          <div className="skeleton-fill h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonCardGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
