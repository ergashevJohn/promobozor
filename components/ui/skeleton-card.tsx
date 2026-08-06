function SkeletonCard() {
  return (
    <div
      className="deal-card relative flex h-full flex-col overflow-hidden"
      aria-busy="true"
      aria-label="Loading promotional offer"
    >
      {/* Top Badge Placeholders (Absolute) */}
      <div className="skeleton-fill absolute top-3 left-3 z-10 h-6 w-20 rounded-full" />
      <div className="skeleton-fill absolute top-3 right-3 z-10 h-6 w-24 rounded-full" />

      {/* Card Content - Matching GrouponCard padding (pt-14 clears badges) */}
      <div className="flex flex-1 flex-col gap-4 p-5 pt-14">
        {/* Header: Logo + Text */}
        <div className="flex items-start gap-3">
          {/* Logo */}
          <div className="skeleton-fill h-12 w-12 shrink-0 rounded-xl" />

          {/* Text Info */}
          <div className="flex flex-1 flex-col gap-2 pt-1">
            {/* Store Name */}
            <div className="skeleton-fill h-5 w-3/4 rounded" />
            {/* Offer Title / Description */}
            <div className="space-y-1.5">
              <div className="skeleton-fill h-4 w-full rounded" />
              <div className="skeleton-fill h-4 w-2/3 rounded" />
            </div>
          </div>
        </div>

        {/* Dashed Offer Box - The main "deal" area */}
        <div className="border-border relative my-2 flex flex-col items-center gap-3 rounded-xl border border-dashed py-6">
          {/* Discount Pill */}
          <div className="skeleton-fill h-10 w-40 rounded-full" />

          {/* Code / Link Text */}
          <div className="skeleton-fill h-8 w-48 rounded" />

          {/* Timer */}
          <div className="skeleton-fill h-4 w-24 rounded" />
        </div>

        {/* Buttons */}
        <div className="mt-auto flex gap-2">
          <div className="skeleton-fill h-11 flex-1 rounded-xl" />
          <div className="skeleton-fill h-11 flex-1 rounded-xl" />
        </div>
      </div>

      {/* Footer Stats */}
      <div className="border-border border-t px-5 py-3">
        <div className="flex items-center justify-between">
          {/* Left Stats (Views, Copies) */}
          <div className="flex gap-3">
            <div className="skeleton-fill h-3 w-12 rounded" />
            <div className="skeleton-fill h-3 w-12 rounded" />
          </div>

          {/* Right Actions (Like/Dislike) */}
          <div className="flex gap-2">
            <div className="skeleton-fill h-6 w-12 rounded-full" />
            <div className="skeleton-fill h-6 w-12 rounded-full" />
          </div>
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

function SkeletonStoreCard() {
  return (
    <div className="surface-card py-0" aria-busy="true">
      <div className="flex flex-col items-center gap-3 p-4">
        <div className="skeleton-fill h-14 w-14 rounded-xl" />
        <div className="w-full text-center">
          <div className="skeleton-fill mx-auto h-4 w-20 rounded" />
          <div className="skeleton-fill mx-auto mt-1.5 h-3 w-16 rounded" />
        </div>
      </div>
    </div>
  );
}

function SkeletonCategoryCard() {
  return (
    <div className="surface-card py-0" aria-busy="true">
      <div className="flex items-center gap-3 p-4">
        <div className="skeleton-fill h-12 w-12 flex-shrink-0 rounded-xl" />
        <div className="skeleton-fill h-4 w-24 rounded" />
      </div>
    </div>
  );
}

export function SkeletonPopularSection() {
  return (
    <div className="mb-16 space-y-12">
      {/* Popular Stores Skeleton */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <div className="skeleton-fill h-7 w-48 rounded" />
          <div className="skeleton-fill h-5 w-24 rounded" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonStoreCard key={i} />
          ))}
        </div>
      </section>

      {/* Popular Categories Skeleton */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <div className="skeleton-fill h-7 w-48 rounded" />
          <div className="skeleton-fill h-5 w-24 rounded" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCategoryCard key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
