import { useMemo, useRef } from "react";

const isWebUrl = (url = "") => /^https?:\/\//i.test(url);
const isRtspUrl = (url = "") => /^rtsp:\/\//i.test(url);

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

export function CameraPreview({ printer }) {
  const cameraUrl = printer.cameraUrl || "";
  const frameRef = useRef(null);
  const showIframe = isWebUrl(cameraUrl);
  const showRtspHint = isRtspUrl(cameraUrl);
  const embedUrl = useMemo(() => (showIframe ? getGo2RtcEmbedUrl(cameraUrl) : ""), [cameraUrl, showIframe]);

  const handleFullscreen = async () => {
    if (!frameRef.current?.requestFullscreen) return;
    await frameRef.current.requestFullscreen();
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/65">
      <div ref={frameRef} className="relative h-44 overflow-hidden bg-black">
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
          <>
            <img src={printer.image} alt={printer.name} className="h-full w-full object-cover opacity-55" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
          </>
        )}

        <div className="absolute left-3 top-3 rounded-full bg-black/55 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-accent">
          Camara
        </div>

        {showIframe && (
          <button
            type="button"
            onClick={handleFullscreen}
            className="absolute bottom-3 right-3 rounded-full border border-white/15 bg-black/60 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-100 backdrop-blur"
          >
            Full
          </button>
        )}
      </div>

      <div className="space-y-1 px-3 py-2">
        <span className="block truncate text-[11px] text-slate-500">{cameraUrl || "Sin URL de camara"}</span>
        {showIframe && (
          <span className="block text-[10px] text-slate-600">
            Vista ajustada, silenciada por defecto y lista para pantalla completa.
          </span>
        )}
        {showRtspHint && (
          <span className="block text-[10px] text-slate-600">RTSP directo no abre en navegador. Usa una URL web del proxy.</span>
        )}
      </div>
    </div>
  );
}
