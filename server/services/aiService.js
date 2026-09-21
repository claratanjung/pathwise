import { generateRouteInfo } from "./groqClient.js";
import { buildSystemPrompt, buildUserMessage } from "../prompts/routePrompt.js";
import { normalizeRouteResult } from "../utils/parseJson.js";

export async function analyzeRoute(payload) {
  const messages = [
    { role: "system", content: buildSystemPrompt(payload) },
    { role: "user", content: buildUserMessage(payload) }
  ];

  const raw = await generateRouteInfo({ messages });
  return normalizeRouteResult(raw);
}