import { Router } from "express";
import { libraryService } from "../services/libraryService.js";
import { parseGcodeMetadata } from "../utils/gcodeParser.js";

export const libraryRouter = Router();

libraryRouter.get("/", (_req, res) => {
  res.json(libraryService.list());
});

libraryRouter.post("/", (req, res) => {
  res.status(201).json(libraryService.create(req.body));
});

libraryRouter.post("/import", (req, res) => {
  const { filename, content } = req.body;
  if (!filename || !content) {
    return res.status(400).json({ message: "filename and content are required" });
  }
  const metadata = parseGcodeMetadata({ filename, content });
  return res.status(201).json(libraryService.create(metadata));
});

libraryRouter.put("/:id", (req, res) => {
  const updated = libraryService.update(req.params.id, req.body);
  if (!updated) return res.status(404).json({ message: "File not found" });
  return res.json(updated);
});

libraryRouter.delete("/:id", (req, res) => {
  return res.json({ success: libraryService.remove(req.params.id) });
});
