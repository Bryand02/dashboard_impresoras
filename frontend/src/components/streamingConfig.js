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
    presetEntityCandidates: [
      "select.ender_1_y_2_move_to_preset_2",
      "select.ender_1_y_2_move_to_preset"
    ],
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
    presetEntityCandidates: ["select.ender_3_y_4_move_to_preset"],
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

function slugifyPreset(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createPresetId(option, index = 0) {
  const slug = slugifyPreset(option);
  return slug ? `preset-${slug}` : `preset-${index + 1}`;
}

function buildPresetFromOption(option, index, existingPreset, fallbackPreset, fallbackUrl, fallbackRotation) {
  return {
    id: existingPreset?.id || fallbackPreset?.id || createPresetId(option, index),
    name: existingPreset?.name || fallbackPreset?.name || option,
    url: existingPreset?.url || fallbackPreset?.url || fallbackUrl || "",
    presetOption: option,
    rotation: Number.isFinite(Number(existingPreset?.rotation))
      ? Number(existingPreset.rotation)
      : Number.isFinite(Number(fallbackPreset?.rotation))
      ? Number(fallbackPreset.rotation)
      : fallbackRotation || 0
  };
}

function mergePresets(defaultCamera, savedCamera) {
  if (!defaultCamera.presets) return defaultCamera;
  const basePresets = Array.isArray(savedCamera?.presets) && savedCamera.presets.length
    ? savedCamera.presets
    : defaultCamera.presets;
  const fallbackUrl = savedCamera?.presets?.[0]?.url || defaultCamera.presets?.[0]?.url || "";
  const fallbackRotation = Number(savedCamera?.rotation) || Number(defaultCamera.rotation) || 0;

  return {
    ...defaultCamera,
    presets: basePresets.map((preset, index) => {
      const defaultPreset =
        defaultCamera.presets.find((item) => item.id === preset.id) ||
        defaultCamera.presets.find((item) => item.presetOption === preset.presetOption) ||
        defaultCamera.presets.find((item) => item.name === preset.name);

      return buildPresetFromOption(
        preset.presetOption || preset.name || `Preset ${index + 1}`,
        index,
        preset,
        defaultPreset,
        fallbackUrl,
        fallbackRotation
      );
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
          presetEntityCandidates:
            Array.isArray(saved.presetEntityCandidates) && saved.presetEntityCandidates.length
              ? saved.presetEntityCandidates
              : camera.presetEntityCandidates || [],
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

export function getStreamingEntityCandidates(camera) {
  const candidates = [
    camera?.presetEntityId,
    ...(Array.isArray(camera?.presetEntityCandidates) ? camera.presetEntityCandidates : [])
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  return [...new Set(candidates)];
}

export function syncCameraPresets(camera, options = []) {
  if (!camera?.presetEntityId || !Array.isArray(options) || !options.length) return camera;

  const fallbackUrl = camera.presets?.[0]?.url || "";
  const fallbackRotation = Number(camera.rotation) || 0;

  return {
    ...camera,
    presets: options.map((option, index) => {
      const existingPreset =
        camera.presets?.find((preset) => preset.presetOption === option) ||
        camera.presets?.find((preset) => preset.name === option) ||
        camera.presets?.[index];

      return buildPresetFromOption(
        option,
        index,
        existingPreset,
        null,
        fallbackUrl,
        fallbackRotation
      );
    })
  };
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
