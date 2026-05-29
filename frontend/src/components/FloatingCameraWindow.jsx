import { useMemo, useState } from "react";
import { getGo2RtcSource, isWebUrl } from "./cameraUtils";

export function FloatingCameraWindow({ printer, onClose }) {
  const [embedFailed, setEmbedFailed] = useState(false);
  const cameraUrl = printer.cameraUrl || "";
  const go2RtcSource = useMemo(() => getGo2RtcSource(cameraUrl), [cameraUrl]);
  const showWebRtc = isWebUrl(cameraUrl) && Boolean(go2RtcSource?.webRtcUrl) && !embedFailed;

  return (
    <div className="fixed bottom-5 right-5 z-[80] overflow-hidden rounded-[22px] border border-white/15 bg-black shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
      <div className="absolute inset-x-0 top-0 z-10 flex h-9 items-center justify-between bg-gradient-to-b from-black/80 to-transparent px-3">
        <span className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">
          {printer.name}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-sm font-semibold text-white transition hover:bg-black/75"
          aria-label="Cerrar mini ventana"
        >
          X
        </button>
      </div>

      <div className="h-[220px] w-[360px] overflow-hidden bg-black">
        {showWebRtc ? (
          <iframe
            src={go2RtcSource.webRtcUrl}
            title={`Mini camara ${printer.name}`}
            className="h-full w-full border-0 bg-black"
            style={{ clipPath: "inset(0 0 54px 0)" }}
            allow="autoplay; fullscreen"
            referrerPolicy="no-referrer"
            scrolling="no"
            onError={() => setEmbedFailed(true)}
          />
        ) : isWebUrl(cameraUrl) ? (
          <iframe
            src={cameraUrl}
            title={`Mini camara ${printer.name}`}
            className="h-full w-full border-0 bg-black"
            style={{ clipPath: "inset(0 0 54px 0)" }}
            allow="autoplay; fullscreen"
            referrerPolicy="no-referrer"
            scrolling="no"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,#18253a_0%,#0b1220_58%,#050914_100%)]">
            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">No signal</p>
          </div>
        )}
      </div>
    </div>
  );
}
