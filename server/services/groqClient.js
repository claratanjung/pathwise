import Groq from "groq-sdk";
import { config } from "../config.js";

const groq = new Groq({ apiKey: config.groqApiKey });

export async function generateRouteInfo({ messages }) {
  if (!config.groqApiKey) {
    const err = new Error("GROQ_API_KEY belum diatur. Tambahkan di file .env agar AI aktif.");
    err.status = 501;
    throw err;
  }

  const completion = await groq.chat.completions.create({
    model: config.groqModel,
    messages,
    temperature: 0.4,
    max_completion_tokens: 8192,
    response_format: { type: "json_object" }
  });

  return completion.choices[0]?.message?.content || "";
}