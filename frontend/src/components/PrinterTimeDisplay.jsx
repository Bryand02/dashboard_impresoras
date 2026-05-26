const formatMinutes = (minutes) => {
  if (!minutes) return "0m";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours}h ${rest}m` : `${rest}m`;
};

export function PrinterTimeDisplay({ elapsed, remaining, total }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/5 p-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Tiempos</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="min-w-0 rounded-2xl bg-slate-950/30 p-2.5">
          <p className="text-[9px] uppercase tracking-[0.12em] text-slate-500">Lleva</p>
          <p className="mt-2 font-display text-lg leading-tight text-slate-100">{formatMinutes(elapsed)}</p>
        </div>
        <div className="min-w-0 rounded-2xl bg-slate-950/30 p-2.5">
          <p className="text-[9px] uppercase tracking-[0.12em] text-slate-500">Falta</p>
          <p className="mt-2 font-display text-lg leading-tight text-slate-100">{formatMinutes(remaining)}</p>
        </div>
        <div className="min-w-0 rounded-2xl bg-slate-950/30 p-2.5">
          <p className="text-[9px] uppercase tracking-[0.12em] text-slate-500">Total</p>
          <p className="mt-2 font-display text-lg leading-tight text-slate-100">{formatMinutes(total)}</p>
        </div>
      </div>
    </div>
  );
}
