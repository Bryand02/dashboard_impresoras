import cors from "cors";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "./config/env.js";
import { libraryRouter } from "./routes/library.js";
import { notificationsRouter } from "./routes/notifications.js";
import { printHostRouter } from "./routes/printHost.js";
import { printersRouter } from "./routes/printers.js";
import { queueRouter } from "./routes/queue.js";
import { systemRouter } from "./routes/system.js";

export const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, "../../frontend/dist");

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: "30mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", mode: "mock" });
});

app.use(printHostRouter);
app.use("/api/printers", printersRouter);
app.use("/api/library", libraryRouter);
app.use("/api/queue", queueRouter);
app.use("/api/system", systemRouter);
app.use("/api/notifications", notificationsRouter);

app.use(express.static(frontendDistPath));

app.get("*", (_req, res) => {
  res.sendFile(path.join(frontendDistPath, "index.html"));
});
