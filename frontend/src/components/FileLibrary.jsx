const formatMinutes = (minutes) => {
  if (!minutes) return "0m";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours}h ${rest}m` : `${rest}m`;
};

export function FileLibrary({ files, printers = [], query, onQueryChange, onOpenUpload, onDelete, onOpenDispatch }) {
  const printerNameMap = new Map(printers.map((printer) => [printer.id, printer.name]));
  return (
    <section className="space-y-4">
      <header className="glass rounded-[24px] border border-white/10 p-4 shadow-glow">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Biblioteca unificada</p>
            <h2 className="mt-1 font-display text-3xl">G-code Library</h2>
            <p className="mt-2 text-sm text-slate-400">Sube, revisa y despacha archivos desde un solo lugar.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Buscar por nombre o material"
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate-100"
            />
            <button
              type="button"
              onClick={onOpenUpload}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-100"
            >
              Subir G-code
            </button>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {files.map((file) => (
          <article key={file.id} className="glass overflow-hidden rounded-[24px] border border-white/10 shadow-glow">
            <img src={file.thumbnail} alt={file.name} className="h-44 w-full object-cover" />
            <div className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold text-slate-100">{file.name}</h3>
                  <p className="mt-1 text-sm text-slate-400">{file.description}</p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-300">
                  {file.material}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-black/25 p-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Tiempo</p>
                  <p className="mt-2 font-display text-2xl">{formatMinutes(file.estimatedMinutes)}</p>
                </div>
                <div className="rounded-2xl bg-black/25 p-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Material</p>
                  <p className="mt-2 font-display text-2xl">{file.weightGrams}g</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {file.compatibility.map((machine) => (
                  <span key={machine} className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-slate-300">
                    {printerNameMap.get(machine) || machine}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onOpenDispatch(file)}
                  className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200"
                >
                  Enviar a imprimir
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(file.id)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-200"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}
