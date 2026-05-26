import multer from "multer";
import { Router } from "express";
import { libraryService } from "../services/libraryService.js";
import { printerAssignmentService } from "../services/printerAssignmentService.js";
import { parseGcodeMetadata } from "../utils/gcodeParser.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024 * 100
  }
});

const createImportedEntry = ({ filename, content, source = "orcaslicer", description, storageInfo = null }) => {
  const metadata = parseGcodeMetadata({ filename, content });
  return libraryService.create({
    ...metadata,
    source,
    description: description || metadata.description,
    compatibility: printerAssignmentService.getCompatiblePrinterIds(metadata),
    storagePath: storageInfo?.storagePath || null
  });
};

const handleVirtualUpload = (sourceLabel) => (req, res) => {
  const uploadedFile = req.file;
  if (!uploadedFile) {
    return res.status(400).json({ error: "No se encontro un archivo G-code en la solicitud." });
  }

  const filename = uploadedFile.originalname || "upload.gcode";
  const content = uploadedFile.buffer.toString("utf8");
  const storageInfo = libraryService.saveSourceFile(filename, uploadedFile.buffer);
  const created = createImportedEntry({
    filename,
    content,
    source: sourceLabel,
    description: "Importado automaticamente desde OrcaSlicer al gestor central.",
    storageInfo
  });

  return res.status(201).json({
    done: true,
    message: "Archivo recibido por Printer Hub y guardado en la biblioteca unificada.",
    file: {
      id: created.id,
      name: created.name,
      filename: created.filename,
      material: created.material,
      estimatedMinutes: created.estimatedMinutes,
      compatibility: created.compatibility,
      downloadUrl: `/api/library/${created.id}/download`
    },
    files: {
      local: {
        name: created.filename,
        path: created.filename,
        origin: "local",
        refs: {
          resource: `/api/library/${created.id}`,
          download: `/api/library/${created.id}/download`
        }
      }
    },
    result: {
      id: created.id,
      path: created.filename,
      queuedForLibrary: true,
      autoPrint: false
    }
  });
};

export const printHostRouter = Router();

printHostRouter.get("/api/version", (_req, res) => {
  res.json({
    api: "0.1",
    server: "Printer Hub",
    text: "Printer Hub virtual print host",
    version: "0.2.0"
  });
});

printHostRouter.get("/server/info", (_req, res) => {
  res.json({
    result: {
      klippy_connected: true,
      klippy_state: "ready",
      components: ["virtual_print_host", "library"],
      failed_components: [],
      warnings: [],
      websocket_count: 0,
      moonraker_version: "printer-hub-virtual-host",
      api_version: [1, 0, 0],
      api_version_string: "1.0.0"
    }
  });
});

printHostRouter.post("/api/files/local", upload.single("file"), handleVirtualUpload("orcaslicer"));
printHostRouter.post("/server/files/upload", upload.single("file"), handleVirtualUpload("orcaslicer"));
