import { printerConfigService } from "./printerConfigService.js";
import { queueService } from "./queueService.js";
import { normalizeMaterial } from "../utils/gcodeParser.js";

class PrinterAssignmentService {
  getPhysicalCompatibilityReason(printer, file) {
    if (!printer) return "Impresora no encontrada";
    const printerMaterials = (printer.materials || []).map(normalizeMaterial);
    const fileMaterial = normalizeMaterial(file.material);
    if (fileMaterial && !printerMaterials.includes(fileMaterial)) return `Material no compatible: ${file.material}`;
    if (
      file.dimensions?.x > printer.volume.x ||
      file.dimensions?.y > printer.volume.y ||
      file.dimensions?.z > printer.volume.z
    ) {
      return "Volumen insuficiente";
    }
    return "Compatible";
  }

  getAvailabilityReason(printer, file) {
    if (!printer) return "Impresora no encontrada";
    if (printer.powerState !== "on") return "Apagada";
    if (printer.state === "finished") return "Pendiente confirmar lista";
    if (!["online", "ready"].includes(printer.state)) return `Estado actual: ${printer.state}`;
    return this.getPhysicalCompatibilityReason(printer, file) === "Compatible"
      ? "Disponible"
      : this.getPhysicalCompatibilityReason(printer, file);
  }

  canSelectManually(printer) {
    if (!printer) return false;
    if (printer.powerState !== "on") return false;
    return ["online", "ready", "finished"].includes(printer.state);
  }

  getEligiblePrinters(file) {
    return printerConfigService.list().filter((printer) => {
      return this.getAvailabilityReason(printer, file) === "Disponible";
    });
  }

  getCompatiblePrinterIds(file) {
    return printerConfigService
      .list()
      .filter((printer) => this.getPhysicalCompatibilityReason(printer, file) === "Compatible")
      .map((printer) => printer.id);
  }

  rankPrinters(printers, file) {
    return [...printers].sort((a, b) => {
      const scoreA = this.getScore(a, file);
      const scoreB = this.getScore(b, file);
      return scoreB - scoreA;
    });
  }

  getScore(printer, file) {
    let score = 0;
    score += printer.state === "online" ? 100 : 0;
    score += Math.max(0, 60 - printer.idleMinutes);
    score += printer.activeMaterial === file.material ? 25 : 0;
    score += Math.max(0, 10 - printer.queueSize) * 3;
    score += Math.round(printer.speedFactor * 20);
    return score;
  }

  selectBestPrinter(file) {
    const ranked = this.rankPrinters(this.getEligiblePrinters(file), file);
    return ranked[0] || null;
  }

  getAssignmentPreview(file) {
    const allPrinters = printerConfigService.list().map((printer) => {
      const reason = this.getAvailabilityReason(printer, file);
      const score = reason === "Disponible" ? this.getScore(printer, file) : null;
      return {
        id: printer.id,
        name: printer.name,
        state: printer.state,
        powerState: printer.powerState,
        activeMaterial: printer.activeMaterial,
        selectableManually: this.canSelectManually(printer),
        reason,
        score,
        recommended: false
      };
    });

    const eligiblePrinters = allPrinters.filter((printer) => printer.reason === "Disponible");
    const rankedEligible = [...eligiblePrinters].sort((a, b) => b.score - a.score);
    if (rankedEligible[0]) rankedEligible[0].recommended = true;

    const merged = allPrinters
      .map((printer) => rankedEligible.find((item) => item.id === printer.id) || printer)
      .sort((a, b) => {
        if (a.recommended) return -1;
        if (b.recommended) return 1;
        if (a.reason === "Disponible" && b.reason !== "Disponible") return -1;
        if (a.reason !== "Disponible" && b.reason === "Disponible") return 1;
        return a.name.localeCompare(b.name);
      });

    return {
      suggestedPrinter: rankedEligible[0] || null,
      printers: merged
    };
  }

  dispatchFile(file, printerId = null, mode = "auto") {
    const preview = this.getAssignmentPreview(file);
    const selectedPrinter = printerId
      ? printerConfigService.getById(printerId)
      : preview.suggestedPrinter
        ? printerConfigService.getById(preview.suggestedPrinter.id)
        : null;

    if (!selectedPrinter) {
      const queued = this.enqueue(file.id, mode, null);
      return { mode: "queued", selectedPrinter: null, queued };
    }

    const reason = this.getAvailabilityReason(selectedPrinter, file);
    if (reason !== "Disponible" && mode === "auto") {
      return {
        mode: "blocked",
        selectedPrinter: null,
        reason: "No hay impresoras disponibles para envio automatico",
        message: "No hay impresoras disponibles para enviar este archivo ahora."
      };
    }

    if (mode === "manual" && !this.canSelectManually(selectedPrinter)) {
      return {
        mode: "blocked",
        selectedPrinter,
        reason: `Estado actual: ${selectedPrinter.state}`,
        message: `${selectedPrinter.name} no se puede seleccionar manualmente en este estado.`
      };
    }

    return {
      mode: mode === "manual" ? "assigned_manual" : "assigned",
      selectedPrinter,
      reason: mode === "manual" && reason !== "Disponible" ? reason : null
    };
  }

  enqueue(fileId, mode = "auto", printerId = null) {
    const item = {
      id: `queue-${Date.now()}`,
      fileId,
      printerId,
      status: printerId ? "assigned" : "waiting",
      priority: queueService.list().length + 1,
      createdAt: new Date().toISOString(),
      estimatedMinutes: 0,
      mode
    };
    return queueService.add(item);
  }

  // Integracion real:
  // 1. Reemplazar score fijo por datos de Moonraker + historico.
  // 2. Usar scheduler de cola persistente.
  // 3. Considerar boquilla instalada, filamento cargado, mantenimientos y SLA.
}

export const printerAssignmentService = new PrinterAssignmentService();
