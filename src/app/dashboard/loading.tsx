export default function DashboardLoading() {
  return (
    <div className="space-y-5 animate-pulse" aria-busy="true" aria-label="Loading workspace page">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="h-3 w-28 rounded-full bg-slate-200" />
          <div className="h-7 w-56 rounded-xl bg-slate-200" />
          <div className="h-3.5 w-80 max-w-full rounded-lg bg-slate-100" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-24 rounded-xl bg-slate-200" />
          <div className="h-9 w-28 rounded-xl bg-slate-200" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-3"
          >
            <div className="h-3 w-24 rounded bg-slate-100" />
            <div className="h-7 w-28 rounded-lg bg-slate-200" />
            <div className="h-3 w-36 rounded bg-slate-100" />
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-4">
        <div className="h-5 w-44 rounded-lg bg-slate-200" />
        <div className="space-y-2.5">
          {[0, 1, 2, 3, 4].map((row) => (
            <div key={row} className="h-12 w-full rounded-xl bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  );
}

