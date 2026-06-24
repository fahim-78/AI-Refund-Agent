import "dotenv/config";

export const config = {
  port: Number(process.env.PORT) || 8787,
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  openRouterApiKey: process.env.OPENROUTER_API_KEY || "",
  openRouterBaseUrl: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
  openRouterModel: process.env.MODEL_NAME || "deepseek/deepseek-chat",
};

if (!config.openRouterApiKey) {
  console.warn(
    "[config] OPENROUTER_API_KEY is not set. Copy server/.env.example to server/.env and add your key before using the chat agent."
  );
}
