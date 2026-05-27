import { useMemo, useState } from "react";

const isWebUrl = (url = "") => /^https?:\/\//i.test(url);

const getGo2RtcSource = (cameraUrl) => {
  try {
    const parsed = new URL(cameraUrl);
    const src = parsed.searchParams.get("src");
    if (!src) return null;
    return {
      videoUrl: `${parsed.origin}/api/stream.mp4?src=${encodeURIComponent(src)}`
    };
  } catch {
    return null;
  }
};

export function FloatingCameraWindow({ printer, onClose }) {
  const [videoFailed, setVideoFailed] = useState(false);
  const cameraUrl = printer.cameraUrl || "";
  const go2RtcSource = useMemo(() => getGo2RtcSource(cameraUrl), [cameraUrl]);
  const showVideo = isWebUrl(cameraUrl) && Boolean(go2RtcSource?.videoUrl) && !videoFailed;

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
        {showVideo ? (
          <video
            src={go2RtcSource.videoUrl}
            className="h-full w-full object-cover"
            autoPlay
            muted
            playsInline
            controls={false}
            disablePictureInPicture
            onError={() => setVideoFailed(true)}
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
