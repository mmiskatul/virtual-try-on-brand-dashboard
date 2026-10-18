export default function BrandDashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex animate-pulse">
      {/* Sidebar Skeleton */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/50 p-4 hidden md:flex flex-col gap-6">
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-500/30" />
          <div className="space-y-1">
            <div className="h-4 w-24 rounded bg-slate-800" />
            <div className="h-3 w-16 rounded bg-slate-800/60" />
          </div>
        </div>

        <div className="space-y-2 flex-1">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-10 w-full rounded-lg bg-slate-800/40" />
          ))}
        </div>

        <div className="h-12 w-full rounded-xl bg-slate-800/30 border border-slate-800" />
      </aside>

      {/* Main Content Area Skeleton */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Skeleton */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/40 px-6 flex items-center justify-between">
          <div className="h-5 w-40 rounded bg-slate-800" />
          <div className="flex items-center gap-3">
            <div className="h-8 w-24 rounded-full bg-slate-800/70" />
            <div className="w-9 h-9 rounded-full bg-slate-800" />
          </div>
        </header>

        {/* Dashboard Content Skeleton */}
        <main className="p-6 md:p-8 space-y-6 max-w-7xl">
          {/* KPI Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((kpi) => (
              <div
                key={kpi}
                className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="h-3.5 w-24 rounded bg-slate-800" />
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10" />
                </div>
                <div className="h-7 w-28 rounded bg-slate-700" />
                <div className="h-3 w-36 rounded bg-slate-800/50" />
              </div>
            ))}
          </div>

          {/* Table / Module Placeholder Skeleton */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-5 w-32 rounded bg-slate-800" />
              <div className="h-9 w-28 rounded-lg bg-sky-600/30" />
            </div>

            <div className="space-y-3 pt-2">
              {[1, 2, 3, 4, 5].map((row) => (
                <div
                  key={row}
                  className="h-12 w-full rounded-lg bg-slate-800/30 border border-slate-800/50"
                />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
