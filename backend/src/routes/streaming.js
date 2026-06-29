import { Router } from "express";
import { homeAssistantService } from "../services/homeAssistantService.js";

export const streamingRouter = Router();

streamingRouter.get("/api/streaming/presets", async (req, res) => {
  const entityId = String(req.query?.entityId || "").trim();
  const entityIds = []
    .concat(entityId)
    .concat(req.query?.entityIds || [])
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  if (!entityId) {
    return res.status(400).json({ message: "entityId es requerido." });
  }

  try {
    const options = await homeAssistantService.getSelectOptions(entityIds);
    return res.json({
      success: true,
      entityId,
      entityIds,
      options
    });
  } catch (error) {
    return res.status(502).json({
      success: false,
      message: "No fue posible leer los presets desde Home Assistant.",
      reason: error.message
    });
  }
});

streamingRouter.post("/api/streaming/preset", async (req, res) => {
  const entityId = String(req.body?.entityId || "").trim();
  const entityIds = []
    .concat(entityId)
    .concat(req.body?.entityIds || [])
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  const option = String(req.body?.option || "").trim();

  if (!entityId || !option) {
    return res.status(400).json({ message: "entityId y option son requeridos." });
  }

  try {
    const response = await homeAssistantService.selectOption(entityIds, option);
    return res.json({ success: true, message: response.message });
  } catch (error) {
    return res.status(502).json({
      success: false,
      message: "No fue posible mover la camara a esa posicion.",
      reason: error.message
    });
  }
});
