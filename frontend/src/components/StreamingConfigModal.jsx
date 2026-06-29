import { useEffect, useState } from "react";
import { fetchStreamingPresets } from "../services/api";
import {
  getStreamingEntityCandidates,
  isStreamingConfigUnlocked,
  loadStreamingCameras,
  lockStreamingConfig,
  saveStreamingCameras,
  syncCameraPresets,
  unlockStreamingConfig
} from "./streamingConfig";

function inputClass() {
  return "mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/65 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-300/40";
}

function updatePreset(cameras, cameraId, presetId, key, value) {
  return cameras.map((camera) => {
    if (camera.id !== cameraId) return camera;
    return {
      ...camera,
      presets: camera.presets.map((preset) => (preset.id === presetId ? { ...preset, [key]: value } : preset))
    };
  });
}

const rotationOptions = [
  { value: 0, label: "0 grados" },
  { value: 90, label: "90 grados" },
  { value: 180, label: "180 grados" },
  { value: 270, label: "270 grados" },
  { value: 360, label: "360 grados" }
];

function rotationSelectClass() {
  return "mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/65 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-300/40";
}

export function StreamingConfigModal({ open, onClose, onSaved }) {
  const [mode, setMode] = useState("locked");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cameras, setCameras] = useState([]);
  const [syncingCameraId, setSyncingCameraId] = useState("");
  const [syncMessage, setSyncMessage] = useState("");

  useEffect(() => {
    if (!open) return;
    const unlocked = isStreamingConfigUnlocked();
    if (unlocked) {
      setMode("edit");
      setCameras(loadStreamingCameras());
    } else {
      setMode("locked");
    }
    setPassword("");
    setError("");
    setSyncMessage("");
    setSyncingCameraId("");
  }, [open]);

  if (!open) return null;

  const handleUnlock = () => {
    if (!unlockStreamingConfig(password)) {
      setError("Clave incorrecta.");
      return;
    }
    setMode("edit");
    setCameras(loadStreamingCameras());
    setPassword("");
    setError("");
  };

  const handleSave = () => {
    saveStreamingCameras(cameras);
    onSaved();
    onClose();
  };

  const handleLock = () => {
    lockStreamingConfig();
    onClose();
  };

  const updateCamera = (cameraId, key, value) => {
    setCameras((current) => current.map((camera) => (camera.id === cameraId ? { ...camera, [key]: value } : camera)));
  };

  const handleSyncPresets = async (camera) => {
    if (!camera?.presetEntityId) return;
    try {
      setSyncingCameraId(camera.id);
      setError("");
      setSyncMessage("");
      const response = await fetchStreamingPresets(
        camera.presetEntityId,
        getStreamingEntityCandidates(camera)
      );
      setCameras((current) =>
        current.map((item) => (item.id === camera.id ? syncCameraPresets(item, response.options) : item))
      );
      setSyncMessage(`${camera.name}: ${response.options.length} presets sincronizados.`);
    } catch (syncError) {
      setError(syncError.message || `No fue posible sincronizar ${camera.name}.`);
    } finally {
      setSyncingCameraId("");
    }
  };

  return (
    <div className="fixed inset-0 z-[170] overflow-y-auto bg-black/55 p-3 sm:p-6">
      <div className="mx-auto max-w-4xl rounded-[28px] border border-white/10 bg-[#080b11] p-4 shadow-[0_32px_80px_rgba(0,0,0,0.78)] sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-accent">Configuracion</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-white">Streaming</h2>
            <p className="mt-1 text-sm text-slate-500">Edita nombres, presets/posiciones y URLs de las 3 camaras.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200"
          >
            Cerrar
          </button>
        </div>

        {mode === "locked" && (
          <div className="rounded-3xl border border-white/10 bg-[#0f141c] p-4">
            <label className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Clave</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClass()}
              placeholder="Ingresa la clave fija"
            />
            {error && <p className="mt-2 text-sm text-rose-300">{error}</p>}
            <button
              type="button"
              onClick={handleUnlock}
              className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200"
            >
              Desbloquear configuracion
            </button>
          </div>
        )}

        {mode === "edit" && (
          <div className="max-h-[calc(100vh-9rem)] space-y-3 overflow-y-auto pr-1">
            {syncMessage && <p className="text-sm text-emerald-300">{syncMessage}</p>}
            {cameras.map((camera) => (
              <div key={camera.id} className="rounded-3xl border border-white/10 bg-[#0f141c] p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Nombre</label>
                    <input
                      type="text"
                      value={camera.name}
                      onChange={(event) => updateCamera(camera.id, "name", event.target.value)}
                      className={inputClass()}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Tipo</label>
                    <input
                      type="text"
                      value={camera.hint}
                      onChange={(event) => updateCamera(camera.id, "hint", event.target.value)}
                      className={inputClass()}
                    />
                  </div>
                </div>

                {camera.presetEntityId && (
                  <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                    <div>
                      <label className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Entidad Home Assistant</label>
                      <input
                        type="text"
                        value={camera.presetEntityId}
                        onChange={(event) => updateCamera(camera.id, "presetEntityId", event.target.value)}
                        className={inputClass()}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSyncPresets(camera)}
                      disabled={syncingCameraId === camera.id}
                      className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {syncingCameraId === camera.id ? "Sincronizando..." : "Sincronizar presets"}
                    </button>
                  </div>
                )}

                <div className="mt-3 max-w-xs">
                  <label className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Rotacion del viewport</label>
                  <select
                    value={Number(camera.rotation) || 0}
                    onChange={(event) => updateCamera(camera.id, "rotation", Number(event.target.value))}
                    className={rotationSelectClass()}
                  >
                    {rotationOptions.map((option) => (
                      <option key={option.value} value={option.value} className="bg-slate-950">
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {camera.presets?.length ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {camera.presets.map((preset) => (
                      <div key={preset.id} className="rounded-2xl border border-white/10 bg-slate-950/35 p-3">
                        <label className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Nombre preset</label>
                        <input
                          type="text"
                          value={preset.name}
                          onChange={(event) => setCameras((current) => updatePreset(current, camera.id, preset.id, "name", event.target.value))}
                          className={inputClass()}
                        />
                        <label className="mt-3 block text-[10px] uppercase tracking-[0.18em] text-slate-500">URL preset</label>
                        <input
                          type="text"
                          value={preset.url}
                          onChange={(event) => setCameras((current) => updatePreset(current, camera.id, preset.id, "url", event.target.value))}
                          className={inputClass()}
                          placeholder="https://..."
                        />
                        <label className="mt-3 block text-[10px] uppercase tracking-[0.18em] text-slate-500">Rotacion de esta posicion</label>
                        <select
                          value={Number(preset.rotation) || 0}
                          onChange={(event) =>
                            setCameras((current) => updatePreset(current, camera.id, preset.id, "rotation", Number(event.target.value)))
                          }
                          className={rotationSelectClass()}
                        >
                          {rotationOptions.map((option) => (
                            <option key={option.value} value={option.value} className="bg-slate-950">
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Preset / posicion</label>
                      <input
                        type="text"
                        value={camera.preset}
                        onChange={(event) => updateCamera(camera.id, "preset", event.target.value)}
                        className={inputClass()}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-[0.18em] text-slate-500">URL camara</label>
                      <input
                        type="text"
                        value={camera.url}
                        onChange={(event) => updateCamera(camera.id, "url", event.target.value)}
                        className={inputClass()}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={handleSave}
                className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200"
              >
                Guardar streaming
              </button>
              <button
                type="button"
                onClick={handleLock}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-200"
              >
                Bloquear
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
