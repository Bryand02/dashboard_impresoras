import { useMemo, useRef } from "react";

const isWebUrl = (url = "") => /^https?:\/\//i.test(url);

const getGo2RtcEmbedUrl = (cameraUrl) => {
  try {
    const parsed = new URL(cameraUrl);
    const src = parsed.searchParams.get("src");
    if (!src) return cameraUrl;
    parsed.pathname = "/webrtc.html";
    parsed.search = "";
    parsed.searchParams.set("src", src);
    parsed.searchParams.set("media", "video+audio");
    return parsed.toString();
  } catch {
    return cameraUrl;
  }
};

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

function PopoutIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="6" width="12" height="12" rx="2" />
      <path d="M14 4h6v6" />
      <path d="M20 4l-7 7" />
    </svg>
  );
}

export function CameraPreview({ printer }) {
  const cameraUrl = printer.cameraUrl || "";
  const frameRef = useRef(null);
  const showIframe = isWebUrl(cameraUrl);
  const embedUrl = useMemo(() => (showIframe ? getGo2RtcEmbedUrl(cameraUrl) : ""), [cameraUrl, showIframe]);

  const handleFullscreen = async () => {
    if (!frameRef.current?.requestFullscreen) return;
    await frameRef.current.requestFullscreen();
  };

  const handlePopout = () => {
    if (!cameraUrl) return;
    window.open(
      cameraUrl,
      `camera-${printer.id}`,
      "popup=yes,width=960,height=640,resizable=yes,scrollbars=no"
    );
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/65">
      <div ref={frameRef} className="relative h-48 overflow-hidden bg-black">
        {showIframe ? (
          <iframe
            src={embedUrl}
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

        {showIframe && (
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <button type="button" onClick={handlePopout} className={iconButtonClass} aria-label="Abrir mini ventana flotante">
              <PopoutIcon />
            </button>
            <button type="button" onClick={handleFullscreen} className={iconButtonClass} aria-label="Pantalla completa">
              <FullscreenIcon />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
