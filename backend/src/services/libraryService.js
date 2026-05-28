import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { libraryFiles } from "../data/mockData.js";
import { slugify } from "../utils/formatters.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storageDir = path.resolve(__dirname, "../../storage/library");
const metadataPath = path.join(storageDir, "library.json");
const projectRoot = path.resolve(__dirname, "../../..");
const foldersBaseDir = path.join(projectRoot, "base_datos_Archivos");

const ensureStorage = () => {
  fs.mkdirSync(storageDir, { recursive: true });
  fs.mkdirSync(foldersBaseDir, { recursive: true });
};

const defaultFolders = ["General", "Inbox", "Orca Imports"];

const normalizeFolderPath = (value) =>
  String(value || "")
    .replace(/\\/g, "/")
    .replace(/\.\./g, "")
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join("/");

const getFolderAbsolutePath = (folder = "") => {
  const normalized = normalizeFolderPath(folder);
  return normalized ? path.join(foldersBaseDir, normalized) : foldersBaseDir;
};

const collectFoldersFromDisk = (dir = foldersBaseDir, prefix = "") => {
  if (!fs.existsSync(dir)) return [];
  const entries = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory());

  const folders = [];
  entries.forEach((entry) => {
    const currentPath = prefix ? `${prefix}/${entry.name}` : entry.name;
    folders.push(currentPath);
    folders.push(...collectFoldersFromDisk(path.join(dir, entry.name), currentPath));
  });
  return folders;
};

const loadPersistedState = () => {
  ensureStorage();
  if (!fs.existsSync(metadataPath)) {
    return {
      files: structuredClone(libraryFiles).map((file) => ({ folder: "General", ...file })),
      folders: [...defaultFolders]
    };
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
    const diskFolders = collectFoldersFromDisk();
    const persistedFolders = Array.isArray(parsed.folders) ? parsed.folders : [];
    const fileFolders = Array.isArray(parsed.files)
      ? parsed.files.map((file) => normalizeFolderPath(file.folder || "General")).filter(Boolean)
      : [];
    const mergedFolders = Array.from(new Set([...persistedFolders, ...diskFolders, ...fileFolders]));
    if (Array.isArray(parsed)) {
      return {
        files: parsed.map((file) => ({ folder: "General", ...file })),
        folders: mergedFolders.length ? mergedFolders : [...defaultFolders]
      };
    }
    return {
      files: Array.isArray(parsed.files) ? parsed.files.map((file) => ({ folder: "General", ...file })) : [],
      folders: mergedFolders.length ? mergedFolders : [...defaultFolders]
    };
  } catch {
    return {
      files: structuredClone(libraryFiles).map((file) => ({ folder: "General", ...file })),
      folders: [...defaultFolders]
    };
  }
};

class LibraryService {
  constructor() {
    const state = loadPersistedState();
    this.files = state.files;
    this.folders = state.folders;
    this.folders.forEach((folder) => {
      fs.mkdirSync(getFolderAbsolutePath(folder), { recursive: true });
    });
  }

  list() {
    return [...this.files].sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  }

  listFolders() {
    return [...this.folders].sort((a, b) => a.localeCompare(b));
  }

  persist() {
    ensureStorage();
    fs.writeFileSync(
      metadataPath,
      JSON.stringify({ folders: this.folders, files: this.files }, null, 2),
      "utf8"
    );
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

  saveSourceFile(filename, contentOrBuffer, folder = "General") {
    ensureStorage();
    const ext = path.extname(filename) || ".gcode";
    const base = slugify(path.basename(filename, ext) || `gcode-${Date.now()}`);
    const storedName = `${Date.now()}-${base}${ext}`;
    const normalizedFolder = this.ensureFolder(folder) || "General";
    const folderPath = getFolderAbsolutePath(normalizedFolder);
    fs.mkdirSync(folderPath, { recursive: true });
    const absolutePath = path.join(folderPath, storedName);
    fs.writeFileSync(absolutePath, contentOrBuffer);
    return {
      storedName,
      storagePath: path.relative(projectRoot, absolutePath).replace(/\\/g, "/"),
      absolutePath
    };
  }

  create(payload) {
    const id = this.ensureUniqueId(slugify(payload.name || payload.filename || `file-${Date.now()}`));
    const folder = normalizeFolderPath(payload.folder || "General") || "General";
    this.ensureFolder(folder);
    const file = {
      id,
      printCount: 0,
      uploadedAt: new Date().toISOString(),
      thumbnail: payload.thumbnail || "",
      description: payload.description || "Archivo agregado manualmente.",
      compatibility: payload.compatibility || [],
      dimensions: payload.dimensions || { x: 0, y: 0, z: 0 },
      source: payload.source || "manual",
      folder,
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
    const currentFile = this.files[index];
    if (payload.folder) {
      const targetFolder = this.ensureFolder(payload.folder);
      if (targetFolder && currentFile.storagePath) {
        const currentPath = this.getDownloadPath(currentFile);
        if (currentPath && fs.existsSync(currentPath)) {
          const destinationDir = getFolderAbsolutePath(targetFolder);
          fs.mkdirSync(destinationDir, { recursive: true });
          const destinationPath = path.join(destinationDir, path.basename(currentPath));
          if (currentPath !== destinationPath) {
            fs.renameSync(currentPath, destinationPath);
            payload.storagePath = path.relative(projectRoot, destinationPath).replace(/\\/g, "/");
          }
        }
      }
      payload.folder = targetFolder;
    }
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
    return path.resolve(projectRoot, file.storagePath);
  }

  ensureFolder(name) {
    const folder = normalizeFolderPath(name);
    if (!folder) return null;
    if (!this.folders.includes(folder)) {
      this.folders.push(folder);
    }
    fs.mkdirSync(getFolderAbsolutePath(folder), { recursive: true });
    this.persist();
    return folder;
  }

  deleteFolder(name) {
    const folder = normalizeFolderPath(name);
    if (!folder) {
      return { success: false, reason: "protected" };
    }

    const hasFiles = this.files.some((file) => {
      const fileFolder = normalizeFolderPath(file.folder || "General");
      return fileFolder === folder || fileFolder.startsWith(`${folder}/`);
    });
    if (hasFiles) {
      return { success: false, reason: "has-files" };
    }

    const hasChildren = this.folders.some((current) => current !== folder && current.startsWith(`${folder}/`));
    if (hasChildren) {
      return { success: false, reason: "has-children" };
    }

    const folderPath = getFolderAbsolutePath(folder);
    if (fs.existsSync(folderPath)) {
      const entries = fs.readdirSync(folderPath);
      if (entries.length > 0) {
        return { success: false, reason: "has-files" };
      }
      fs.rmdirSync(folderPath);
    }

    this.folders = this.folders.filter((current) => current !== folder);
    this.persist();
    return { success: true };
  }
}

export const libraryService = new LibraryService();
