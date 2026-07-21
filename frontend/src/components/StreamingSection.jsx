import { useEffect, useMemo, useRef, useState } from "react";
import { isWebUrl } from "./cameraUtils";
import { moveStreamingPreset } from "../services/api";
import { getStreamingEntityCandidates, loadStreamingCameras } from "./streamingConfig";
import { ShareStreamModal } from "./ShareStreamModal";
import { ProgressBar } from "./ProgressBar";

function buildEmbedUrl(cameraUrl) {
  if (!isWebUrl(cameraUrl)) return "";
  try {
    const original = new URL(cameraUrl);
    const source = original.searchParams.get("src");
    const target = source ? new URL(`${original.origin}/stream.html`) : new URL(cameraUrl);

    if (source) {
      target.searchParams.set("src", source);
      target.searchParams.set("background", "false");
      target.searchParams.set("mode", original.searchParams.get("mode") || "mse");
    }

    return target.toString();
  } catch {
    return cameraUrl;
  }
}

function resolveCamera(camera, selectedPresetId) {
  if (!camera.presets?.length) {
    return {
      ...camera,
      activeUrl: camera.url || "",
      activePresetLabel: camera.preset || "Vista fija",
      activeRotation: Number(camera.rotation) || 0
    };
  }

  const activePreset = camera.presets.find((preset) => preset.id === selectedPresetId) || camera.presets[0];
  return {
    ...camera,
    activeUrl: activePreset?.url || "",
    activePresetLabel: activePreset?.name || "Preset",
    activeRotation: Number.isFinite(Number(activePreset?.rotation))
      ? Number(activePreset.rotation)
      : Number(camera.rotation) || 0
  };
}

function StreamingFrame({ camera, compact = false, interactive = false, fit = "fill" }) {
  const embedUrl = useMemo(() => buildEmbedUrl(camera.activeUrl), [camera.activeUrl]);
  const frameRef = useRef(null);
  const rotation = ((Number(camera.activeRotation) || 0) + 360) % 360;
  const isQuarterTurn = rotation === 90 || rotation === 270;
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!frameRef.current || typeof ResizeObserver === "undefined") return undefined;

    const observer = new ResizeObserver(([entry]) => {
      const nextWidth = entry.contentRect?.width || 0;
      const nextHeight = entry.contentRect?.height || 0;
      setFrameSize((current) =>
        current.width === nextWidth && current.height === nextHeight
          ? current
          : { width: nextWidth, height: nextHeight }
      );
    });

    observer.observe(frameRef.current);
    return () => observer.disconnect();
  }, []);

  if (!embedUrl) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,#18253a_0%,#0b1220_58%,#050914_100%)] text-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">No signal</p>
          <p className="mt-2 text-[11px] text-slate-600">Configura esta camara desde Configuracion</p>
        </div>
      </div>
    );
  }

  const containScale =
    isQuarterTurn && frameSize.width > 0 && frameSize.height > 0
      ? Math.min(frameSize.width / frameSize.height, frameSize.height / frameSize.width)
      : 1;
  const scale = fit === "contain" ? containScale : isQuarterTurn ? 1.08 : 1;
  const iframeWidth = isQuarterTurn && frameSize.height > 0 ? `${frameSize.height}px` : "100%";
  const iframeHeight = isQuarterTurn && frameSize.width > 0 ? `${frameSize.width}px` : "100%";

  return (
    <div ref={frameRef} className="relative h-full w-full">
      <div className="absolute inset-0 overflow-hidden bg-black">
        <iframe
          src={embedUrl}
          title={`Streaming ${camera.name}`}
          className="absolute left-1/2 top-1/2 border-0 bg-black"
          style={{
            width: iframeWidth,
            height: iframeHeight,
            clipPath: compact ? "inset(0 0 48px 0)" : "inset(0 0 54px 0)",
            transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
            transformOrigin: "center center"
          }}
          loading="lazy"
          allow="autoplay; fullscreen; picture-in-picture"
          referrerPolicy="no-referrer"
          scrolling="no"
        />
      </div>
      {!interactive && <div className="absolute inset-0 z-10" aria-hidden="true" />}
    </div>
  );
}

function isPortraitCamera(camera) {
  const rotation = ((Number(camera?.activeRotation) || 0) + 360) % 360;
  return rotation === 90 || rotation === 270;
}

function FullscreenCameraStage({
  camera,
  selectedPresetId,
  movingCameraId,
  movingPresetId,
  onSelectPreset,
  onSelectCamera,
  showPrimaryButton = false
}) {
  const portrait = isPortraitCamera(camera);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-2 flex items-center justify-between gap-3 px-1">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{camera.name}</p>
          <p className="mt-1 text-[11px] text-slate-500">{camera.activePresetLabel}</p>
        </div>
        {showPrimaryButton && (
          <button
            type="button"
            onClick={() => onSelectCamera(camera.id)}
            className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-200 transition hover:bg-white/10"
          >
            Principal
          </button>
        )}
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-black p-4 shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
        <div className={portrait ? "mx-auto h-full w-full max-w-[420px]" : "mx-auto h-full w-full max-w-[1100px]"}>
          <div className={portrait ? "h-full w-full" : "h-full w-full"}>
            <StreamingFrame camera={camera} interactive fit="contain" />
          </div>
        </div>
      </div>
      <div className="mt-3 rounded-[22px] border border-white/10 bg-[#0b1017] px-3 py-3">
        <PresetSwitcher
          camera={camera}
          selectedPresetId={selectedPresetId}
          movingPresetId={movingCameraId === camera.id ? movingPresetId : ""}
          onSelectPreset={(preset) => onSelectPreset(camera, preset)}
        />
      </div>
    </div>
  );
}

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

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 13.5l6.8 4" />
      <path d="M15.4 6.5l-6.8 4" />
    </svg>
  );
}

function PresetSwitcher({ camera, selectedPresetId, onSelectPreset, movingPresetId = "", compact = false }) {
  if (!camera.presets?.length) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${compact ? "mt-2" : "mt-3"}`}>
      {camera.presets.map((preset) => (
        <button
          key={preset.id}
          type="button"
          onClick={() => onSelectPreset(preset)}
          disabled={movingPresetId === preset.id}
          className={`rounded-2xl border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] transition ${
            movingPresetId === preset.id
              ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-200 opacity-85"
              : selectedPresetId === preset.id
              ? "border-cyan-300/35 bg-cyan-400/12 text-cyan-200"
              : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
          }`}
        >
          {movingPresetId === preset.id ? `Moviendo ${preset.name}` : preset.name}
        </button>
      ))}
    </div>
  );
}

function CameraCard({ camera, selectedPresetId, movingPresetId, onSelectPreset, onOpenFullscreen, onOpenShare }) {
  return (
    <article className="glass overflow-hidden rounded-[24px] border border-white/10 p-3 shadow-glow">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-accent">{camera.name}</p>
          <p className="mt-1 text-xs text-slate-500">{camera.hint}</p>
          <p className="mt-1 text-[11px] text-slate-600">{camera.activePresetLabel}</p>
        </div>
        <div className="relative z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenShare}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/60 text-slate-100 transition hover:border-white/25 hover:bg-black/75"
            aria-label={`Compartir ${camera.name}`}
          >
            <ShareIcon />
          </button>
          <button
            type="button"
            onClick={onOpenFullscreen}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/60 text-slate-100 transition hover:border-white/25 hover:bg-black/75"
            aria-label={`Abrir ${camera.name} en vista grande`}
          >
            <FullscreenIcon />
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/65">
        <div className="relative h-56 overflow-hidden bg-black">
          <StreamingFrame camera={camera} />
          <div className="absolute left-3 top-3 z-20 rounded-full bg-black/55 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-accent">
            Streaming
          </div>
        </div>
      </div>

      <PresetSwitcher
        camera={camera}
        selectedPresetId={selectedPresetId}
        movingPresetId={movingPresetId}
        onSelectPreset={onSelectPreset}
      />
    </article>
  );
}

function PrinterProgressStrip({ printers = [] }) {
  if (!printers.length) return null;

  return (
    <section className="glass rounded-[24px] border border-white/10 p-3 shadow-glow">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-accent">Impresoras</p>
          <p className="mt-1 text-xs text-slate-500">Progreso rapido de las 5 maquinas.</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {printers.map((printer) => {
          const progressValue = Number(printer.telemetry?.progress || 0);

          return (
            <article
              key={printer.id}
              className="rounded-[20px] border border-white/10 bg-[#0b1017] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-100">{printer.name}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    {printer.state}
                  </p>
                </div>
                <span className="text-sm font-semibold text-emerald-200">
                  {Math.round(progressValue)}%
                </span>
              </div>

              <ProgressBar value={progressValue} compact />

              <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-slate-500">
                <span className="truncate">{printer.activeJob?.name || "Sin trabajo activo"}</span>
                <span className="shrink-0">{printer.telemetry?.remaining || "0m"}</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function StreamingFullscreenWall({
  cameras,
  activeCameraId,
  selectedPresets,
  movingCameraId,
  movingPresetId,
  onSelectPreset,
  onSelectCamera,
  onOpenShare,
  onClose
}) {
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1600
  );

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const resolvedCameras = cameras.map((camera) => resolveCamera(camera, selectedPresets[camera.id]));
  const activeCamera = resolvedCameras.find((camera) => camera.id === activeCameraId) || resolvedCameras[0];
  const secondaryCameras = resolvedCameras.filter((camera) => camera.id !== activeCamera?.id);
  const featuredSecondaryCamera = secondaryCameras[0] || null;
  const canFitTwoLarge =
    Boolean(featuredSecondaryCamera) &&
    viewportWidth >= 1480 &&
    isPortraitCamera(activeCamera) &&
    isPortraitCamera(featuredSecondaryCamera);
  const mainStageCameras = canFitTwoLarge
    ? [activeCamera, featuredSecondaryCamera].filter(Boolean)
    : [activeCamera].filter(Boolean);
  const sidebarCameras = canFitTwoLarge
    ? secondaryCameras.filter((camera) => camera.id !== featuredSecondaryCamera?.id)
    : secondaryCameras;

  if (!activeCamera) return null;

  return (
    <div className="fixed inset-0 z-[160] bg-black/95">
      <div className="flex h-full flex-col p-3 sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-300">Streaming</p>
            <h2 className="truncate font-display text-xl font-semibold text-white sm:text-2xl">{activeCamera.name}</h2>
            <p className="mt-1 text-xs text-slate-500">{activeCamera.activePresetLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenShare(activeCamera)}
              className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Share
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Salir
            </button>
          </div>
        </div>

        <div className={`grid min-h-0 flex-1 gap-3 ${sidebarCameras.length ? "xl:grid-cols-[minmax(0,1fr)_320px]" : "grid-cols-1"}`}>
          <div
            className={`grid min-h-0 flex-1 gap-3 ${
              mainStageCameras.length > 1 ? "2xl:grid-cols-2" : "grid-cols-1"
            }`}
          >
            {mainStageCameras.map((camera, index) => (
              <FullscreenCameraStage
                key={camera.id}
                camera={camera}
                selectedPresetId={selectedPresets[camera.id]}
                movingCameraId={movingCameraId}
                movingPresetId={movingPresetId}
                onSelectPreset={onSelectPreset}
                onSelectCamera={onSelectCamera}
                showPrimaryButton={index > 0}
              />
            ))}
          </div>

          {sidebarCameras.length > 0 && (
            <aside className="flex w-full shrink-0 gap-3 overflow-x-auto xl:w-[320px] xl:flex-col xl:overflow-y-auto xl:overflow-x-hidden">
              {sidebarCameras.map((camera) => (
              <div
                key={camera.id}
                className="min-w-[220px] overflow-hidden rounded-[22px] border border-white/10 bg-[#0b1017] text-left xl:min-w-0"
              >
                <button
                  type="button"
                  onClick={() => onSelectCamera(camera.id)}
                  className="block w-full text-left transition hover:border-cyan-300/30"
                >
                  <div className="h-36 overflow-hidden bg-black xl:h-44">
                    <StreamingFrame camera={camera} compact fit="contain" />
                  </div>
                  <div className="border-t border-white/5 px-3 py-2">
                    <p className="truncate text-sm font-semibold text-slate-100">{camera.name}</p>
                    <p className="mt-1 text-[11px] text-slate-500">{camera.activePresetLabel}</p>
                  </div>
                </button>
                <div className="px-3 pb-3">
                  <PresetSwitcher
                    camera={camera}
                    selectedPresetId={selectedPresets[camera.id]}
                    movingPresetId={movingCameraId === camera.id ? movingPresetId : ""}
                    onSelectPreset={(preset) => onSelectPreset(camera, preset)}
                    compact
                  />
                </div>
              </div>
              ))}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

export function StreamingSection({ configVersion = 0, printers = [] }) {
  const [fullscreenCameraId, setFullscreenCameraId] = useState(null);
  const [shareTarget, setShareTarget] = useState(null);
  const [movingCameraId, setMovingCameraId] = useState("");
  const [movingPresetId, setMovingPresetId] = useState("");
  const [mobileCameraId, setMobileCameraId] = useState("tapo-1");
  const [feedback, setFeedback] = useState("");
  const [selectedPresets, setSelectedPresets] = useState({
    "tapo-1": "preset-a",
    "tapo-3": "preset-a"
  });
  const cameras = useMemo(() => loadStreamingCameras(), [configVersion]);
  const resolvedCameras = useMemo(
    () => cameras.map((camera) => resolveCamera(camera, selectedPresets[camera.id])),
    [cameras, selectedPresets]
  );
  const availableFullscreenCameras = resolvedCameras.filter((camera) => isWebUrl(camera.activeUrl));
  const isFullscreenOpen = Boolean(fullscreenCameraId && availableFullscreenCameras.length > 0);

  const handleOpenShare = (camera) => {
    const embedUrl = buildEmbedUrl(camera.activeUrl);
    if (!embedUrl) return;
    setShareTarget({
      cameraId: camera.id,
      cameraName: camera.name,
      presetLabel: camera.activePresetLabel,
      streamUrl: camera.activeUrl,
      embedUrl,
      rotation: Number(camera.activeRotation) || 0
    });
  };

  const handleSelectPreset = async (camera, preset) => {
    setSelectedPresets((current) => ({ ...current, [camera.id]: preset.id }));
    if (!camera.presetEntityId || !preset?.presetOption) return;
    try {
      setFeedback("");
      setMovingCameraId(camera.id);
      setMovingPresetId(preset.id);
      await moveStreamingPreset(
        camera.presetEntityId,
        preset.presetOption,
        getStreamingEntityCandidates(camera)
      );
      setFeedback(`${camera.name}: movida a ${preset.name}.`);
    } catch (error) {
      setFeedback(error.message || `No fue posible mover ${camera.name}.`);
    } finally {
      window.setTimeout(() => {
        setMovingCameraId("");
        setMovingPresetId("");
      }, 600);
    }
  };

  const activeMobileCamera =
    resolvedCameras.find((camera) => camera.id === mobileCameraId) || resolvedCameras[0] || null;

  return (
    <>
      {feedback && (
        <div className="glass mb-3 rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-300">
          {feedback}
        </div>
      )}

      {!isFullscreenOpen && (
        <>
          <section className="space-y-3 lg:hidden">
            <div className="glass rounded-[24px] border border-white/10 p-3 shadow-glow">
              <p className="text-[10px] uppercase tracking-[0.24em] text-accent">Streaming movil</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {resolvedCameras.map((camera) => (
                  <button
                    key={camera.id}
                    type="button"
                    onClick={() => setMobileCameraId(camera.id)}
                    className={`rounded-2xl border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] transition ${
                      activeMobileCamera?.id === camera.id
                        ? "border-cyan-300/35 bg-cyan-400/12 text-cyan-200"
                        : "border-white/10 bg-white/5 text-slate-300"
                    }`}
                  >
                    {camera.name}
                  </button>
                ))}
              </div>
            </div>

            {activeMobileCamera && (
              <CameraCard
                key={activeMobileCamera.id}
                camera={activeMobileCamera}
                selectedPresetId={selectedPresets[activeMobileCamera.id]}
                movingPresetId={movingCameraId === activeMobileCamera.id ? movingPresetId : ""}
                onSelectPreset={(preset) => handleSelectPreset(activeMobileCamera, preset)}
                onOpenShare={() => handleOpenShare(activeMobileCamera)}
                onOpenFullscreen={() => setFullscreenCameraId(activeMobileCamera.id)}
              />
            )}
          </section>

          <section className="hidden gap-3 lg:grid lg:grid-cols-2 2xl:grid-cols-3">
            {resolvedCameras.map((camera) => (
              <CameraCard
                key={camera.id}
                camera={camera}
                selectedPresetId={selectedPresets[camera.id]}
                movingPresetId={movingCameraId === camera.id ? movingPresetId : ""}
                onSelectPreset={(preset) => handleSelectPreset(camera, preset)}
                onOpenShare={() => handleOpenShare(camera)}
                onOpenFullscreen={() => setFullscreenCameraId(camera.id)}
              />
            ))}
          </section>

          <PrinterProgressStrip printers={printers} />
        </>
      )}

      {isFullscreenOpen && (
        <StreamingFullscreenWall
          cameras={cameras}
          activeCameraId={fullscreenCameraId}
          selectedPresets={selectedPresets}
          movingCameraId={movingCameraId}
          movingPresetId={movingPresetId}
          onSelectPreset={handleSelectPreset}
          onSelectCamera={setFullscreenCameraId}
          onOpenShare={handleOpenShare}
          onClose={() => setFullscreenCameraId(null)}
        />
      )}

      <ShareStreamModal
        open={Boolean(shareTarget)}
        shareTarget={shareTarget}
        onClose={() => setShareTarget(null)}
      />
    </>
  );
}
