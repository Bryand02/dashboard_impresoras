import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { libraryFiles } from "../data/mockData.js";
import { slugify } from "../utils/formatters.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storageDir = path.resolve(__dirname, "../../storage/library");
const metadataPath = path.join(storageDir, "library.json");

const ensureStorage = () => {
  fs.mkdirSync(storageDir, { recursive: true });
};

const loadPersistedFiles = () => {
  ensureStorage();
  if (!fs.existsSync(metadataPath)) return structuredClone(libraryFiles);
  try {
    return JSON.parse(fs.readFileSync(metadataPath, "utf8"));
  } catch {
    return structuredClone(libraryFiles);
  }
};

class LibraryService {
  constructor() {
    this.files = loadPersistedFiles();
  }

  list() {
    return [...this.files].sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  }

  persist() {
    ensureStorage();
    fs.writeFileSync(metadataPath, JSON.stringify(this.files, null, 2), "utf8");
  }

  ensureUniqueId(baseId) {
    let candidate = baseId;
    let suffix = 2;
    while (this.files.some((file) => file.id === candidate)) {
      candidate = `${baseId}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  saveSourceFile(filename, contentOrBuffer) {
    ensureStorage();
    const ext = path.extname(filename) || ".gcode";
    const base = slugify(path.basename(filename, ext) || `gcode-${Date.now()}`);
    const storedName = `${Date.now()}-${base}${ext}`;
    const absolutePath = path.join(storageDir, storedName);
    fs.writeFileSync(absolutePath, contentOrBuffer);
    return {
      storedName,
      storagePath: path.relative(path.resolve(__dirname, "../.."), absolutePath).replace(/\\/g, "/"),
      absolutePath
    };
  }

  create(payload) {
    const id = this.ensureUniqueId(slugify(payload.name || payload.filename || `file-${Date.now()}`));
    const file = {
      id,
      printCount: 0,
      uploadedAt: new Date().toISOString(),
      thumbnail: payload.thumbnail || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80",
      description: payload.description || "Archivo agregado manualmente.",
      compatibility: payload.compatibility || [],
      dimensions: payload.dimensions || { x: 0, y: 0, z: 0 },
      source: payload.source || "manual",
      ...payload,
      id
    };
    this.files.unshift(file);
    this.persist();
    return file;
  }

  update(id, payload) {
    const index = this.files.findIndex((file) => file.id === id);
    if (index === -1) return null;
    this.files[index] = { ...this.files[index], ...payload };
    this.persist();
    return this.files[index];
  }

  remove(id) {
    const index = this.files.findIndex((file) => file.id === id);
    if (index === -1) return false;
    const [removed] = this.files.splice(index, 1);
    if (removed?.storagePath) {
      const absolutePath = path.resolve(path.resolve(__dirname, "../.."), removed.storagePath);
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    }
    this.persist();
    return true;
  }

  getById(id) {
    return this.files.find((file) => file.id === id) || null;
  }

  getByFilename(filename) {
    return this.files.find((file) => file.filename === filename) || null;
  }

  getDownloadPath(file) {
    if (!file?.storagePath) return null;
    return path.resolve(path.resolve(__dirname, "../.."), file.storagePath);
  }
}

export const libraryService = new LibraryService();
