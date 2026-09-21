import { generateRouteInfo } from "./groqClient.js";
import { buildSystemPrompt, buildUserMessage } from "../prompts/routePrompt.js";
import { normalizeRouteResult } from "../utils/parseJson.js";
import { matchStation, buildKrlSteps } from "./krlRouter.js";

const isKrlStep = (step) => String(step?.mode || "").toLowerCase() === "krl";

function enrichRouteWithKrl(route, result, index) {
  const steps = Array.isArray(route.steps) ? route.steps : [];
  const hasKrl = steps.some(isKrlStep);

  if (!hasKrl && index > 0) return route;

  const firstStep = steps[0];
  const lastStep = steps[steps.length - 1];

  const krl = buildKrlSteps({
    fromStation: matchStation(result.origin),
    toStation: matchStation(result.destination),
    departureTime: result.departureTime,
    originText: result.origin,
    destinationText: result.destination,
    feederMode: firstStep && !isKrlStep(firstStep) ? firstStep.mode : "Angkutan lokal",
    finalMode: lastStep && !isKrlStep(lastStep) ? lastStep.mode : "Angkutan lokal"
  });

  if (!krl) return route;

  route.steps = krl.steps;
  route.modes = Array.from(new Set(["KRL", "Jalan"]));
  route.transfers = krl.transfers;
  route.duration = krl.duration;
  route.cost = krl.cost;
  route.walking = krl.walking;
  route.badge = krl.badge;

  return route;
}

function enrichWithKrl(result) {
  if (!result?.routes?.length) return result;

  result.routes = result.routes.map((route, index) => enrichRouteWithKrl(route, result, index));

  return result;
}

export async function analyzeRoute(payload) {
  const messages = [
    { role: "system", content: buildSystemPrompt(payload) },
    { role: "user", content: buildUserMessage(payload) }
  ];

  const raw = await generateRouteInfo({ messages });
  return enrichWithKrl(normalizeRouteResult(raw));
}