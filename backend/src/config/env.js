import "dotenv/config";

export const env = {
  port: Number(process.env.PORT || 8099),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  homeAssistantUrl: process.env.HOME_ASSISTANT_URL || "",
  homeAssistantToken: process.env.HOME_ASSISTANT_TOKEN || ""
};
