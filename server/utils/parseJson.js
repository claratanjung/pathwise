export function extractJson(text) {
  if (!text) return null;

  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return null;
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

const isFilledString = (value) => typeof value === "string" && value.trim().length > 0;

export function normalizeRouteResult(input) {
  const data = extractJson(input);

  if (!data || typeof data !== "object") {
    const err = new Error("AI mengembalikan format yang tidak valid");
    err.status = 500;
    throw err;
  }

  if (isFilledString(data.clarification)) {
    return { clarification: data.clarification };
  }

  const routes = Array.isArray(data.routes) ? data.routes : [];
  if (routes.length === 0) {
    return {
      clarification: "Mohon beri detail perjalananmu, misal asal, tujuan, dan waktu berangkat."
    };
  }

  return {
    origin: data.origin || "Fleksibel",
    destination: data.destination || "Fleksibel",
    departureTime: data.departureTime || "Fleksibel",
    budget: data.budget || "Belum ditentukan",
    routes: routes.map((route, index) => ({
      title: route.title || `Rute ${index + 1}`,
      badge: route.badge || "",
      modes: Array.isArray(route.modes) ? route.modes : [],
      duration: route.duration || "-",
      cost: route.cost || "-",
      transfers: route.transfers || "-",
      walking: route.walking || "-",
      steps: (Array.isArray(route.steps) ? route.steps : []).map((step) => {
        if (Array.isArray(step)) {
          const [instruction = "", time = "", mode = ""] = step;
          return { instruction, time, mode, duration: "", stops: [] };
        }
        return {
          instruction: step.instruction || "",
          mode: step.mode || "",
          time: step.time || "",
          duration: step.duration || "",
          stops: []
        };
      })
    }))
  };
}