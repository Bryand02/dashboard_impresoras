export function TemperatureDisplay({ label, actual, target }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/5 p-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-3 font-display text-[1.85rem] leading-none text-slate-100">
        {Math.round(actual)}°C
      </p>
      <p className="mt-2 text-sm text-slate-500">{Math.round(target)}°C target</p>
    </div>
  );
}
