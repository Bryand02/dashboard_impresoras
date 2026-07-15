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
import { shareLinksRouter } from "./routes/shareLinks.js";
import { streamingRouter } from "./routes/streaming.js";
import { systemRouter } from "./routes/system.js";
import { currentRole } from "./services/roleService.js";
import { printerConfigService } from "./services/printerConfigService.js";

export const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, "../../frontend/dist");

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: "30mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", mode: "mock" });
});

// ==== ROLES (compartidos con menu.platia.com.co) ====
app.get("/api/whoami", (req, res) => {
  res.json({ role: currentRole(req) });
});

app.get("/api/public/printers", (_req, res) => {
  const printers = printerConfigService.list().map((printer) => ({
    id: printer.id,
    name: printer.name,
    state: printer.state,
    progress: printer.telemetry?.progress ?? 0,
    remainingMinutes: printer.telemetry?.remainingMinutes ?? 0,
    spool: printer.spool
      ? {
          color: printer.spool.color,
          material: printer.spool.material,
          remainingGrams: printer.spool.remainingGrams,
          initialGrams: printer.spool.initialGrams
        }
      : null
  }));
  res.json({ printers });
});

const PUBLIC_PATHS = ["/api/whoami", "/api/public/"];
const PROTECTED_PREFIXES = ["/api/", "/server/", "/printer/"];

app.use((req, res, next) => {
  const isPublic = PUBLIC_PATHS.some((p) => req.path === p || req.path.startsWith(p));
  const isProtected = PROTECTED_PREFIXES.some((p) => req.path.startsWith(p));
  if (isProtected && !isPublic && currentRole(req) !== "superuser") {
    return res.status(403).json({ message: "Acceso restringido. Solo el superusuario puede hacer esto." });
  }
  next();
});
// ==== END ROLES ====

app.use(printHostRouter);
app.use("/api/printers", printersRouter);
app.use("/api/library", libraryRouter);
app.use("/api/queue", queueRouter);
app.use("/api/system", systemRouter);
app.use("/api/notifications", notificationsRouter);
app.use(shareLinksRouter);
app.use(streamingRouter);

app.use(express.static(frontendDistPath, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith("index.html")) {
      res.setHeader("Cache-Control", "no-cache, must-revalidate");
    }
  }
}));

app.get("*", (_req, res) => {
  res.setHeader("Cache-Control", "no-cache, must-revalidate");
  res.sendFile(path.join(frontendDistPath, "index.html"));
});
