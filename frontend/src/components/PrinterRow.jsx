import { HomeAssistantPowerButton } from "./HomeAssistantPowerButton";
import { PrinterModelPreview } from "./PrinterModelPreview";
import { PrinterStatusBadge } from "./PrinterStatusBadge";
import { PrinterTimeDisplay, formatEta } from "./PrinterTimeDisplay";
import { ProgressBar } from "./ProgressBar";
import { TemperatureDisplay } from "./TemperatureDisplay";

const cleanJobName = (filename = "") => {
  const withoutExt = filename.replace(/\.gcode$/i, "");
  const withoutTail = withoutExt.replace(/_0\.\d+mm_.+?Klipper Printer_\d+h\d+m$/i, "");
  return withoutTail.replace(/_/g, " ").trim() || "Sin trabajo";
};

const cleanProfile = (printer) => {
  if (printer.state === "finished") return "Trabajo terminado";
  if (printer.state === "ready") return "Lista para imprimir";
  const material = printer.telemetry.filamentType || printer.activeMaterial || "";
  return material ? `${material} en impresion` : "Impresion activa";
};

export function PrinterRow({
  printer,
  onOpenConfig,
  onToggleLight,
  onPowerAction,
  onRestartService,
  onMarkReady
}) {
  const jobTitle = cleanJobName(printer.telemetry.currentFile);
  const isPoweredOff = printer.powerState !== "on";
  const isPrinting = printer.state === "printing";
  const canMarkReady = printer.state === "finished" && !isPoweredOff;
  const canRestartServices = printer.powerState === "on" && printer.state === "offline";

  return (
    <article
      className={`glass animate-rise flex h-full min-h-[620px] flex-col gap-3 rounded-[24px] border p-3 shadow-glow transition ${
        isPoweredOff
          ? "border-white/5 opacity-55 saturate-0"
          : "border-white/10 opacity-100"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.24em] text-accent">Printer</p>
          <h3 className="mt-1 font-display text-[1.7rem] font-semibold leading-none">{printer.name}</h3>
          <p className="mt-1 text-xs text-slate-400">{cleanProfile(printer)}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <PrinterStatusBadge status={printer.state} />
          <button
            type="button"
            disabled={isPrinting}
            onClick={onOpenConfig}
            className={`rounded-xl border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] ${
              isPrinting
                ? "cursor-not-allowed border-white/10 bg-white/5 text-slate-500 opacity-50"
                : "border-white/10 bg-white/5 text-slate-200"
            }`}
          >
            Config
          </button>
        </div>
      </div>

      <div className="space-y-2 md:hidden">
        {canRestartServices && (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onRestartService("klipper")}
              className="rounded-2xl border border-sky-300/25 bg-sky-400/10 px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-100"
            >
              Reiniciar Klipper
            </button>
            <button
              type="button"
              onClick={() => onRestartService("moonraker")}
              className="rounded-2xl border border-violet-300/25 bg-violet-400/10 px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-100"
            >
              Reiniciar Moonraker
            </button>
          </div>
        )}
        {printer.powerEnabled ? (
          <HomeAssistantPowerButton powerState={printer.powerState} onAction={onPowerAction} disabled={isPrinting} />
        ) : (
          <button
            type="button"
            disabled
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 opacity-70"
          >
            Sin control HA
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {canMarkReady && (
          <button
            type="button"
            onClick={onMarkReady}
            className="col-span-2 w-full rounded-2xl border border-sky-300/30 bg-sky-400/10 px-3 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-sky-200"
          >
            Marcar lista
          </button>
        )}
        {printer.lightEnabled ? (
          <button
            type="button"
            disabled={isPrinting}
            onClick={onToggleLight}
            className={`col-span-2 w-full rounded-2xl border px-3 py-3 text-xs font-semibold uppercase tracking-[0.16em] ${
              printer.lightState === "on"
                ? "border-amber-300/40 bg-amber-400/15 text-amber-200"
                : "border-white/10 bg-white/5 text-slate-200"
            } ${isPrinting ? "cursor-not-allowed opacity-40" : ""}`}
          >
            Lampara {printer.lightState === "on" ? "encendida" : "apagada"}
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="col-span-2 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 opacity-70"
          >
            Sin lampara
          </button>
        )}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Trabajo activo</p>
            <div className="mt-2 h-[40px] overflow-hidden">
              <p className="text-[13px] font-semibold leading-5 text-slate-100">{jobTitle}</p>
            </div>
          </div>
          <div className="ml-2 rounded-2xl border border-cyan-300/15 bg-cyan-400/10 px-2 py-1 text-right">
            <p className="text-[9px] uppercase tracking-[0.16em] text-cyan-200">Termina</p>
            <p className="mt-1 font-display text-sm text-cyan-100">{formatEta(printer.telemetry.remainingMinutes)}</p>
          </div>
        </div>
        <div className="mt-3">
          <ProgressBar value={printer.telemetry.progress} />
        </div>
      </div>

      <PrinterModelPreview fileName={jobTitle} image={printer.telemetry.thumbnailUrl || printer.image} color={printer.spool?.color} />

      <PrinterTimeDisplay
        elapsed={printer.telemetry.elapsedMinutes}
        remaining={printer.telemetry.remainingMinutes}
        total={printer.telemetry.estimatedMinutes}
      />

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-2.5">
          <p className="text-[9px] uppercase tracking-[0.14em] text-slate-500">Velocidad</p>
          <p className="mt-1 font-display text-lg text-slate-100">{Math.round(printer.telemetry.velocity)}</p>
          <p className="text-[10px] text-slate-500">mm/s</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-2.5">
          <p className="text-[9px] uppercase tracking-[0.14em] text-slate-500">Progreso</p>
          <p className="mt-1 font-display text-lg text-emerald-200">{Math.round(printer.telemetry.progress)}%</p>
          <p className="text-[10px] text-slate-500">actual</p>
        </div>
      </div>

      {printer.spool && (
        <div
          className="rounded-2xl border p-2.5"
          style={{ borderColor: `${printer.spool.color}55`, backgroundColor: `${printer.spool.color}14` }}
        >
          <div className="flex items-center justify-between">
            <p className="text-[9px] uppercase tracking-[0.14em] text-slate-400">Material restante</p>
            <span className="h-2.5 w-2.5 rounded-full border border-white/20" style={{ backgroundColor: printer.spool.color }} />
          </div>
          <p className="mt-1 font-display text-lg text-slate-100">
            {printer.spool.remainingGrams}g <span className="text-xs text-slate-500">/ {printer.spool.initialGrams}g</span>
          </p>
          <p className="text-[10px] text-slate-500">{printer.spool.material}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <TemperatureDisplay label="Nozzle" actual={printer.telemetry.nozzle.actual} target={printer.telemetry.nozzle.target} />
        <TemperatureDisplay label="Bed" actual={printer.telemetry.bed.actual} target={printer.telemetry.bed.target} />
      </div>

      <div className="mt-auto hidden md:block">
        {canRestartServices && (
          <div className="mb-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onRestartService("klipper")}
              className="rounded-2xl border border-sky-300/25 bg-sky-400/10 px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-100"
            >
              Reiniciar Klipper
            </button>
            <button
              type="button"
              onClick={() => onRestartService("moonraker")}
              className="rounded-2xl border border-violet-300/25 bg-violet-400/10 px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-100"
            >
              Reiniciar Moonraker
            </button>
          </div>
        )}
        {printer.powerEnabled ? (
          <HomeAssistantPowerButton powerState={printer.powerState} onAction={onPowerAction} disabled={isPrinting} />
        ) : (
          <button
            type="button"
            disabled
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 opacity-70"
          >
            Sin control HA
          </button>
        )}
      </div>
    </article>
  );
}
