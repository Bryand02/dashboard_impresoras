import { useMemo, useState } from "react";
import { getGo2RtcSource, isWebUrl } from "./cameraUtils";
import { moveStreamingPreset } from "../services/api";
import { loadStreamingCameras } from "./streamingConfig";
import { ShareStreamModal } from "./ShareStreamModal";
import { ProgressBar } from "./ProgressBar";

function buildEmbedUrl(cameraUrl) {
  if (!isWebUrl(cameraUrl)) return "";
  const source = getGo2RtcSource(cameraUrl);
  try {
    const target = new URL(source?.webRtcUrl || cameraUrl);
    target.searchParams.set("autoplay", "1");
    target.searchParams.set("muted", "1");
    return target.toString();
  } catch {
    return source?.webRtcUrl || cameraUrl;
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

function StreamingFrame({ camera, compact = false, interactive = false }) {
  const embedUrl = useMemo(() => buildEmbedUrl(camera.activeUrl), [camera.activeUrl]);
  const rotation = ((Number(camera.activeRotation) || 0) + 360) % 360;
  const isQuarterTurn = rotation === 90 || rotation === 270;

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

  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 overflow-hidden bg-black">
        <iframe
          src={embedUrl}
          title={`Streaming ${camera.name}`}
          className="absolute left-1/2 top-1/2 border-0 bg-black"
          style={{
            width: isQuarterTurn ? "100%" : "100%",
            height: isQuarterTurn ? "100%" : "100%",
            clipPath: compact ? "inset(0 0 48px 0)" : "inset(0 0 54px 0)",
            transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${isQuarterTurn ? 1.08 : 1})`,
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
  const resolvedCameras = cameras.map((camera) => resolveCamera(camera, selectedPresets[camera.id]));
  const activeCamera = resolvedCameras.find((camera) => camera.id === activeCameraId) || resolvedCameras[0];
  const secondaryCameras = resolvedCameras.filter((camera) => camera.id !== activeCamera?.id);

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

        <div className="flex min-h-0 flex-1 flex-col gap-3 md:flex-row">
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-hidden rounded-[28px] border border-white/10 bg-black shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
              <StreamingFrame camera={activeCamera} interactive />
            </div>
            <div className="mt-3 rounded-[22px] border border-white/10 bg-[#0b1017] px-3 py-3">
              <PresetSwitcher
                camera={activeCamera}
                selectedPresetId={selectedPresets[activeCamera.id]}
                movingPresetId={movingCameraId === activeCamera.id ? movingPresetId : ""}
                onSelectPreset={(preset) => onSelectPreset(activeCamera, preset)}
              />
            </div>
          </div>

          <aside className="flex w-full shrink-0 gap-3 overflow-x-auto md:w-[260px] md:flex-col md:overflow-y-auto md:overflow-x-hidden">
            {secondaryCameras.map((camera) => (
              <div
                key={camera.id}
                className="min-w-[180px] overflow-hidden rounded-[22px] border border-white/10 bg-[#0b1017] text-left md:min-w-0"
              >
                <button
                  type="button"
                  onClick={() => onSelectCamera(camera.id)}
                  className="block w-full text-left transition hover:border-cyan-300/30"
                >
                  <div className="h-28 overflow-hidden bg-black md:h-36">
                    <StreamingFrame camera={camera} compact />
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

  const handleOpenShare = (camera) => {
    const embedUrl = buildEmbedUrl(camera.activeUrl);
    if (!embedUrl) return;
    setShareTarget({
      cameraId: camera.id,
      cameraName: camera.name,
      presetLabel: camera.activePresetLabel,
      streamUrl: camera.activeUrl,
      embedUrl
    });
  };

  const handleSelectPreset = async (camera, preset) => {
    setSelectedPresets((current) => ({ ...current, [camera.id]: preset.id }));
    if (!camera.presetEntityId || !preset?.presetOption) return;
    try {
      setFeedback("");
      setMovingCameraId(camera.id);
      setMovingPresetId(preset.id);
      await moveStreamingPreset(camera.presetEntityId, preset.presetOption);
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

      <section className="hidden gap-3 lg:grid xl:grid-cols-3">
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

      {fullscreenCameraId && availableFullscreenCameras.length > 0 && (
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

