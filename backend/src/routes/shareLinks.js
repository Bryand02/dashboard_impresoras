import { Router } from "express";
import { shareLinkService } from "../services/shareLinkService.js";

export const shareLinksRouter = Router();

const buildPublicShareUrl = (req, token) => `${req.protocol}://${req.get("host")}/share/${token}`;

const normalizeRotation = (value) => {
  const rotation = Number(value) || 0;
  return ((rotation % 360) + 360) % 360;
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const renderUnavailablePage = () => `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Streaming no disponible</title>
  <style>
    :root { color-scheme: dark; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #070a0f;
      color: #e2e8f0;
      font-family: Inter, system-ui, sans-serif;
    }
    .card {
      width: min(92vw, 540px);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 24px;
      padding: 32px 28px;
      background: rgba(15, 20, 28, 0.94);
      box-shadow: 0 24px 80px rgba(0,0,0,0.5);
      text-align: center;
    }
    .eyebrow {
      font-size: 11px;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: #67e8f9;
    }
    h1 { margin: 14px 0 0; font-size: 28px; }
    p { margin: 12px 0 0; color: #94a3b8; font-size: 16px; line-height: 1.6; }
  </style>
</head>
<body>
  <main class="card">
    <div class="eyebrow">Share Link</div>
    <h1>Este enlace ha expirado o ya no esta disponible.</h1>
    <p>Solicita un nuevo enlace temporal desde Gestor 3D.</p>
  </main>
</body>
</html>`;

const renderSharePage = (link) => {
  const rotation = normalizeRotation(link.rotation);
  const quarterTurn = rotation === 90 || rotation === 270;
  const transform = `translate(-50%, -50%) rotate(${rotation}deg) scale(${quarterTurn ? 1.08 : 1})`;

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(link.cameraName)} - Share Link</title>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background: radial-gradient(circle at top, #111827 0%, #050914 65%);
      color: #e2e8f0;
      font-family: Inter, system-ui, sans-serif;
      display: flex;
      flex-direction: column;
    }
    header {
      padding: 18px 22px 12px;
    }
    .eyebrow {
      font-size: 11px;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: #67e8f9;
    }
    h1 {
      margin: 10px 0 0;
      font-size: clamp(22px, 4vw, 34px);
      line-height: 1.1;
    }
    .meta {
      margin-top: 8px;
      color: #94a3b8;
      font-size: 14px;
    }
    .shell {
      flex: 1;
      padding: 0 16px 16px;
    }
    .frame {
      position: relative;
      height: calc(100vh - 110px);
      min-height: 320px;
      overflow: hidden;
      border-radius: 28px;
      border: 1px solid rgba(255,255,255,0.08);
      background: #000;
      box-shadow: 0 24px 80px rgba(0,0,0,0.45);
    }
    .frame-inner {
      position: absolute;
      inset: 0;
      overflow: hidden;
      background: #000;
    }
    iframe {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 100%;
      height: 100%;
      border: 0;
      background: #000;
      transform: ${JSON.stringify(transform)};
      transform-origin: center center;
    }
    @media (max-width: 768px) {
      header { padding: 16px 16px 12px; }
      .shell { padding: 0 10px 10px; }
      .frame { height: calc(100vh - 112px); border-radius: 22px; }
    }
  </style>
</head>
<body>
  <header>
    <div class="eyebrow">Streaming compartido</div>
    <h1>${escapeHtml(link.cameraName)}</h1>
    <div class="meta">${escapeHtml(link.presetLabel || "Vista activa")} - Expira ${escapeHtml(
      new Date(link.expiresAt).toLocaleString("es-CO")
    )}</div>
  </header>
  <main class="shell">
    <div class="frame">
      <div class="frame-inner">
        <iframe
          src="${escapeHtml(link.embedUrl)}"
          title="${escapeHtml(link.cameraName)}"
          allow="autoplay; fullscreen; picture-in-picture"
          referrerpolicy="no-referrer"
          scrolling="no"
        ></iframe>
      </div>
    </div>
  </main>
</body>
</html>`;
};

shareLinksRouter.post("/api/share-links", (req, res) => {
  try {
    const link = shareLinkService.create({
      cameraId: req.body.cameraId,
      cameraName: req.body.cameraName,
      presetLabel: req.body.presetLabel,
      streamUrl: req.body.streamUrl,
      embedUrl: req.body.embedUrl,
      rotation: req.body.rotation,
      durationHours: req.body.durationHours
    });

    return res.status(201).json({
      token: link.token,
      url: buildPublicShareUrl(req, link.token),
      expiresAt: link.expiresAt,
      createdAt: link.createdAt,
      revoked: link.revoked,
      cameraId: link.cameraId
    });
  } catch {
    return res.status(400).json({ message: "No fue posible crear el enlace temporal." });
  }
});

shareLinksRouter.post("/api/share-links/:token/revoke", (req, res) => {
  const revoked = shareLinkService.revoke(req.params.token);
  if (!revoked) {
    return res.status(404).json({ message: "Share link no encontrado." });
  }
  return res.json({
    token: revoked.token,
    revoked: revoked.revoked,
    expiresAt: revoked.expiresAt
  });
});

shareLinksRouter.get("/share/:token", (req, res) => {
  const link = shareLinkService.getByToken(req.params.token);
  if (!shareLinkService.isAvailable(link)) {
    return res.status(410).type("html").send(renderUnavailablePage());
  }
  return res.type("html").send(renderSharePage(link));
});
