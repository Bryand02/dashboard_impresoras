export function PrinterQueuePanel({ queue, files, printers, onQueueAction }) {
  const fileMap = Object.fromEntries(files.map((file) => [file.id, file]));
  const printerMap = Object.fromEntries(printers.map((printer) => [printer.id, printer]));

  return (
    <section className="glass rounded-[28px] border border-white/10 p-5 shadow-glow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-accent">Queue control</p>
          <h2 className="mt-1 font-display text-3xl">Cola inteligente</h2>
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {queue.map((item) => {
          const file = fileMap[item.fileId];
          const printer = printerMap[item.printerId];
          return (
            <div key={item.id} className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 lg:grid-cols-[1.5fr_1fr_auto]">
              <div>
                <p className="font-semibold text-slate-100">{file?.name || item.fileId}</p>
                <p className="text-sm text-slate-400">
                  {item.status} · {item.mode} · {printer?.name || "Sin impresora"}
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-300">
                <span>Prioridad {item.priority}</span>
                <span>{item.estimatedMinutes} min</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => onQueueAction(item.id, { status: "paused" })} className="rounded-xl border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.2em]">
                  Pausar
                </button>
                <button onClick={() => onQueueAction(item.id, { priority: Math.max(1, item.priority - 1) })} className="rounded-xl border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.2em]">
                  Subir
                </button>
                <button onClick={() => onQueueAction(item.id, { remove: true })} className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs uppercase tracking-[0.2em] text-rose-200">
                  Cancelar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
