export default function StorefrontLoading() {
  return (
    <div className="min-h-screen bg-white text-gray-900 animate-pulse">
      {/* Banner Skeleton */}
      <div className="h-64 md:h-80 w-full bg-white border-b border-gray-200 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white to-transparent" />
      </div>

      {/* Brand Bio Bar Skeleton */}
      <div className="max-w-6xl mx-auto px-4 -mt-16 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 rounded-2xl bg-gray-100 border-4 border-gray-200" />
          <div className="space-y-2">
            <div className="h-7 w-48 rounded bg-gray-100" />
            <div className="h-4 w-64 rounded bg-gray-100/60" />
          </div>
        </div>

        <div className="flex gap-2">
          <div className="h-10 w-32 rounded-lg bg-gray-100" />
          <div className="h-10 w-28 rounded-lg bg-gray-100" />
        </div>
      </div>

      {/* Product Grid Skeleton */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="h-6 w-40 rounded bg-gray-100" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-200 bg-white/40 p-3 space-y-3"
            >
              <div className="w-full aspect-[4/5] rounded-xl bg-gray-100" />
              <div className="h-4 w-3/4 rounded bg-gray-100" />
              <div className="flex items-center justify-between">
                <div className="h-4 w-16 rounded bg-gray-100/80" />
                <div className="h-8 w-24 rounded-lg bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
