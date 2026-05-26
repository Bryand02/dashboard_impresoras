import { Router } from "express";
import { libraryService } from "../services/libraryService.js";
import { printerAssignmentService } from "../services/printerAssignmentService.js";
import { queueService } from "../services/queueService.js";

export const queueRouter = Router();

queueRouter.get("/", (_req, res) => {
  res.json(queueService.list());
});

queueRouter.post("/", (req, res) => {
  const item = queueService.add(req.body);
  res.status(201).json(item);
});

queueRouter.put("/:id", (req, res) => {
  const updated = queueService.update(req.params.id, req.body);
  if (!updated) return res.status(404).json({ message: "Queue item not found" });
  return res.json(updated);
});

queueRouter.delete("/:id", (req, res) => {
  return res.json({ success: queueService.remove(req.params.id) });
});

queueRouter.post("/auto-assign/:fileId", (req, res) => {
  const file = libraryService.getById(req.params.fileId);
  if (!file) return res.status(404).json({ message: "File not found" });
  const preview = printerAssignmentService.getAssignmentPreview(file);
  const selectedPrinter = preview.suggestedPrinter
    ? { id: preview.suggestedPrinter.id, name: preview.suggestedPrinter.name }
    : null;
  if (!selectedPrinter) {
    const queued = printerAssignmentService.enqueue(file.id, "auto", null);
    return res.json({ mode: "queued", selectedPrinter: null, queued, preview });
  }
  return res.json({ mode: "assigned", selectedPrinter, preview });
});

queueRouter.get("/assignment-preview/:fileId", (req, res) => {
  const file = libraryService.getById(req.params.fileId);
  if (!file) return res.status(404).json({ message: "File not found" });
  return res.json(printerAssignmentService.getAssignmentPreview(file));
});

queueRouter.post("/dispatch/:fileId", (req, res) => {
  const file = libraryService.getById(req.params.fileId);
  if (!file) return res.status(404).json({ message: "File not found" });
  const mode = req.body.mode || "auto";
  const printerId = req.body.printerId || null;
  return res.json(printerAssignmentService.dispatchFile(file, printerId, mode));
});
