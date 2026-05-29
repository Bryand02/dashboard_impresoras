import { useMemo, useState } from "react";
import { getGo2RtcSource, isWebUrl } from "./cameraUtils";

const iconButtonClass =
  "flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/60 text-slate-100 backdrop-blur transition hover:border-white/25 hover:bg-black/75";

function FullscreenIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H3v5" />
      <path d="M16 3h5v5" />
      <path d="M21 16v5h-5" />
      <path d="M3 16v5h5" />
    </svg>
  );
}

function FloatingIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <rect x="12.5" y="10.5" width="6" height="4.5" rx="1" />
    </svg>
  );
}

export function CameraPreview({ printer, onOpenFloating, onOpenFullscreen }) {
  const cameraUrl = printer.cameraUrl || "";
  const [embedFailed, setEmbedFailed] = useState(false);
  const go2RtcSource = useMemo(() => (isWebUrl(cameraUrl) ? getGo2RtcSource(cameraUrl) : null), [cameraUrl]);
  const showWebRtc = Boolean(go2RtcSource?.webRtcUrl) && !embedFailed;

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/65">
      <div className="relative h-40 overflow-hidden bg-black">
        {showWebRtc ? (
          <iframe
            src={go2RtcSource.webRtcUrl}
            title={`Camara ${printer.name}`}
            className="h-full w-full border-0 bg-black"
            style={{ clipPath: "inset(0 0 54px 0)" }}
            loading="lazy"
            allow="autoplay; fullscreen"
            referrerPolicy="no-referrer"
            scrolling="no"
            onError={() => setEmbedFailed(true)}
          />
        ) : isWebUrl(cameraUrl) ? (
          <iframe
            src={cameraUrl}
            title={`Camara ${printer.name}`}
            className="h-full w-full border-0 bg-black"
            style={{ clipPath: "inset(0 0 54px 0)" }}
            loading="lazy"
            allow="autoplay; fullscreen"
            referrerPolicy="no-referrer"
            scrolling="no"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,#18253a_0%,#0b1220_58%,#050914_100%)] text-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">No signal</p>
              <p className="mt-2 text-[11px] text-slate-600">Configura una URL web de camara</p>
            </div>
          </div>
        )}

        <div className="absolute left-3 top-3 rounded-full bg-black/55 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-accent">
          Camara
        </div>

        {isWebUrl(cameraUrl) && (
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <button type="button" onClick={onOpenFloating} className={iconButtonClass} aria-label="Abrir mini ventana flotante">
              <FloatingIcon />
            </button>
            <button type="button" onClick={onOpenFullscreen} className={iconButtonClass} aria-label="Pantalla completa">
              <FullscreenIcon />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
