const styles = {
  online: "bg-slate-500/15 text-slate-200 ring-slate-300/25",
  offline: "bg-zinc-600/10 text-zinc-400 ring-zinc-500/20",
  printing: "bg-emerald-500/16 text-emerald-200 ring-emerald-300/35 shadow-[0_0_18px_rgba(67,209,122,0.12)]",
  paused: "bg-amber-400/16 text-amber-200 ring-amber-300/35",
  error: "bg-rose-500/16 text-rose-200 ring-rose-300/35",
  finished: "bg-cyan-500/16 text-cyan-200 ring-cyan-300/35",
  ready: "bg-sky-500/16 text-sky-200 ring-sky-300/35 shadow-[0_0_18px_rgba(56,189,248,0.12)]"
};

export function PrinterStatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ring-1 ${styles[status] || styles.offline}`}>
      <span className="h-2 w-2 animate-pulse rounded-full bg-current" />
      {status}
    </span>
  );
}
