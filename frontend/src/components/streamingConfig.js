export const STREAMING_STORAGE_KEY = "printer-hub-streaming-cameras";
export const STREAMING_AUTH_KEY = "printer-hub-streaming-config-auth";
export const STREAMING_FIXED_PASSWORD = "4253";
const CAM_ONE_URL = "https://cam1-gestor3d.platia.com.co/stream.html?src=cam1";
const CAM_THREE_URL = "https://cam1-gestor3d.platia.com.co/stream.html?src=cam3";

export const defaultStreamingCameras = [
  {
    id: "tapo-1",
    name: "Ender 1 y 2",
    hint: "Camara con posiciones guardadas",
    presetEntityId: "select.ender_1_y_2_move_to_preset_2",
    rotation: 0,
    presets: [
      {
        id: "preset-a",
        name: "Ender 1",
        url: CAM_THREE_URL,
        presetOption: "Ender 1",
        rotation: 90
      },
      {
        id: "preset-b",
        name: "Ender 2",
        url: CAM_THREE_URL,
        presetOption: "Ender_2",
        rotation: 270
      }
    ]
  },
  {
    id: "fija-1",
    name: "Camara 2",
    hint: "Camara fija",
    preset: "Vista fija",
    url: "https://cam1-gestor3d.platia.com.co/stream.html?src=cam2",
    rotation: 0
  },
  {
    id: "tapo-3",
    name: "Ender 3 y 4",
    hint: "Camara con posiciones guardadas",
    presetEntityId: "select.ender_3_y_4_move_to_preset",
    rotation: 0,
    presets: [
      {
        id: "preset-a",
        name: "Ender 3",
        url: CAM_ONE_URL,
        presetOption: "Ender 3",
        rotation: 90
      },
      {
        id: "preset-b",
        name: "Ender 4",
        url: CAM_ONE_URL,
        presetOption: "Ender_4",
        rotation: 270
      }
    ]
  }
];

function mergePresets(defaultCamera, savedCamera) {
  if (!defaultCamera.presets) return defaultCamera;
  return {
    ...defaultCamera,
    presets: defaultCamera.presets.map((preset) => {
      const savedPreset = savedCamera?.presets?.find((item) => item.id === preset.id);
      return savedPreset
        ? {
            ...preset,
            name: savedPreset.name || preset.name,
            url: savedPreset.url || preset.url,
            presetOption: savedPreset.presetOption || preset.presetOption || "",
            rotation: Number.isFinite(Number(savedPreset.rotation)) ? Number(savedPreset.rotation) : preset.rotation || 0
          }
        : preset;
    })
  };
}

function migrateCameraSwap(cameras) {
  if (!Array.isArray(cameras)) return cameras;

  const tapoOne = cameras.find((camera) => camera.id === "tapo-1");
  const tapoThree = cameras.find((camera) => camera.id === "tapo-3");

  const tapoOneNeedsSwap =
    tapoOne?.presets?.length &&
    tapoOne.presets.every((preset) => preset.url === CAM_ONE_URL);
  const tapoThreeNeedsSwap =
    tapoThree?.presets?.length &&
    tapoThree.presets.every((preset) => preset.url === CAM_THREE_URL);

  if (!tapoOneNeedsSwap && !tapoThreeNeedsSwap) return cameras;

  return cameras.map((camera) => {
    if (camera.id === "tapo-1" && Array.isArray(camera.presets)) {
      return {
        ...camera,
        presets: camera.presets.map((preset) => ({
          ...preset,
          url: CAM_THREE_URL
        }))
      };
    }

    if (camera.id === "tapo-3" && Array.isArray(camera.presets)) {
      return {
        ...camera,
        presets: camera.presets.map((preset) => ({
          ...preset,
          url: CAM_ONE_URL
        }))
      };
    }

    return camera;
  });
}

export function loadStreamingCameras() {
  try {
    const raw = window.localStorage.getItem(STREAMING_STORAGE_KEY);
    if (!raw) return defaultStreamingCameras;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaultStreamingCameras;
    const migrated = migrateCameraSwap(parsed);
    if (JSON.stringify(migrated) !== JSON.stringify(parsed)) {
      saveStreamingCameras(migrated);
    }
    return defaultStreamingCameras.map((camera) => {
      const saved = migrated.find((item) => item.id === camera.id);
      if (!saved) return camera;
      if (camera.presets) {
        return {
          ...mergePresets(camera, saved),
          name: saved.name || camera.name,
          hint: saved.hint || camera.hint,
          presetEntityId: saved.presetEntityId || camera.presetEntityId || "",
          rotation: Number.isFinite(Number(saved.rotation)) ? Number(saved.rotation) : camera.rotation || 0
        };
      }
      return {
        ...camera,
        name: saved.name || camera.name,
        hint: saved.hint || camera.hint,
        preset: saved.preset || camera.preset,
        url: saved.url || camera.url,
        rotation: Number.isFinite(Number(saved.rotation)) ? Number(saved.rotation) : camera.rotation || 0
      };
    });
  } catch {
    return defaultStreamingCameras;
  }
}

export function saveStreamingCameras(cameras) {
  window.localStorage.setItem(STREAMING_STORAGE_KEY, JSON.stringify(cameras));
}

export function hasStreamingPassword() {
  return true;
}

export function isStreamingConfigUnlocked() {
  return window.sessionStorage.getItem(STREAMING_AUTH_KEY) === "unlocked";
}

export function unlockStreamingConfig(password) {
  if (String(password).trim() !== STREAMING_FIXED_PASSWORD) return false;
  window.sessionStorage.setItem(STREAMING_AUTH_KEY, "unlocked");
  return true;
}

export function lockStreamingConfig() {
  window.sessionStorage.removeItem(STREAMING_AUTH_KEY);
}
