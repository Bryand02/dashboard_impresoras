import { useEffect, useState } from "react";
import { PrinterStatusBadge } from "../components/PrinterStatusBadge";
import { ProgressBar } from "../components/ProgressBar";
import { APP_VERSION } from "../config/version";

const REFRESH_MS = 8000;

const getApiUrl = () => {
  if (typeof window !== "undefined") return `${window.location.origin}/api`;
  return "/api";
};

export function GuestStatusView() {
  const [printers, setPrinters] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      fetch(`${getApiUrl()}/public/printers`)
        .then((r) => r.json())
        .then((data) => {
          if (cancelled) return;
          setPrinters(data.printers || []);
          setError(false);
        })
        .catch(() => {
          if (!cancelled) setError(true);
        });
    };

    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-accent">Printer Hub</p>
          <h1 className="mt-1 font-display text-3xl">Estado de impresoras</h1>
          <p className="mt-1 text-xs text-slate-500">v{APP_VERSION}</p>
        </div>

        {error && (
          <p className="mb-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-3 text-center text-sm text-rose-200">
            No se pudo cargar el estado ahora mismo.
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {printers.map((printer) => (
            <div key={printer.id} className="glass rounded-[24px] border border-white/10 p-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-xl">{printer.name}</h2>
                <PrinterStatusBadge status={printer.state} />
              </div>

              {printer.state === "printing" && (
                <div className="mt-3">
                  <ProgressBar value={printer.progress} compact />
                </div>
              )}

              {printer.spool ? (
                <div
                  className="mt-3 flex items-center justify-between rounded-2xl border-2 px-3 py-2.5"
                  style={{ borderColor: printer.spool.color, backgroundColor: `${printer.spool.color}22` }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full border border-white/30"
                      style={{ backgroundColor: printer.spool.color }}
                    />
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-100">
                      {printer.spool.material}
                    </p>
                  </div>
                  <p className="font-display text-lg leading-none text-white">
                    {printer.spool.remainingGrams}
                    <span className="text-xs text-slate-300">g / {printer.spool.initialGrams}g</span>
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-xs text-slate-500">Sin material configurado.</p>
              )}
            </div>
          ))}

          {!printers.length && !error && (
            <p className="col-span-full text-center text-sm text-slate-500">Cargando...</p>
          )}
        </div>
      </div>
    </div>
  );
}
