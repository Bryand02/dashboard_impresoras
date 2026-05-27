const isWebStreamUrl = (url = "") => /^https?:\/\//i.test(url);

const isRtspUrl = (url = "") => /^rtsp:\/\//i.test(url);

export function CameraPreview({ printer }) {
  const cameraUrl = printer.cameraUrl || "";
  const showIframe = isWebStreamUrl(cameraUrl);
  const showRtspHint = isRtspUrl(cameraUrl);

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/65">
      <div className="relative h-40">
        {showIframe ? (
          <iframe
            src={cameraUrl}
            title={`Camara ${printer.name}`}
            className="h-full w-full border-0 bg-black"
            loading="lazy"
            allow="autoplay; fullscreen"
            referrerPolicy="no-referrer"
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
      </div>
      <div className="space-y-1 px-3 py-2">
        <span className="block truncate text-[11px] text-slate-500">{cameraUrl || "Sin URL de camara"}</span>
        {showRtspHint && (
          <span className="block text-[10px] text-slate-600">RTSP directo no abre en navegador. Usa una URL web del proxy.</span>
        )}
      </div>
    </div>
  );
}
