import { GoogleGenAI } from '@google/genai';
import { config } from "../config.js";

const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

export async function generateRouteInfo({ systemInstruction, userMessage }) {
  if (!config.geminiApiKey) {
    const err = new Error("GEMINI_API_KEY belum diatur. Tambahkan di file .env agar AI aktif.");
    err.status = 501;
    throw err;
  }

  try {
    const response = await ai.models.generateContent({
      model: config.geminiModel,
      contents: userMessage,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.1, 
        responseMimeType: "application/json"
      }
    });

    // PERUBAHAN DI SINI: Hapus tanda kurung ()
    return response.text;
    
  } catch (error) {
    console.error("[Gemini API Error]:", error.message);
    
    const err = new Error("Maaf, AI perencana rute sedang bermasalah. Silakan coba beberapa saat lagi.");
    err.status = 503;
    throw err;
  }
}