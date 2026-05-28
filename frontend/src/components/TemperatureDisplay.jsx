export function TemperatureDisplay({ label, actual, target }) {
  const accentClass = label.toLowerCase() === "nozzle" ? "text-amber-200" : "text-cyan-200";

  return (
    <div className="rounded-2xl border border-white/5 bg-white/5 p-2.5">
      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className={`mt-2 font-display text-[1.45rem] leading-none ${accentClass}`}>
        {Math.round(actual)}°C
      </p>
      <p className="mt-1 text-xs text-slate-500">{Math.round(target)}°C target</p>
    </div>
  );
}
