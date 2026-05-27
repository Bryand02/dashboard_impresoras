import { Router } from "express";
import { notificationService } from "../services/notificationService.js";

export const notificationsRouter = Router();

notificationsRouter.get("/config", (_req, res) => {
  res.json(notificationService.getPublicConfig());
});

notificationsRouter.post("/subscribe", (req, res) => {
  try {
    const result = notificationService.subscribe(req.body);
    return res.status(201).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

notificationsRouter.post("/unsubscribe", (req, res) => {
  const endpoint = req.body?.endpoint;
  if (!endpoint) {
    return res.status(400).json({ message: "endpoint is required" });
  }
  return res.json(notificationService.unsubscribe(endpoint));
});

notificationsRouter.post("/test", async (req, res) => {
  const title = req.body?.title || "Printer Hub";
  const body = req.body?.body || "Prueba de notificacion enviada correctamente.";
  const result = await notificationService.sendNotification({
    title,
    body,
    tag: "printer-hub-test",
    data: {
      url: "/",
      type: "test"
    },
    badge: "/icon-192.svg",
    icon: "/icon-192.svg"
  });
  return res.json(result);
});
