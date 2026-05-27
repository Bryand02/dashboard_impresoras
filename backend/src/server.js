import { createServer } from "http";
import { WebSocketServer } from "ws";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { homeAssistantService } from "./services/homeAssistantService.js";
import { libraryService } from "./services/libraryService.js";
import { moonrakerService } from "./services/moonrakerService.js";
import { notificationService } from "./services/notificationService.js";
import { printerConfigService } from "./services/printerConfigService.js";
import { queueService } from "./services/queueService.js";
import { simulationService } from "./services/simulationService.js";

const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

const getPayload = () =>
  JSON.stringify({
    type: "snapshot",
    payload: {
      printers: printerConfigService.list(),
      library: libraryService.list(),
      libraryFolders: libraryService.listFolders(),
      queue: queueService.list(),
      lastUpdatedAt: new Date().toISOString()
    }
  });

wss.on("connection", (socket) => {
  socket.send(getPayload());
});

let isSyncing = false;
let previousPrinterStates = new Map();

const detectPrinterEvents = async () => {
  const printers = printerConfigService.list();
  const nextStates = new Map();
  const notificationJobs = [];

  printers.forEach((printer) => {
    const previous = previousPrinterStates.get(printer.id);
    const current = {
      state: printer.state,
      powerState: printer.powerState,
      progress: printer.telemetry?.progress || 0,
      remainingMinutes: printer.telemetry?.remainingMinutes || 0,
      currentFile: printer.telemetry?.currentFile || ""
    };
    nextStates.set(printer.id, current);

    if (!previous) return;

    if (previous.state !== current.state) {
      notificationJobs.push(
        notificationService.sendPrinterEvent({
          type: "status_changed",
          printerId: printer.id,
          title: `${printer.name} cambio de estado`,
          body: `${previous.state} -> ${current.state}`,
          tag: `status-${printer.id}`,
          data: {
            previousState: previous.state,
            state: current.state,
            progress: current.progress,
            remainingMinutes: current.remainingMinutes
          },
          url: "/"
        })
      );
    }

    if (previous.powerState === "off" && current.powerState === "on") {
      notificationJobs.push(
        notificationService.sendPrinterEvent({
          type: "power_on",
          printerId: printer.id,
          title: `${printer.name} encendida`,
          body: "La impresora fue encendida.",
          tag: `power-${printer.id}`,
          url: "/"
        })
      );
    }

    if (previous.powerState !== "off" && current.powerState === "off") {
      notificationJobs.push(
        notificationService.sendPrinterEvent({
          type: "power-off",
          printerId: printer.id,
          title: `${printer.name} apagada`,
          body: "La impresora fue apagada desde Home Assistant.",
          tag: `power-${printer.id}`,
          url: "/"
        })
      );
    }

    if (previous.state !== "online" && current.state === "online") {
      notificationJobs.push(
        notificationService.sendPrinterEvent({
          type: "printer_online",
          printerId: printer.id,
          title: `${printer.name} online`,
          body: "Moonraker reporta la impresora disponible.",
          tag: `online-${printer.id}`,
          url: "/"
        })
      );
    }

    if (previous.state !== "offline" && current.state === "offline" && current.powerState === "on") {
      notificationJobs.push(
        notificationService.sendPrinterEvent({
          type: "printer_offline",
          printerId: printer.id,
          title: `${printer.name} offline`,
          body: "La impresora quedo sin respuesta pero sigue encendida.",
          tag: `offline-${printer.id}`,
          url: "/"
        })
      );
    }

    if (previous.state !== "printing" && current.state === "printing") {
      const resumed = previous.state === "paused";
      notificationJobs.push(
        notificationService.sendPrinterEvent({
          type: resumed ? "print_resumed" : "print_started",
          printerId: printer.id,
          title: resumed ? `${printer.name} reanudo impresion` : `${printer.name} inicio impresion`,
          body: current.currentFile || "Trabajo en ejecucion.",
          tag: `print-${printer.id}`,
          data: {
            progress: current.progress,
            remainingMinutes: current.remainingMinutes
          },
          url: "/"
        })
      );
    }

    if (previous.state !== "paused" && current.state === "paused") {
      notificationJobs.push(
        notificationService.sendPrinterEvent({
          type: "print_paused",
          printerId: printer.id,
          title: `${printer.name} pausada`,
          body: current.currentFile || "La impresion quedo en pausa.",
          tag: `paused-${printer.id}`,
          data: {
            progress: current.progress,
            remainingMinutes: current.remainingMinutes
          },
          url: "/"
        })
      );
    }

    if (previous.state !== "finished" && current.state === "finished") {
      notificationJobs.push(
        notificationService.sendPrinterEvent({
          type: "print_finished",
          printerId: printer.id,
          title: `${printer.name} termino`,
          body: `${printer.telemetry?.currentFile || "Trabajo finalizado"} listo para retirar.`,
          tag: `finished-${printer.id}`,
          data: {
            progress: current.progress,
            remainingMinutes: current.remainingMinutes
          },
          url: "/"
        })
      );
    }

    if (previous.state !== "ready" && current.state === "ready") {
      notificationJobs.push(
        notificationService.sendPrinterEvent({
          type: "printer_ready",
          printerId: printer.id,
          title: `${printer.name} lista`,
          body: "Lista para la siguiente impresion.",
          tag: `ready-${printer.id}`,
          url: "/"
        })
      );
    }

    if (previous.state !== "error" && current.state === "error") {
      notificationJobs.push(
        notificationService.sendPrinterEvent({
          type: "printer_error",
          printerId: printer.id,
          title: `${printer.name} requiere atencion`,
          body: "La impresora reporto un error.",
          tag: `error-${printer.id}`,
          url: "/"
        })
      );
    }
  });

  previousPrinterStates = nextStates;
  if (notificationJobs.length) {
    await Promise.allSettled(notificationJobs);
  }
};

const syncAndBroadcast = async () => {
  if (isSyncing) return;
  isSyncing = true;
  try {
    simulationService.tick();
    await homeAssistantService.syncPrintersPowerStates();
    await moonrakerService.syncLivePrinters();
    await detectPrinterEvents();
    const payload = getPayload();
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(payload);
      }
    });
  } finally {
    isSyncing = false;
  }
};

setInterval(syncAndBroadcast, 3000);
syncAndBroadcast();

server.listen(env.port, () => {
  console.log(`Printer Hub backend running on http://localhost:${env.port}`);
});
