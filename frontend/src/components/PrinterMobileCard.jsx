import { ProgressBar } from "./ProgressBar";
import { PrinterStatusBadge } from "./PrinterStatusBadge";
import { formatEta, formatMinutes } from "./PrinterTimeDisplay";

const cleanJobName = (filename = "") => {
  const withoutExt = filename.replace(/\.gcode$/i, "");
  const withoutTail = withoutExt.replace(/_0\.\d+mm_.+?Klipper Printer_\d+h\d+m$/i, "");
  return withoutTail.replace(/_/g, " ").trim() || "Sin trabajo";
};

export function PrinterMobileCard({ printer, onOpen }) {
  const jobTitle = cleanJobName(printer.telemetry.currentFile);
  const isExpanded = printer.isExpanded;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`glass flex w-full flex-col gap-2 rounded-[22px] border p-3 text-left transition ${
        printer.powerState !== "on" ? "border-white/5 opacity-55 saturate-0" : "border-white/10"
      } ${isExpanded ? "ring-1 ring-cyan-300/30" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-display text-xl leading-none">{printer.name}</p>
          <p className="mt-1 truncate text-xs text-slate-400">{jobTitle}</p>
        </div>
        <PrinterStatusBadge status={printer.state} />
      </div>

      <div>
        <ProgressBar value={printer.telemetry.progress} compact />
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-2xl border border-white/5 bg-white/5 p-2">
          <p className="uppercase tracking-[0.14em] text-slate-500">Falta</p>
          <p className="mt-1 font-display text-base text-emerald-200">{formatMinutes(printer.telemetry.remainingMinutes)}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/5 p-2">
          <p className="uppercase tracking-[0.14em] text-slate-500">Lleva</p>
          <p className="mt-1 font-display text-base text-slate-100">{formatMinutes(printer.telemetry.elapsedMinutes)}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/5 p-2">
          <p className="uppercase tracking-[0.14em] text-slate-500">Termina</p>
          <p className="mt-1 font-display text-base text-cyan-200">{formatEta(printer.telemetry.remainingMinutes)}</p>
        </div>
      </div>

      <div className="pt-1 text-[11px] uppercase tracking-[0.16em] text-slate-500">
        {isExpanded ? "Ocultar detalle" : "Ver detalle"}
      </div>
    </button>
  );
}
