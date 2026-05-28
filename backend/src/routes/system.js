import { Router } from "express";
import { libraryService } from "../services/libraryService.js";
import { printerDiscoveryService } from "../services/printerDiscoveryService.js";
import { printerConfigService } from "../services/printerConfigService.js";
import { queueService } from "../services/queueService.js";

export const systemRouter = Router();

systemRouter.get("/bootstrap", (_req, res) => {
  res.json({
    printers: printerConfigService.list(),
    library: libraryService.list(),
    libraryFolders: libraryService.listFolders(),
    queue: queueService.list(),
    discovery: printerDiscoveryService.discover(),
    lastUpdatedAt: new Date().toISOString()
  });
});
