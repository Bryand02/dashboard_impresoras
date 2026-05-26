import { printers } from "../data/mockData.js";
import { slugify } from "../utils/formatters.js";

class PrinterConfigService {
  constructor() {
    this.printers = structuredClone(printers);
  }

  list() {
    return this.printers;
  }

  getById(id) {
    return this.printers.find((printer) => printer.id === id) || null;
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
    const printer = this.getById(id);
    if (!printer) return null;
    printer.powerState = action === "on" ? "on" : "off";
    printer.powerOverride = printer.powerState;
    printer.readyOverride = false;
    printer.state = action === "on" ? "online" : "offline";
    printer.telemetry.currentFile = action === "on" ? "Encendida por Home Assistant" : "Apagada por Home Assistant";
    return printer;
  }

  syncPowerState(id, powerState) {
    const printer = this.getById(id);
    if (!printer) return null;
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
    }
    return printer;
  }

  markReady(id) {
    const printer = this.getById(id);
    if (!printer) return null;
    printer.readyOverride = true;
    printer.state = "ready";
    return printer;
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
    return this.printers[index];
  }

  toggleLight(id) {
    const printer = this.getById(id);
    if (!printer) return null;
    printer.lightState = printer.lightState === "on" ? "off" : "on";
    return printer;
  }
}

export const printerConfigService = new PrinterConfigService();
