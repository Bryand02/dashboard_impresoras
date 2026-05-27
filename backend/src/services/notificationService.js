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
        subject: persisted.subject || env.vapidSubject
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
      subject: this.vapid.subject
    };
  }

  listSubscriptions() {
    return this.subscriptions;
  }

  subscribe({ subscription, deviceLabel = "", platform = "web" }) {
    if (!subscription?.endpoint) {
      throw new Error("Subscription endpoint is required");
    }

    this.subscriptions = this.subscriptions.filter((item) => item.subscription?.endpoint !== subscription.endpoint);
    this.subscriptions.push({
      id: subscription.endpoint,
      deviceLabel,
      platform,
      createdAt: new Date().toISOString(),
      subscription
    });
    this.persistSubscriptions();
    return { success: true };
  }

  unsubscribe(endpoint) {
    const before = this.subscriptions.length;
    this.subscriptions = this.subscriptions.filter((item) => item.subscription?.endpoint !== endpoint);
    this.persistSubscriptions();
    return { success: before !== this.subscriptions.length };
  }

  async sendNotification(payload) {
    if (!this.subscriptions.length) {
      return { sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;
    const staleEndpoints = [];
    const body = JSON.stringify(payload);

    await Promise.all(
      this.subscriptions.map(async (item) => {
        try {
          await webpush.sendNotification(item.subscription, body);
          sent += 1;
        } catch (error) {
          failed += 1;
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

    return { sent, failed };
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
      ...options
    });
  }
}

export const notificationService = new NotificationService();
