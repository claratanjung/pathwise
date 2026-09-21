import "dotenv/config";

export const config = {
  port: Number(process.env.PORT || 3000),
  groqApiKey: process.env.GROQ_API_KEY || "",
  groqModel: process.env.GROQ_MODEL || "openai/gpt-oss-120b"
};