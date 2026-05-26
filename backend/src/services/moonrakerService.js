import { printerConfigService } from "./printerConfigService.js";

const DEFAULT_TIMEOUT_MS = 8000;

const toMinutes = (seconds) => Math.max(0, Math.round((seconds || 0) / 60));
const progressToRatio = (progress) => {
  if (!progress && progress !== 0) return 0;
  return Math.min(1, Math.max(0, progress > 1 ? progress / 100 : progress));
};
const mapPrintState = (state, fallbackState) => {
  if (state === "printing") return "printing";
  if (state === "paused") return "paused";
  if (state === "complete") return "finished";
  if (state === "error" || state === "cancelled") return "error";
  if (fallbackState === "ready") return "online";
  return "offline";
};

class MoonrakerService {
  normalizeBaseUrl(url) {
    return url.replace(/\/+$/, "");
  }

  async requestJson(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`Moonraker request failed with ${response.status}`);
      }
      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  async getPrinterSnapshot(printer) {
    const baseUrl = this.normalizeBaseUrl(printer.moonrakerUrl);
    const queryUrl = `${baseUrl}/printer/objects/query?webhooks&print_stats&virtual_sdcard&extruder&heater_bed&toolhead&gcode_move&motion_report`;
    const objects = await this.requestJson(queryUrl);
    const status = objects.result?.status || {};
    const printStats = status.print_stats || {};
    const virtualSd = status.virtual_sdcard || {};
    const toolhead = status.toolhead || {};
    const motionReport = status.motion_report || {};
    const gcodeMove = status.gcode_move || {};
    const filename = printStats.filename;

    let metadata = null;
    if (filename) {
      const metadataUrl = `${baseUrl}/server/files/metadata?filename=${encodeURIComponent(filename)}`;
      metadata = (await this.requestJson(metadataUrl)).result;
    }

    const progressRatio = progressToRatio(virtualSd.progress || 0);
    const elapsedSeconds = printStats.print_duration || printStats.total_duration || 0;
    const slicerEstimatedSeconds = metadata?.estimated_time || 0;
    const progressEstimatedSeconds = progressRatio > 0 ? elapsedSeconds / progressRatio : 0;
    const estimatedSeconds = Math.max(slicerEstimatedSeconds, progressEstimatedSeconds, elapsedSeconds);
    const remainingSeconds = Math.max(0, estimatedSeconds - elapsedSeconds);
    const axisMaximum = toolhead.axis_maximum || [printer.volume?.x || 0, printer.volume?.y || 0, printer.volume?.z || 0];
    const thumbnailRelativePath = metadata?.thumbnails?.find((thumb) => thumb.width >= 300)?.relative_path || metadata?.thumbnails?.[0]?.relative_path;
    const thumbnailUrl = thumbnailRelativePath
      ? `${baseUrl}/server/files/gcodes/${thumbnailRelativePath.split("/").map(encodeURIComponent).join("/")}`
      : null;

    return {
      syncMode: "live",
      state: mapPrintState(printStats.state, status.webhooks?.state),
      powerState: "on",
      profile: metadata?.slicer ? `${metadata.slicer} ${metadata.layer_height ? `${metadata.layer_height}mm` : ""}`.trim() : printer.profile,
      activeMaterial: metadata?.filament_type || printer.activeMaterial,
      materials: metadata?.filament_type
        ? Array.from(new Set([metadata.filament_type, ...(printer.materials || [])]))
        : printer.materials,
      volume: {
        x: axisMaximum[0] || printer.volume.x,
        y: axisMaximum[1] || printer.volume.y,
        z: axisMaximum[2] || printer.volume.z
      },
      currentFileId: filename || null,
      lastSyncAt: new Date().toISOString(),
      syncError: null,
      telemetry: {
        progress: Math.round((virtualSd.progress || 0) * 1000) / 10,
        nozzle: {
          actual: status.extruder?.temperature || 0,
          target: status.extruder?.target || 0
        },
        bed: {
          actual: status.heater_bed?.temperature || 0,
          target: status.heater_bed?.target || 0
        },
        elapsedMinutes: toMinutes(elapsedSeconds),
        remainingMinutes: toMinutes(remainingSeconds),
        estimatedMinutes: toMinutes(estimatedSeconds),
        slicerEstimatedMinutes: toMinutes(slicerEstimatedSeconds),
        currentFile: filename || status.webhooks?.state_message || "Sin trabajo",
        position: {
          x: motionReport.live_position?.[0] ?? toolhead.position?.[0] ?? 0,
          y: motionReport.live_position?.[1] ?? toolhead.position?.[1] ?? 0,
          z: motionReport.live_position?.[2] ?? toolhead.position?.[2] ?? 0
        },
        velocity: motionReport.live_velocity ?? ((gcodeMove.speed || 0) / 60),
        totalLayers: metadata?.layer_count || null,
        currentLayer: printStats.info?.current_layer || null,
        filamentType: metadata?.filament_type || null,
        filamentWeight: metadata?.filament_weight_total || null,
        thumbnailUrl
      }
    };
  }

  async syncLivePrinters() {
    const livePrinters = printerConfigService.list().filter((printer) => printer.syncMode === "live" && printer.moonrakerUrl);
    await Promise.all(
      livePrinters.map(async (printer) => {
        try {
          const snapshot = await this.getPrinterSnapshot(printer);
          printerConfigService.applySnapshot(printer.id, snapshot);
        } catch (error) {
          printerConfigService.applySnapshot(printer.id, {
            state: "offline",
            syncError: error.message,
            lastSyncAt: new Date().toISOString()
          });
        }
      })
    );
  }

  async uploadGcode(printer, file) {
    return {
      message: `Simulacion: ${file.filename} preparado para ${printer.name}.`,
      uploadTarget: printer.moonrakerUrl
    };
  }

  async startPrint(printer, file) {
    return {
      message: `Simulacion: inicio de impresion ${file.filename} en ${printer.name}.`
    };
  }

  // Integracion real:
  // 1. Conectar WebSocket Moonraker por impresora.
  // 2. Consumir /printer/objects/query y /server/files/upload.
  // 3. Suscribirse a printer.objects.subscribe.
}

export const moonrakerService = new MoonrakerService();
