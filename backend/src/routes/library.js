import { Router } from "express";
import { libraryService } from "../services/libraryService.js";
import { printerAssignmentService } from "../services/printerAssignmentService.js";
import { parseGcodeMetadata } from "../utils/gcodeParser.js";

export const libraryRouter = Router();

const createImportedEntry = ({ filename, content, source = "manual", description, storageInfo = null }) => {
  const metadata = parseGcodeMetadata({ filename, content });
  return libraryService.create({
    ...metadata,
    source,
    description: description || metadata.description,
    compatibility: printerAssignmentService.getCompatiblePrinterIds(metadata),
    storagePath: storageInfo?.storagePath || null
  });
};

libraryRouter.get("/", (_req, res) => {
  res.json(libraryService.list());
});

libraryRouter.get("/:id", (req, res) => {
  const file = libraryService.getById(req.params.id);
  if (!file) return res.status(404).json({ message: "File not found" });
  return res.json(file);
});

libraryRouter.post("/", (req, res) => {
  res.status(201).json(libraryService.create(req.body));
});

libraryRouter.post("/import", (req, res) => {
  const { filename, content } = req.body;
  if (!filename || !content) {
    return res.status(400).json({ message: "filename and content are required" });
  }
  const storageInfo = libraryService.saveSourceFile(filename, content);
  return res.status(201).json(
    createImportedEntry({
      filename,
      content,
      source: "web",
      description: "Importado automaticamente desde carga web.",
      storageInfo
    })
  );
});

libraryRouter.put("/:id", (req, res) => {
  const updated = libraryService.update(req.params.id, req.body);
  if (!updated) return res.status(404).json({ message: "File not found" });
  return res.json(updated);
});

libraryRouter.get("/:id/download", (req, res) => {
  const file = libraryService.getById(req.params.id);
  if (!file) return res.status(404).json({ message: "File not found" });
  const downloadPath = libraryService.getDownloadPath(file);
  if (!downloadPath) return res.status(404).json({ message: "No stored G-code available" });
  return res.download(downloadPath, file.filename || `${file.id}.gcode`);
});

libraryRouter.delete("/:id", (req, res) => {
  return res.json({ success: libraryService.remove(req.params.id) });
});
