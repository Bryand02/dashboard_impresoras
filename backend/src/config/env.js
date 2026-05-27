import "dotenv/config";

export const env = {
  port: Number(process.env.PORT || 8099),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  homeAssistantUrl: process.env.HOME_ASSISTANT_URL || "",
  homeAssistantToken: process.env.HOME_ASSISTANT_TOKEN || "",
  vapidSubject: process.env.VAPID_SUBJECT || "mailto:printerhub@local",
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY || "",
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || ""
};
