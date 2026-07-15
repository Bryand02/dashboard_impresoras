import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storageDir = path.resolve(__dirname, "../../storage/materials");
const storagePath = path.join(storageDir, "materials.json");

const ensureStorage = () => {
  fs.mkdirSync(storageDir, { recursive: true });
  if (!fs.existsSync(storagePath)) {
    fs.writeFileSync(storagePath, JSON.stringify({ spools: {} }, null, 2), "utf8");
  }
};

const loadState = () => {
  ensureStorage();
  try {
    const parsed = JSON.parse(fs.readFileSync(storagePath, "utf8"));
    return parsed && typeof parsed.spools === "object" ? parsed : { spools: {} };
  } catch {
    return { spools: {} };
  }
};

class MaterialService {
  constructor() {
    const state = loadState();
    this.spools = state.spools;
  }

  persist() {
    ensureStorage();
    fs.writeFileSync(storagePath, JSON.stringify({ spools: this.spools }, null, 2), "utf8");
  }

  getSpool(printerId) {
    return this.spools[printerId] || null;
  }

  setSpool(printerId, { color, material, grams }) {
    const initialGrams = Number(grams) || 0;
    const spool = {
      color: color || "#8fd3ff",
      material: material || "PLA",
      initialGrams,
      remainingGrams: initialGrams,
      updatedAt: new Date().toISOString()
    };
    this.spools[printerId] = spool;
    this.persist();
    return spool;
  }

  deduct(printerId, grams) {
    const spool = this.spools[printerId];
    if (!spool || !grams) return spool || null;
    spool.remainingGrams = Math.max(0, Math.round((spool.remainingGrams - grams) * 100) / 100);
    spool.updatedAt = new Date().toISOString();
    this.persist();
    return spool;
  }
}

export const materialService = new MaterialService();
