import "dotenv/config";

export const config = {
  port: Number(process.env.PORT || 3000),
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || "",
  googleMapsApiUrl: process.env.GOOGLE_MAPS_API_URL || "https://routes.googleapis.com/directions/v2:computeRoutes"
};