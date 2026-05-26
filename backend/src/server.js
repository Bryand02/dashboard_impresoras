import { createServer } from "http";
import { WebSocketServer } from "ws";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { homeAssistantService } from "./services/homeAssistantService.js";
import { libraryService } from "./services/libraryService.js";
import { moonrakerService } from "./services/moonrakerService.js";
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
      queue: queueService.list(),
      lastUpdatedAt: new Date().toISOString()
    }
  });

wss.on("connection", (socket) => {
  socket.send(getPayload());
});

let isSyncing = false;

const syncAndBroadcast = async () => {
  if (isSyncing) return;
  isSyncing = true;
  try {
    simulationService.tick();
    await homeAssistantService.syncPrintersPowerStates();
    await moonrakerService.syncLivePrinters();
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
