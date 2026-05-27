import fs from "fs";
import path from "path";
import webpush from "web-push";
import { fileURLToPath } from "url";
import { env } from "../config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storageDir = path.resolve(__dirname, "../../storage/notifications");
const vapidPath = path.join(storageDir, "vapid.json");
const subscriptionsPath = path.join(storageDir, "subscriptions.json");

export const notificationOptions = [
  { key: "print_started", label: "Inicio de impresion" },
  { key: "print_paused", label: "Pausa de impresion" },
  { key: "print_resumed", label: "Reanudacion de impresion" },
  { key: "print_finished", label: "Impresion terminada" },
  { key: "printer_ready", label: "Impresora lista" },
  { key: "printer_error", label: "Errores de impresora" },
  { key: "power_on", label: "Encendido de impresora" },
  { key: "power_off", label: "Apagado de impresora" },
  { key: "printer_online", label: "Impresora online" },
  { key: "printer_offline", label: "Impresora offline" },
  { key: "status_changed", label: "Cualquier cambio de estado" }
];

const defaultPreferences = Object.fromEntries(notificationOptions.map((item) => [item.key, true]));

const ensureStorage = () => {
  fs.mkdirSync(storageDir, { recursive: true });
};

const loadJson = (targetPath, fallback) => {
  ensureStorage();
  if (!fs.existsSync(targetPath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(targetPath, "utf8"));
  } catch {
    return fallback;
  }
};

class NotificationService {
  constructor() {
    this.vapid = this.loadOrCreateVapidKeys();
    this.subscriptions = loadJson(subscriptionsPath, []);
    this.lastReport = null;
    this.configureWebPush();
  }

  loadOrCreateVapidKeys() {
    ensureStorage();
    if (env.vapidPublicKey && env.vapidPrivateKey) {
      return {
        publicKey: env.vapidPublicKey,
        privateKey: env.vapidPrivateKey,
        subject: env.vapidSubject
      };
    }

    const persisted = loadJson(vapidPath, null);
    if (persisted?.publicKey && persisted?.privateKey) {
      return {
        publicKey: persisted.publicKey,
        privateKey: persisted.privateKey,
        subject: env.vapidSubject || persisted.subject
      };
    }

    const generated = webpush.generateVAPIDKeys();
    const vapid = {
      publicKey: generated.publicKey,
      privateKey: generated.privateKey,
      subject: env.vapidSubject
    };
    fs.writeFileSync(vapidPath, JSON.stringify(vapid, null, 2), "utf8");
    return vapid;
  }

  configureWebPush() {
    webpush.setVapidDetails(this.vapid.subject, this.vapid.publicKey, this.vapid.privateKey);
  }

  persistSubscriptions() {
    ensureStorage();
    fs.writeFileSync(subscriptionsPath, JSON.stringify(this.subscriptions, null, 2), "utf8");
  }

  getPublicConfig() {
    return {
      publicKey: this.vapid.publicKey,
      subject: this.vapid.subject,
      options: notificationOptions,
      defaults: defaultPreferences
    };
  }

  listSubscriptions() {
    return this.subscriptions;
  }

  getStatus() {
    return {
      subject: this.vapid.subject,
      publicKey: this.vapid.publicKey,
      subscriptions: this.subscriptions.map((item) => ({
        id: item.id,
        deviceLabel: item.deviceLabel,
        createdAt: item.createdAt,
        preferences: item.preferences || defaultPreferences
      })),
      lastReport: this.lastReport
    };
  }

  subscribe({ subscription, deviceLabel = "", platform = "web", preferences = {} }) {
    if (!subscription?.endpoint) {
      throw new Error("Subscription endpoint is required");
    }

    this.subscriptions = this.subscriptions.filter((item) => item.subscription?.endpoint !== subscription.endpoint);
    this.subscriptions.push({
      id: subscription.endpoint,
      deviceLabel,
      platform,
      createdAt: new Date().toISOString(),
      preferences: { ...defaultPreferences, ...preferences },
      subscription
    });
    this.persistSubscriptions();
    return { success: true };
  }

  updatePreferences(endpoint, preferences = {}) {
    const index = this.subscriptions.findIndex((item) => item.subscription?.endpoint === endpoint);
    if (index === -1) {
      return { success: false, message: "Suscripcion no encontrada." };
    }
    this.subscriptions[index] = {
      ...this.subscriptions[index],
      preferences: {
        ...defaultPreferences,
        ...(this.subscriptions[index].preferences || {}),
        ...preferences
      }
    };
    this.persistSubscriptions();
    return { success: true, preferences: this.subscriptions[index].preferences };
  }

  unsubscribe(endpoint) {
    const before = this.subscriptions.length;
    this.subscriptions = this.subscriptions.filter((item) => item.subscription?.endpoint !== endpoint);
    this.persistSubscriptions();
    return { success: before !== this.subscriptions.length };
  }

  async sendNotification(payload) {
    if (!this.subscriptions.length) {
      this.lastReport = {
        at: new Date().toISOString(),
        sent: 0,
        failed: 0,
        errors: ["No hay dispositivos suscritos."]
      };
      return this.lastReport;
    }

    let sent = 0;
    let failed = 0;
    const staleEndpoints = [];
    const errors = [];
    const body = JSON.stringify(payload);
    const notificationType = payload.data?.type || payload.type || "generic";

    await Promise.all(
      this.subscriptions.map(async (item) => {
        const preferences = { ...defaultPreferences, ...(item.preferences || {}) };
        if (notificationType !== "test" && preferences[notificationType] === false) {
          return;
        }
        try {
          await webpush.sendNotification(item.subscription, body);
          sent += 1;
        } catch (error) {
          failed += 1;
          errors.push(`${item.deviceLabel || "device"}: ${error.statusCode || "error"} ${error.message}`);
          console.error("[notifications] push failed", {
            endpoint: item.subscription?.endpoint,
            statusCode: error.statusCode,
            message: error.message
          });
          if (error.statusCode === 404 || error.statusCode === 410) {
            staleEndpoints.push(item.subscription?.endpoint);
          }
        }
      })
    );

    if (staleEndpoints.length) {
      this.subscriptions = this.subscriptions.filter(
        (item) => !staleEndpoints.includes(item.subscription?.endpoint)
      );
      this.persistSubscriptions();
    }

    this.lastReport = {
      at: new Date().toISOString(),
      sent,
      failed,
      errors
    };
    return this.lastReport;
  }

  async sendPrinterEvent(event) {
    const title = event.title || "Printer Hub";
    const options = {
      body: event.body || "",
      tag: event.tag || event.printerId || "printer-hub-event",
      data: {
        url: event.url || "/",
        printerId: event.printerId || null,
        type: event.type || "generic",
        ...event.data
      },
      renotify: true,
      badge: "/icon-192.svg",
      icon: "/icon-192.svg"
    };

    return this.sendNotification({
      title,
      type: event.type || "generic",
      ...options
    });
  }
}

export const notificationService = new NotificationService();
