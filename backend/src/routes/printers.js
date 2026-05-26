import { Router } from "express";
import { homeAssistantService } from "../services/homeAssistantService.js";
import { moonrakerService } from "../services/moonrakerService.js";
import { printerConfigService } from "../services/printerConfigService.js";

export const printersRouter = Router();

printersRouter.get("/", (_req, res) => {
  res.json(printerConfigService.list());
});

printersRouter.post("/", (req, res) => {
  res.status(201).json(printerConfigService.create(req.body));
});

printersRouter.put("/:id", (req, res) => {
  const printer = printerConfigService.update(req.params.id, req.body);
  if (!printer) return res.status(404).json({ message: "Printer not found" });
  return res.json(printer);
});

printersRouter.delete("/:id", (req, res) => {
  const removed = printerConfigService.remove(req.params.id);
  return res.json({ success: removed });
});

printersRouter.post("/:id/power", async (req, res) => {
  const printer = printerConfigService.getById(req.params.id);
  if (!printer) return res.status(404).json({ message: "Printer not found" });
  const action = req.body.action || "on";
  const command = printerConfigService.togglePower(req.params.id, action);
  const haResponse = await homeAssistantService.sendPowerCommand(printer, action);
  return res.json({ printer: command, homeAssistant: haResponse });
});

printersRouter.post("/:id/upload", async (req, res) => {
  const printer = printerConfigService.getById(req.params.id);
  if (!printer) return res.status(404).json({ message: "Printer not found" });
  const response = await moonrakerService.uploadGcode(printer, req.body.file);
  return res.json(response);
});

printersRouter.post("/:id/light", async (req, res) => {
  const printer = printerConfigService.getById(req.params.id);
  if (!printer) return res.status(404).json({ message: "Printer not found" });
  const updated = printerConfigService.toggleLight(req.params.id);
  const action = updated.lightState === "on" ? "turn_on" : "turn_off";
  const haResponse = await homeAssistantService.sendLightCommand(updated, action);
  return res.json({ printer: updated, homeAssistant: haResponse });
});
