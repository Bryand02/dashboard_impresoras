import { useMemo, useState } from "react";
import { getGo2RtcSource, isWebUrl } from "./cameraUtils";

function CameraFrame({ printer, large = false }) {
  const cameraUrl = printer.cameraUrl || "";
  const [embedFailed, setEmbedFailed] = useState(false);
  const go2RtcSource = useMemo(() => (isWebUrl(cameraUrl) ? getGo2RtcSource(cameraUrl) : null), [cameraUrl]);
  const showWebRtc = Boolean(go2RtcSource?.webRtcUrl) && !embedFailed;

  if (!isWebUrl(cameraUrl)) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,#18253a_0%,#0b1220_58%,#050914_100%)] text-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">No signal</p>
          <p className="mt-2 text-[11px] text-slate-600">Configura una URL web de camara</p>
        </div>
      </div>
    );
  }

  const sharedProps = {
    className: "h-full w-full border-0 bg-black",
    allow: "autoplay; fullscreen",
    referrerPolicy: "no-referrer",
    scrolling: "no",
    style: large ? { clipPath: "inset(0 0 54px 0)" } : { clipPath: "inset(0 0 48px 0)" }
  };

  if (showWebRtc) {
    return (
      <iframe
        src={go2RtcSource.webRtcUrl}
        title={`Camara ${printer.name}`}
        onError={() => setEmbedFailed(true)}
        {...sharedProps}
      />
    );
  }

  return (
    <iframe
      src={cameraUrl}
      title={`Camara ${printer.name}`}
      {...sharedProps}
    />
  );
}

export function CameraFullscreenWall({ printers, activePrinterId, onSelectPrinter, onClose }) {
  const availablePrinters = printers.filter((printer) => isWebUrl(printer.cameraUrl || ""));
  const activePrinter = availablePrinters.find((printer) => printer.id === activePrinterId) || availablePrinters[0];
  const secondaryPrinters = availablePrinters.filter((printer) => printer.id !== activePrinter?.id);

  if (!activePrinter) return null;

  return (
    <div className="fixed inset-0 z-[160] bg-black/95">
      <div className="flex h-full flex-col p-3 sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-300">Vista de camaras</p>
            <h2 className="truncate font-display text-xl font-semibold text-white sm:text-2xl">{activePrinter.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            Salir
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 md:flex-row">
          <div className="min-h-0 flex-1 overflow-hidden rounded-[28px] border border-white/10 bg-black shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
            <CameraFrame printer={activePrinter} large />
          </div>

          <aside className="flex w-full shrink-0 gap-3 overflow-x-auto md:w-[260px] md:flex-col md:overflow-y-auto md:overflow-x-hidden">
            {secondaryPrinters.map((printer) => (
              <button
                key={printer.id}
                type="button"
                onClick={() => onSelectPrinter(printer.id)}
                className="min-w-[180px] overflow-hidden rounded-[22px] border border-white/10 bg-[#0b1017] text-left transition hover:border-cyan-300/30 md:min-w-0"
              >
                <div className="h-28 overflow-hidden bg-black md:h-36">
                  <CameraFrame printer={printer} />
                </div>
                <div className="border-t border-white/5 px-3 py-2">
                  <p className="truncate text-sm font-semibold text-slate-100">{printer.name}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">{printer.state}</p>
                </div>
              </button>
            ))}
          </aside>
        </div>
      </div>
    </div>
  );
}
