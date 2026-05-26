export function ProgressBar({ value }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-500">
        <span>Progress</span>
        <span>{Math.round(value)}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-black/55 ring-1 ring-white/5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-lime-300 to-emerald-500 shadow-[0_0_16px_rgba(67,209,122,0.35)] transition-all duration-700"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
