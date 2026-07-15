import { printers } from "../data/mockData.js";
import { slugify } from "../utils/formatters.js";
import { materialService } from "./materialService.js";

class PrinterConfigService {
  constructor() {
    this.printers = structuredClone(printers);
    const ender4 = this.printers.find((printer) => printer.id === "ender-4");
    if (ender4) {
      ender4.cameraUrl = "https://cam1-gestor3d.platia.com.co/stream.html?src=cam1&mode=mse";
    }
  }

  withSpool(printer) {
    if (!printer) return printer;
    return { ...printer, spool: materialService.getSpool(printer.id) };
  }

  // Referencia real dentro de this.printers, para metodos que necesitan
  // mutar el estado en el sitio (togglePower, syncPowerState, etc). NO usar
  // esto para responder a rutas HTTP directamente: usa getById()/list().
  getRaw(id) {
    return this.printers.find((printer) => printer.id === id) || null;
  }

  list() {
    return this.printers.map((printer) => this.withSpool(printer));
  }

  getById(id) {
    return this.withSpool(this.getRaw(id));
  }

  create(payload) {
    const printer = {
      id: slugify(payload.name || `printer-${Date.now()}`),
      syncMode: payload.syncMode || "mock",
      state: "offline",
      powerEnabled: payload.powerEnabled ?? true,
      powerState: "off",
      powerOverride: payload.powerOverride || null,
      readyOverride: payload.readyOverride ?? false,
      lightEnabled: payload.lightEnabled ?? false,
      lightState: payload.lightState || "off",
      queueSize: 0,
      idleMinutes: 0,
      speedFactor: 1,
      activeMaterial: payload.materials?.[0] || "PLA",
      telemetry: {
        progress: 0,
        nozzle: { actual: 25, target: 0 },
        bed: { actual: 25, target: 0 },
        elapsedMinutes: 0,
        remainingMinutes: 0,
        estimatedMinutes: 0,
        currentFile: "Sin trabajo",
        position: { x: 0, y: 0, z: 0 },
        velocity: 0
      },
      ...payload
    };
    this.printers.push(printer);
    return printer;
  }

  update(id, payload) {
    const index = this.printers.findIndex((printer) => printer.id === id);
    if (index === -1) return null;
    this.printers[index] = { ...this.printers[index], ...payload };
    return this.printers[index];
  }

  remove(id) {
    const index = this.printers.findIndex((printer) => printer.id === id);
    if (index === -1) return false;
    this.printers.splice(index, 1);
    return true;
  }

  togglePower(id, action) {
    const printer = this.getRaw(id);
    if (!printer) return null;
    printer.powerState = action === "on" ? "on" : "off";
    printer.powerOverride = printer.powerState;
    printer.readyOverride = false;
    printer.state = action === "on" ? "offline" : "offline";
    printer.telemetry.currentFile = action === "on" ? "Esperando Moonraker / Klipper" : "Apagada por Home Assistant";
    return this.withSpool(printer);
  }

  syncPowerState(id, powerState) {
    const printer = this.getRaw(id);
    if (!printer) return null;
    const previousPowerState = printer.powerState;
    printer.powerState = powerState === "on" ? "on" : "off";
    printer.powerOverride = printer.powerState;
    if (printer.powerState === "off") {
      printer.readyOverride = false;
      printer.state = "offline";
      printer.telemetry = {
        ...printer.telemetry,
        velocity: 0,
        nozzle: {
          ...printer.telemetry.nozzle,
          target: 0
        },
        bed: {
          ...printer.telemetry.bed,
          target: 0
        },
        currentFile: "Apagada por Home Assistant"
      };
    } else if (previousPowerState === "off" && printer.state === "offline") {
      printer.telemetry = {
        ...printer.telemetry,
        currentFile: "Esperando Moonraker / Klipper"
      };
    }
    return printer;
  }

  markReady(id) {
    const printer = this.getRaw(id);
    if (!printer) return null;
    printer.readyOverride = true;
    printer.state = "ready";
    return this.withSpool(printer);
  }

  applySnapshot(id, snapshot) {
    const index = this.printers.findIndex((printer) => printer.id === id);
    if (index === -1) return null;
    const current = this.printers[index];
    const effectivePowerState = current.powerOverride || snapshot.powerState || current.powerState;
    let readyOverride = current.readyOverride ?? false;
    if (snapshot.state && snapshot.state !== "finished") {
      readyOverride = false;
    }
    const effectiveState = effectivePowerState === "off"
      ? "offline"
      : snapshot.state === "finished" && readyOverride
        ? "ready"
        : snapshot.state;
    this.printers[index] = {
      ...current,
      ...snapshot,
      powerState: effectivePowerState,
      readyOverride,
      state: effectiveState,
      telemetry: {
        ...current.telemetry,
        ...snapshot.telemetry
      }
    };
    if (effectivePowerState === "off") {
      this.printers[index].telemetry = {
        ...this.printers[index].telemetry,
        velocity: 0,
        currentFile: "Apagada por Home Assistant"
      };
    }
    if (current.state === "printing" && effectiveState === "finished" && current.pendingDeduction) {
      materialService.deduct(id, current.pendingDeduction.grams);
      this.printers[index].pendingDeduction = null;
    }
    return this.withSpool(this.printers[index]);
  }

  toggleLight(id) {
    const printer = this.getRaw(id);
    if (!printer) return null;
    printer.lightState = printer.lightState === "on" ? "off" : "on";
    return this.withSpool(printer);
  }

  markDispatched(id, file) {
    const index = this.printers.findIndex((printer) => printer.id === id);
    if (index === -1) return null;
    const printer = this.printers[index];
    printer.readyOverride = false;
    printer.powerState = "on";
    printer.powerOverride = "on";
    printer.state = "printing";
    printer.activeMaterial = file.material || printer.activeMaterial;
    printer.queueSize = Math.max(0, (printer.queueSize || 0) - 1);
    printer.pendingDeduction = file.weightGrams
      ? { fileName: file.filename || file.name || "", grams: file.weightGrams }
      : null;
    printer.telemetry = {
      ...printer.telemetry,
      progress: 0,
      elapsedMinutes: 0,
      remainingMinutes: file.estimatedMinutes || printer.telemetry.remainingMinutes || 0,
      estimatedMinutes: file.estimatedMinutes || printer.telemetry.estimatedMinutes || 0,
      currentFile: file.filename || file.name || "Trabajo enviado",
      velocity: 0
    };
    return this.withSpool(printer);
  }

  markServiceRestart(id, target) {
    const printer = this.getRaw(id);
    if (!printer) return null;
    printer.powerState = "on";
    printer.powerOverride = "on";
    printer.state = "offline";
    printer.telemetry = {
      ...printer.telemetry,
      currentFile: target === "moonraker" ? "Reiniciando Moonraker..." : "Reiniciando Klipper..."
    };
    return this.withSpool(printer);
  }
}

export const printerConfigService = new PrinterConfigService();
