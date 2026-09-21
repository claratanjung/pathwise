import { generateRouteInfo } from "./geminiClient.js";
import { buildSystemPrompt, buildUserMessage } from "../prompts/routePrompt.js";
import { normalizeRouteResult } from "../utils/parseJson.js";
import { config } from "../config.js";
import { fetchTransitRoutes } from "./googleMaps.js";

function enrichRouteWithGoogleMaps(route, gmapsRoute) {
  if (!gmapsRoute?.steps?.length) return route;

  route.steps = gmapsRoute.steps;
  route.modes = gmapsRoute.modes;
  route.transfers = gmapsRoute.transfers;
  route.duration = gmapsRoute.duration;
  route.cost = gmapsRoute.cost;
  route.walking = gmapsRoute.walking;
  route.badge = "Dihitung oleh Google Maps";

  return route;
}

async function enrichWithGoogleMaps(result) {
  if (!config.googleMapsApiKey || !result?.routes?.length) return result;

  let gmaps;
  try {
    gmaps = await fetchTransitRoutes({
      originText: result.origin,
      destinationText: result.destination,
      departureTime: result.departureTime
    });
  } catch (err) {
    console.warn(`[googleMaps] ${err.message}`);
    return result;
  }

  if (!gmaps?.routes?.length) return result;

  result.routes = result.routes.map((route, index) =>
    enrichRouteWithGoogleMaps(route, gmaps.routes[index % gmaps.routes.length])
  );

  return result;
}

export async function analyzeRoute(payload) {
  // Pisahkan prompt untuk Gemini (System Instruction terpisah dengan User Message)
  const systemInstruction = buildSystemPrompt(payload);
  const userMessage = buildUserMessage(payload);

  const raw = await generateRouteInfo({ systemInstruction, userMessage });
  let result = normalizeRouteResult(raw);

  if (result.clarification) return result;

  result = await enrichWithGoogleMaps(result);

  return result;
}