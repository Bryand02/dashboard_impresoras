import multer from "multer";
import { Router } from "express";
import fs from "fs";
import path from "path";
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

const buildMoonrakerFileItem = (file, root = "gcodes") => {
  const downloadPath = libraryService.getDownloadPath(file);
  const size = downloadPath && fs.existsSync(downloadPath) ? fs.statSync(downloadPath).size : 0;
  const compatibilityNames = file.compatibility?.join(",") || "";
  return {
    path: file.filename,
    root,
    modified: file.uploadedAt,
    size,
    permissions: "rw",
    thumbnails: [],
    slicer: file.profile || "OrcaSlicer",
    material: file.material || "",
    filament_total: file.weightGrams || 0,
    estimated_time: (file.estimatedMinutes || 0) * 60,
    print_start_time: null,
    job_id: null,
    dimensions: file.dimensions || { x: 0, y: 0, z: 0 },
    source: file.source || "orcaslicer",
    compatibility: compatibilityNames
  };
};

const metadataFromFile = (file) => ({
  size: file.weightGrams || 0,
  modified: file.uploadedAt,
  uuid: file.id,
  slicer: file.profile || "OrcaSlicer",
  object_height: file.dimensions?.z || 0,
  estimated_time: (file.estimatedMinutes || 0) * 60,
  filament_total: file.weightGrams || 0,
  thumbnails: [],
  print_start_time: null,
  job_id: null
});

const getFileFromQuery = (req) => {
  const filename = req.query.filename || req.query.path;
  if (!filename) return null;
  return libraryService.getByFilename(path.basename(String(filename)));
};

const getUploadedFile = (req) => {
  if (req.file) return req.file;
  if (Array.isArray(req.files) && req.files.length > 0) return req.files[0];
  return null;
};

const handleVirtualUpload = (sourceLabel) => (req, res) => {
  const uploadedFile = getUploadedFile(req);
  if (!uploadedFile) {
    const fileFieldNames = Array.isArray(req.files) ? req.files.map((file) => file.fieldname).join(",") : "none";
    console.warn(
      `[print-host] upload failed: request without file field bodyKeys=${Object.keys(req.body || {}).join(",")} fileFields=${fileFieldNames}`
    );
    return res.status(400).json({ error: "No se encontro un archivo G-code en la solicitud." });
  }

  const filename = uploadedFile.originalname || "upload.gcode";
  const content = uploadedFile.buffer.toString("utf8");
  const root = req.body.root || "gcodes";
  const requestedPrint = String(req.body.print || "").toLowerCase() === "true";
  console.log(
    `[print-host] upload received file="${filename}" field=${uploadedFile.fieldname} size=${uploadedFile.size} root=${root} print=${requestedPrint}`
  );

  const storageInfo = libraryService.saveSourceFile(filename, uploadedFile.buffer);
  const created = createImportedEntry({
    filename,
    content,
    source: sourceLabel,
    description: "Importado automaticamente desde OrcaSlicer al gestor central.",
    storageInfo
  });

  return res.status(200).json({
    result: {
      item: buildMoonrakerFileItem(created, root),
      action: "create_file",
      print_started: requestedPrint,
      print_queued: requestedPrint
    },
    file: {
      id: created.id,
      name: created.name,
      filename: created.filename,
      material: created.material,
      estimatedMinutes: created.estimatedMinutes,
      compatibility: created.compatibility,
      downloadUrl: `/api/library/${created.id}/download`
    },
    message: requestedPrint
      ? "Archivo recibido por Printer Hub y agregado a la biblioteca para despacho posterior."
      : "Archivo recibido por Printer Hub y guardado en la biblioteca unificada."
  });
};

export const printHostRouter = Router();

printHostRouter.use((req, _res, next) => {
  console.log(
    `[print-host] ${req.method} ${req.originalUrl} from=${req.ip || "unknown"} ua="${req.get("user-agent") || "unknown"}"`
  );
  next();
});

printHostRouter.get("/api/version", (_req, res) => {
  res.json({
    api: "0.1",
    server: "OctoPrint",
    text: "OctoPrint 1.10.3",
    version: "1.10.3",
    capabilities: {
      "upload-by-put": false
    }
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

printHostRouter.get("/server/files/list", (_req, res) => {
  res.json({
    result: libraryService.list().map((file) => buildMoonrakerFileItem(file))
  });
});

printHostRouter.get("/server/files/metadata", (req, res) => {
  const file = getFileFromQuery(req);
  if (!file) {
    return res.status(404).json({ error: { message: "Metadata not found", code: 404 } });
  }
  return res.json({
    result: metadataFromFile(file)
  });
});

printHostRouter.get("/server/files/thumbnails", (req, res) => {
  const file = getFileFromQuery(req);
  if (!file) {
    return res.status(404).json({ error: { message: "Thumbnail not found", code: 404 } });
  }
  return res.json({
    result: {
      thumbnails: file.thumbnail?.startsWith("data:image")
        ? [{ relative_path: "inline-thumbnail.png", width: 0, height: 0, size: 0 }]
        : []
    }
  });
});

printHostRouter.post("/printer/print/start", (_req, res) => {
  res.json({
    result: {
      accepted: true,
      queuedForLibrary: true
    }
  });
});

printHostRouter.post("/api/files/local", upload.any(), handleVirtualUpload("orcaslicer"));
printHostRouter.post("/server/files/upload", upload.any(), handleVirtualUpload("orcaslicer"));
