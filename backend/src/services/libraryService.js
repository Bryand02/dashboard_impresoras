import { libraryFiles } from "../data/mockData.js";
import { slugify } from "../utils/formatters.js";

class LibraryService {
  constructor() {
    this.files = structuredClone(libraryFiles);
  }

  list() {
    return [...this.files].sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  }

  create(payload) {
    const id = slugify(payload.name || payload.filename || `file-${Date.now()}`);
    const file = {
      id,
      printCount: 0,
      uploadedAt: new Date().toISOString(),
      thumbnail: payload.thumbnail || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80",
      description: payload.description || "Archivo agregado manualmente.",
      compatibility: payload.compatibility || [],
      dimensions: payload.dimensions || { x: 0, y: 0, z: 0 },
      ...payload,
      id
    };
    this.files.unshift(file);
    return file;
  }

  update(id, payload) {
    const index = this.files.findIndex((file) => file.id === id);
    if (index === -1) return null;
    this.files[index] = { ...this.files[index], ...payload };
    return this.files[index];
  }

  remove(id) {
    const index = this.files.findIndex((file) => file.id === id);
    if (index === -1) return false;
    this.files.splice(index, 1);
    return true;
  }

  getById(id) {
    return this.files.find((file) => file.id === id) || null;
  }
}

export const libraryService = new LibraryService();
