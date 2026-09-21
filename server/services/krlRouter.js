import { KRL_LINES, STATION_ALIASES } from "../data/krl.js";

const MIN_PER_EDGE = 3;
const TRANSIT_BUFFER_MIN = 8;
const KM_PER_EDGE = 2.5;

const normalize = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function buildNetwork() {
  const adjacency = new Map();
  const lineOfEdge = new Map();
  const addEdge = (a, b, line) => {
    if (!adjacency.has(a)) adjacency.set(a, new Set());
    if (!adjacency.has(b)) adjacency.set(b, new Set());
    adjacency.get(a).add(b);
    adjacency.get(b).add(a);
    lineOfEdge.set(`${a}|${b}`, line);
    lineOfEdge.set(`${b}|${a}`, line);
  };

  for (const [line, stations] of Object.entries(KRL_LINES)) {
    for (let i = 0; i < stations.length - 1; i++) {
      addEdge(stations[i], stations[i + 1], line);
    }
  }
  return { adjacency, lineOfEdge };
}

export function matchStation(text) {
  const normalizedText = normalize(text);
  if (!normalizedText) return null;

  const candidates = [];
  for (const [station, aliases] of Object.entries(STATION_ALIASES)) {
    const matches = [station, ...aliases].some((alias) => {
      const normalizedAlias = normalize(alias);
      return normalizedAlias && normalizedText.includes(normalizedAlias);
    });
    if (matches) candidates.push(station);
  }

  if (!candidates.length) return null;
  candidates.sort((a, b) => b.length - a.length);
  return candidates[0];
}

export function findKrlRoute(fromStation, toStation) {
  if (!fromStation || !toStation || fromStation === toStation) return null;

  const { adjacency, lineOfEdge } = buildNetwork();
  if (!adjacency.has(fromStation) || !adjacency.has(toStation)) return null;

  const previous = new Map();
  const queue = [fromStation];
  previous.set(fromStation, null);

  while (queue.length) {
    const current = queue.shift();
    if (current === toStation) break;
    for (const neighbor of adjacency.get(current) || []) {
      if (!previous.has(neighbor)) {
        previous.set(neighbor, current);
        queue.push(neighbor);
      }
    }
  }

  if (!previous.has(toStation)) return null;

  const path = [];
  let cursor = toStation;
  while (cursor !== null) {
    path.unshift(cursor);
    cursor = previous.get(cursor);
  }

  const legs = [];
  for (let i = 1; i < path.length; i++) {
    const line = lineOfEdge.get(`${path[i - 1]}|${path[i]}`);
    const last = legs[legs.length - 1];
    if (last && last.line === line) {
      last.end = path[i];
      last.edges += 1;
    } else {
      legs.push({ line, start: path[i - 1], end: path[i], edges: 1 });
    }
  }

  const pathIndexMap = new Map(path.map((station, index) => [station, index]));
  for (const leg of legs) {
    const start = pathIndexMap.get(leg.start);
    const end = pathIndexMap.get(leg.end);
    leg.stops = path.slice(start, end + 1);
  }

  return { path, legs };
}

const minutesToHuman = (total) => {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours === 0) return `${minutes} menit`;
  return minutes ? `${hours} jam ${minutes} menit` : `${hours} jam`;
};

const estimateFare = (edges) => {
  const km = edges * KM_PER_EDGE;
  let fare = 3000;
  if (km > 25) fare += Math.ceil((km - 25) / 10) * 1000;
  return Math.min(fare, 9000);
};

const parseClock = (text) => {
  const match = String(text || "").match(/(\d{1,2})[:.](\d{2})/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
};

const formatClock = (minutes) => {
  const hours = String(Math.floor((minutes % 1440) / 60)).padStart(2, "0");
  const mins = String(minutes % 60).padStart(2, "0");
  return `${hours}.${mins}`;
};

export function buildKrlSteps({
  fromStation,
  toStation,
  departureTime,
  originText = "",
  destinationText = "",
  feederMode = "Angkutan lokal",
  finalMode = "Angkutan lokal"
}) {
  const route = findKrlRoute(fromStation, toStation);
  if (!route) return null;

  let clock = parseClock(departureTime);
  const steps = [];

  steps.push({
    instruction: `Menuju Stasiun ${route.path[0]}`,
    mode: feederMode,
    time: "",
    duration: "-",
    stops: []
  });

  route.legs.forEach((leg, index) => {
    if (index > 0) {
      const transitInstruction = `Transit di Stasiun ${leg.start}, pindah ke ${leg.line}`;
      steps.push({
        instruction: transitInstruction,
        mode: "Transit",
        time: clock !== null ? `${formatClock(clock)} – ${formatClock(clock + TRANSIT_BUFFER_MIN)}` : "",
        duration: `${TRANSIT_BUFFER_MIN} menit`,
        stops: []
      });
      if (clock !== null) clock += TRANSIT_BUFFER_MIN;
    }

    const duration = leg.edges * MIN_PER_EDGE;
    const instruction = route.legs.length === 1
      ? `Naik KRL dari Stasiun ${leg.start} arah ${leg.end}`
      : `Naik ${leg.line} arah ${leg.end}`;

    steps.push({
      instruction,
      mode: "KRL",
      time: clock !== null ? `${formatClock(clock)} – ${formatClock(clock + duration)}` : "",
      duration: minutesToHuman(duration),
      stops: leg.stops
    });
    if (clock !== null) clock += duration;
  });

  steps.push({
    instruction: destinationText ? `Ke ${destinationText}` : `Menuju ${toStation}`,
    mode: finalMode,
    time: "",
    duration: "-",
    stops: []
  });

  const totalEdges = route.path.length - 1;
  const totalMinutes = totalEdges * MIN_PER_EDGE + (route.legs.length - 1) * TRANSIT_BUFFER_MIN;
  const transferCount = route.legs.length - 1;

  return {
    steps,
    legs: route.legs,
    transfers: `${transferCount} kali`,
    duration: minutesToHuman(totalMinutes),
    cost: `Rp${estimateFare(totalEdges).toLocaleString("id-ID")}`,
    walking: "12 menit",
    badge: transferCount === 0 ? "Langsung tanpa transit" : `Transit ${transferCount} kali`
  };
}