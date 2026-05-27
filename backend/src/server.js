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
      remainingMinutes: printer.telemetry?.remainingMinutes || 0
    };
    nextStates.set(printer.id, current);

    if (!previous) return;

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

    if (previous.state !== "finished" && current.state === "finished") {
      notificationJobs.push(
        notificationService.sendPrinterEvent({
          type: "finished",
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
          type: "ready",
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
          type: "error",
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
