import "dotenv/config";

export const config = {
  port: Number(process.env.PORT || 3000),
  groqApiKey: process.env.GROQ_API_KEY || "",
  groqModel: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || "",
  googleMapsApiUrl: process.env.GOOGLE_MAPS_API_URL || "https://routes.googleapis.com/directions/v2:computeRoutes"
};