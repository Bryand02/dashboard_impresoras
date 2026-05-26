import { useMemo, useState } from "react";

export function DispatchPrintModal({ file, preview, onClose, onConfirm }) {
  const [mode, setMode] = useState(preview?.suggestedPrinter ? "auto" : "manual");
  const [selectedPrinterId, setSelectedPrinterId] = useState(preview?.suggestedPrinter?.id || preview?.printers?.[0]?.id || "");

  const selectablePrinters = useMemo(
    () => (preview?.printers || []).filter((printer) => printer.selectableManually),
    [preview]
  );
  const canConfirm = mode === "auto"
    ? Boolean(preview?.suggestedPrinter)
    : selectablePrinters.some((printer) => printer.id === selectedPrinterId);

  if (!file || !preview) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/72 p-4">
      <div className="glass w-full max-w-4xl rounded-[28px] border border-white/10 p-5 shadow-glow">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Despachar impresion</p>
            <h2 className="mt-1 font-display text-3xl">{file.name}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300">
            Cerrar
          </button>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_1.2fr]">
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Sugerencia</p>
            {preview.suggestedPrinter ? (
              <div className="mt-3 rounded-3xl border border-emerald-300/20 bg-emerald-400/10 p-4">
                <p className="text-xl font-semibold text-emerald-100">{preview.suggestedPrinter.name}</p>
                <p className="mt-1 text-sm text-emerald-200">Disponible y mejor puntaje para este archivo.</p>
              </div>
            ) : (
              <div className="mt-3 rounded-3xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm text-amber-100">
                No hay sugerencia automatica en este momento. Aun puedes elegir manualmente una impresora que no este imprimiendo.
              </div>
            )}

            <div className="mt-4 grid gap-2">
              <button
                type="button"
                onClick={() => setMode("auto")}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold ${mode === "auto" ? "bg-white text-slate-950" : "border border-white/10 bg-white/5 text-slate-100"}`}
              >
                Usar sugerencia
              </button>
              <button
                type="button"
                onClick={() => setMode("manual")}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold ${mode === "manual" ? "bg-white text-slate-950" : "border border-white/10 bg-white/5 text-slate-100"}`}
              >
                Elegir manualmente
              </button>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Impresoras</p>
            <div className="mt-3 space-y-2">
              {preview.printers.map((printer) => {
                const isSelectable = mode === "manual" && printer.selectableManually;
                const active = selectedPrinterId === printer.id;
                return (
                  <button
                    key={printer.id}
                    type="button"
                    disabled={!isSelectable}
                    onClick={() => setSelectedPrinterId(printer.id)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                      active ? "border-white bg-white text-slate-950" : "border-white/10 bg-black/20 text-slate-100"
                    } ${!isSelectable ? "cursor-not-allowed opacity-55" : ""}`}
                  >
                    <div>
                      <p className="font-semibold">{printer.name}</p>
                      <p className={`text-xs ${active ? "text-slate-700" : "text-slate-400"}`}>{printer.reason}</p>
                    </div>
                    <span className={`text-xs uppercase tracking-[0.14em] ${active ? "text-slate-700" : "text-slate-500"}`}>
                      {printer.state}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            disabled={!canConfirm}
            onClick={() =>
              onConfirm({
                mode,
                printerId: mode === "manual" ? selectedPrinterId : null
              })
            }
            className={`rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 ${
              !canConfirm ? "cursor-not-allowed opacity-40" : ""
            }`}
          >
            Confirmar envio
          </button>
        </div>
      </div>
    </div>
  );
}
