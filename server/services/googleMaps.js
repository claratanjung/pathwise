import { config } from "../config.js";

const VEHICLE_TO_MODE = {
  RAIL: "KRL",
  METRO_RAIL: "KRL",
  HEAVY_RAIL: "KRL",
  SUBWAY: "KRL",
  LIGHT_RAIL: "KRL",
  COMMUTER_TRAIN: "KRL",
  LONG_DISTANCE_TRAIN: "KRL",
  TRAM: "MRT",
  BUS: "Bus",
  FERRY: "Kapal"
};

const parseSeconds = (raw) => {
  const num = Number(String(raw || "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(num) && num > 0 ? num : 0;
};

const secondsToHuman = (raw) => {
  const minutes = Math.max(1, Math.round(parseSeconds(raw) / 60));
  if (minutes < 60) return `${minutes} menit`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} jam ${rest} menit` : `${hours} jam`;
};

const formatClock = (date) => {
  const jakarta = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(jakarta.getUTCHours())}.${pad(jakarta.getUTCMinutes())}`;
};

const toRfc3339 = (departureTime) => {
  const match = String(departureTime || "").match(/(\d{1,2})[:.](\d{2})/);
  const now = new Date();
  if (!match) return new Date(now.getTime() + 10 * 60 * 1000).toISOString();
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), Number(match[1]), Number(match[2]));
  return date.toISOString();
};

const stripHtml = (text) => String(text || "")
  .replace(/<[^>]*>/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const modeLabel = (step) => {
  const line = step?.transitDetails?.transitLine;
  const vehicle = String(line?.vehicle?.type || "").toUpperCase();
  const name = String(line?.nameShort || "").toLowerCase();
  if (/commuter|krl|lin |kereta/.test(name)) return "KRL";
  return VEHICLE_TO_MODE[vehicle] || "Transportasi umum";
};

const parseFare = (fare) => {
  if (!fare || !fare.units) return "";
  const units = Number(fare.units) || 0;
  const nanos = Number(fare.nanos) || 0;
  const total = units + nanos / 1e9;
  if (total <= 0) return "";
  return `Rp${Math.round(total).toLocaleString("id-ID")}`;
};

function stepToRouteStep(step, fromClock) {
  const navigation = stripHtml(step?.navigationInstruction?.instructions);
  const transit = step?.transitDetails;
  const durationSec = step?.duration || "";

  if (!transit) {
    return {
      instruction: navigation || "Lanjutkan perjalanan",
      mode: "Jalan kaki",
      time: "",
      duration: secondsToHuman(durationSec),
      stops: [],
      clockDeltaMin: Math.round(parseSeconds(durationSec) / 60)
    };
  }

  const line = transit.transitLine || {};
  const departureStop = transit.stopDetails?.departureStop?.name || "";
  const arrivalStop = transit.stopDetails?.arrivalStop?.name || "";
  const mode = modeLabel({ transitDetails: transit });
  const lineName = line.nameShort || line.name || "";
  const stops = [departureStop, arrivalStop].filter(Boolean);
  const arrivalClock = transit.stopDetails?.arrivalTime
    ? new Date(transit.stopDetails.arrivalTime)
    : new Date(fromClock.getTime() + parseSeconds(durationSec) * 1000);

  const instruction = mode === "KRL"
    ? `Naik KRL ${lineName ? `${lineName} ` : ""}${arrivalStop ? `arah ${arrivalStop}` : ""}`
    : `Naik ${mode} ${lineName ? lineName : ""}${arrivalStop ? ` menuju ${arrivalStop}` : ""}`;

  return {
    instruction,
    mode,
    time: `${formatClock(fromClock)} – ${formatClock(arrivalClock)}`,
    duration: secondsToHuman(durationSec),
    stops,
    clockDeltaMin: Math.round(parseSeconds(durationSec) / 60),
    boardingClock: fromClock,
    arrivalClock
  };
}

export function parseTransitResponse(googleResponse, departureTime) {
  const routes = Array.isArray(googleResponse?.routes) ? googleResponse.routes : [];
  if (!routes.length) return { routes: [] };

  const parsed = routes.map((route) => {
    const legs = route?.legs || [];
    let clock = toRfc3339(departureTime);
    const start = new Date(clock);
    let cursor = new Date(start);

    const steps = [];
    let walkingMinutes = 0;
    const modes = [];
    let transfers = 0;
    let prevMode = "";

    legs.forEach((leg) => {
      (leg?.steps || []).forEach((step) => {
        const parsedStep = stepToRouteStep(step, cursor);
        steps.push({
          instruction: parsedStep.instruction,
          mode: parsedStep.mode,
          time: parsedStep.time,
          duration: parsedStep.duration,
          stops: parsedStep.stops
        });
        cursor = parsedStep.clockDeltaMin
          ? new Date(cursor.getTime() + parsedStep.clockDeltaMin * 60 * 1000)
          : new Date(cursor.getTime());
        if (parsedStep.mode === "Jalan kaki") {
          walkingMinutes += parsedStep.clockDeltaMin || 0;
        } else {
          if (!modes.includes(parsedStep.mode)) modes.push(parsedStep.mode);
          if (prevMode && prevMode !== parsedStep.mode) transfers += 1;
          prevMode = parsedStep.mode;
        }
      });
    });

    const duration = secondsToHuman(route.duration);
    const fare = parseFare(route.fare);

    return {
      steps,
      modes: modes.length ? modes : ["Transportasi umum"],
      duration,
      cost: fare || "-",
      transfers: `${transfers} kali`,
      walking: `${Math.max(1, walkingMinutes)} menit`
    };
  });

  return { routes: parsed };
}

export async function fetchTransitRoutes({ originText, destinationText, departureTime }) {
  if (!config.googleMapsApiKey) {
    const err = new Error("GOOGLE_MAPS_API_KEY belum diatur. Tambahkan di file .env agar rute dihitung Google Maps.");
    err.status = 501;
    throw err;
  }
  if (!originText || !destinationText) return { routes: [] };

  const body = {
    origin: { address: originText },
    destination: { address: destinationText },
    travelMode: "TRANSIT",
    computeAlternativeRoutes: true,
    departureTime: toRfc3339(departureTime),
    languageCode: "id",
    units: "METRIC",
    transitPreferences: {
      routingPreference: "FEWER_TRANSFERS"
    },
    routeModifiers: { avoidFerries: true }
  };

  const fieldMask = [
    "routes.duration",
    "routes.distanceMeters",
    "routes.fare",
    "routes.legs.steps.duration",
    "routes.legs.steps.travelMode",
    "routes.legs.steps.navigationInstruction.instructions",
    "routes.legs.steps.transitDetails.transitLine.name",
    "routes.legs.steps.transitDetails.transitLine.nameShort",
    "routes.legs.steps.transitDetails.transitLine.vehicle.type",
    "routes.legs.steps.transitDetails.stopDetails.departureStop.name",
    "routes.legs.steps.transitDetails.stopDetails.arrivalStop.name",
    "routes.legs.steps.transitDetails.stopDetails.departureTime",
    "routes.legs.steps.transitDetails.stopDetails.arrivalTime"
  ].join(",");

  const response = await fetch(config.googleMapsApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": config.googleMapsApiKey,
      "X-Goog-FieldMask": fieldMask
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    const err = new Error(`Google Maps API error ${response.status}: ${text.slice(0, 200)}`);
    err.status = 502;
    throw err;
  }

  const data = await response.json();
  return parseTransitResponse(data, departureTime);
}