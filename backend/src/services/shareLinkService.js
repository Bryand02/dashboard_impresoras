import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storageDir = path.resolve(__dirname, "../../storage/share-links");
const storagePath = path.join(storageDir, "share-links.json");

const ensureStorage = () => {
  fs.mkdirSync(storageDir, { recursive: true });
  if (!fs.existsSync(storagePath)) {
    fs.writeFileSync(storagePath, JSON.stringify({ links: [] }, null, 2), "utf8");
  }
};

const loadState = () => {
  ensureStorage();
  try {
    const parsed = JSON.parse(fs.readFileSync(storagePath, "utf8"));
    return Array.isArray(parsed?.links) ? parsed : { links: [] };
  } catch {
    return { links: [] };
  }
};

const normalizeDuration = (hours) => {
  const supported = new Set([1, 8, 24, 168]);
  const parsed = Number(hours);
  return supported.has(parsed) ? parsed : null;
};

class ShareLinkService {
  constructor() {
    const state = loadState();
    this.links = state.links;
    this.cleanupExpired();
  }

  persist() {
    ensureStorage();
    fs.writeFileSync(storagePath, JSON.stringify({ links: this.links }, null, 2), "utf8");
  }

  create({ cameraId, cameraName, presetLabel, streamUrl, embedUrl, durationHours }) {
    const normalizedDuration = normalizeDuration(durationHours);
    if (!cameraId || !streamUrl || !embedUrl || !normalizedDuration) {
      throw new Error("invalid-payload");
    }

    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + normalizedDuration * 60 * 60 * 1000);
    const token = crypto.randomBytes(24).toString("hex");

    const link = {
      id: token,
      token,
      cameraId,
      cameraName: cameraName || "Streaming",
      presetLabel: presetLabel || "",
      streamUrl,
      embedUrl,
      expiresAt: expiresAt.toISOString(),
      createdAt: createdAt.toISOString(),
      revoked: false
    };

    this.links.unshift(link);
    this.persist();
    return link;
  }

  getByToken(token) {
    return this.links.find((link) => link.token === token) || null;
  }

  isExpired(link) {
    return !link || new Date(link.expiresAt).getTime() <= Date.now();
  }

  isAvailable(link) {
    return Boolean(link) && !link.revoked && !this.isExpired(link);
  }

  revoke(token) {
    const index = this.links.findIndex((link) => link.token === token);
    if (index === -1) return null;
    this.links[index] = { ...this.links[index], revoked: true };
    this.persist();
    return this.links[index];
  }

  cleanupExpired() {
    const before = this.links.length;
    this.links = this.links.filter((link) => !this.isExpired(link));
    if (this.links.length !== before) {
      this.persist();
    }
  }
}

export const shareLinkService = new ShareLinkService();
