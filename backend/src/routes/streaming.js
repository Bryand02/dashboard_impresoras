import { Router } from "express";
import { homeAssistantService } from "../services/homeAssistantService.js";

export const streamingRouter = Router();

streamingRouter.post("/api/streaming/preset", async (req, res) => {
  const entityId = String(req.body?.entityId || "").trim();
  const option = String(req.body?.option || "").trim();

  if (!entityId || !option) {
    return res.status(400).json({ message: "entityId y option son requeridos." });
  }

  try {
    const response = await homeAssistantService.selectOption(entityId, option);
    return res.json({ success: true, message: response.message });
  } catch (error) {
    return res.status(502).json({
      success: false,
      message: "No fue posible mover la camara a esa posicion.",
      reason: error.message
    });
  }
});
