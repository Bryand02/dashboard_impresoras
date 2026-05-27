import { useMemo, useRef, useState } from "react";

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

export function FloatingCameraWindow({ printer, position, onMove, onClose }) {
  const [dragState, setDragState] = useState(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const windowRef = useRef(null);
  const go2RtcSource = useMemo(() => getGo2RtcSource(printer.cameraUrl || ""), [printer.cameraUrl]);
  const showVideo = isWebUrl(printer.cameraUrl || "") && Boolean(go2RtcSource?.videoUrl) && !videoFailed;

  const handlePointerDown = (event) => {
    if (event.button !== 0) return;
    const rect = windowRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDragState({
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top
    });
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!dragState) return;
    onMove({
      x: Math.max(16, event.clientX - dragState.offsetX),
      y: Math.max(16, event.clientY - dragState.offsetY)
    });
  };

  const handlePointerUp = () => {
    setDragState(null);
  };

  return (
    <div
      ref={windowRef}
      className="fixed z-[80] overflow-hidden rounded-[22px] border border-white/15 bg-black shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
      style={{ left: `${position.x}px`, top: `${position.y}px`, width: "360px", height: "220px" }}
    >
      <div
        className="absolute inset-x-0 top-0 z-10 flex h-9 items-center justify-end bg-gradient-to-b from-black/70 to-transparent px-2"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-xl leading-none text-white transition hover:bg-black/75"
          aria-label="Cerrar mini ventana"
        >
          ×
        </button>
      </div>

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
      ) : isWebUrl(printer.cameraUrl || "") ? (
        <iframe
          src={printer.cameraUrl}
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
  );
}
