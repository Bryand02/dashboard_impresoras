import { PrinterRow } from "./PrinterRow";

export function PrinterDetailModal({
  printer,
  onClose,
  onOpenConfig,
  onToggleLight,
  onPowerAction,
  onRestartService,
  onMarkReady,
  onOpenFloatingCamera
}) {
  if (!printer) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 p-3 backdrop-blur-sm">
      <div className="mx-auto max-h-[calc(100vh-1.5rem)] max-w-xl overflow-y-auto">
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200"
          >
            Cerrar
          </button>
        </div>
        <PrinterRow
          printer={printer}
          onOpenConfig={onOpenConfig}
          onToggleLight={onToggleLight}
          onPowerAction={onPowerAction}
          onRestartService={onRestartService}
          onMarkReady={onMarkReady}
          onOpenFloatingCamera={onOpenFloatingCamera}
        />
      </div>
    </div>
  );
}
