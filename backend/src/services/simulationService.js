import { printerConfigService } from "./printerConfigService.js";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

class SimulationService {
  tick() {
    printerConfigService.list().forEach((printer) => {
      if (printer.syncMode === "live") return;
      const telemetry = printer.telemetry;

      if (printer.state === "printing") {
        telemetry.progress = clamp(telemetry.progress + Math.random() * 2.4, 0, 100);
        telemetry.nozzle.actual = clamp(telemetry.nozzle.actual + (Math.random() * 4 - 2), 180, telemetry.nozzle.target || 230);
        telemetry.bed.actual = clamp(telemetry.bed.actual + (Math.random() * 2 - 1), 40, telemetry.bed.target || 90);
        telemetry.elapsedMinutes += 1;
        telemetry.remainingMinutes = clamp(telemetry.remainingMinutes - 1, 0, 9999);
        telemetry.velocity = clamp(telemetry.velocity + (Math.random() * 10 - 5), 90, 150);

        if (telemetry.progress >= 100 || telemetry.remainingMinutes === 0) {
          printer.state = "finished";
          telemetry.progress = 100;
          telemetry.currentFile = "Trabajo completado";
          telemetry.remainingMinutes = 0;
          telemetry.velocity = 0;
        }
      }

      if (printer.state === "paused") {
        telemetry.velocity = 0;
        telemetry.nozzle.actual = clamp(telemetry.nozzle.actual + (Math.random() * 2 - 1), 200, telemetry.nozzle.target || 250);
      }

      if (printer.state === "online") {
        printer.idleMinutes += 1;
        telemetry.nozzle.actual = clamp(telemetry.nozzle.actual + (Math.random() * 4 - 2), 24, 40);
        telemetry.bed.actual = clamp(telemetry.bed.actual + (Math.random() * 4 - 2), 24, 35);
      }
    });

    return printerConfigService.list();
  }
}

export const simulationService = new SimulationService();
