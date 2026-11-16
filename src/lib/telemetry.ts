/**
 * SIMULATED crowd telemetry for the prototype. In the pilot these numbers would come from
 * gate counters / CCTV analytics / volunteer headcounts. Deterministic in time so all tabs
 * show the same values without writing to storage.
 */
import { at, hmToMin, nowMin, ymd } from "./time";
import type { OpsConfig, Pass } from "./types";

const noise = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

/** Typical weekend footfall profile by hour (relative). */
const PROFILE = [0, 0, 0, 0, 0, 0.3, 0.8, 1, 0.95, 0.85, 0.75, 0.6, 0.2, 0.1, 0.4, 0.55, 0.65, 0.75, 0.9, 1, 0.85, 0.6, 0.35, 0.15];

export interface Zone {
  id: string;
  label: string;
  labelHi: string;
  count: number;
  capacity: number;
}

export function zones(minute = nowMin()): Zone[] {
  const h = Math.floor(minute / 60);
  const f = PROFILE[h] * (0.85 + 0.3 * noise(Math.floor(Date.now() / 20000)));
  return [
    { id: "parking", label: "Parking & Sahayata Kendra", labelHi: "पार्किंग व सहायता केंद्र", count: Math.round(1800 * f), capacity: 3000 },
    { id: "general", label: "General queue (walk-in)", labelHi: "सामान्य कतार", count: Math.round(4200 * f), capacity: 5000 },
    { id: "sugam", label: "Sugam Darshan lane (digital)", labelHi: "सुगम दर्शन लेन", count: Math.round(260 * f + 40 * noise(minute)), capacity: 400 },
    { id: "sanctum", label: "Near sanctum (Nij Mandir)", labelHi: "निज मंदिर के पास", count: Math.round(650 * f), capacity: 800 },
  ];
}

export function generalWaitEstimateMin(minute = nowMin()) {
  const g = zones(minute).find((z) => z.id === "general")!;
  return Math.round(g.count / 28); // ~28 people/min through the general gates (assumed)
}

export function crowdLevel(minute = nowMin()): "low" | "medium" | "high" {
  const f = PROFILE[Math.floor(minute / 60)];
  return f < 0.45 ? "low" : f < 0.8 ? "medium" : "high";
}

const quantile = (xs: number[], q: number) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(q * s.length))];
};

/** Measured digital-lane waits: reporting time → gate scan (BRD 2.1 KPI definition). */
export function digitalWaits(passes: Pass[], cfg: OpsConfig, date = ymd()) {
  const waits = passes
    .filter((p) => p.date === date && p.status === "used" && p.scannedAt && p.channel !== "guest")
    .map((p) => {
      const report = at(p.date, p.batchTime) + ((p.delayMin || 0) - cfg.reportLeadMin) * 60000;
      return Math.max(0, (p.scannedAt! - report) / 60000);
    });
  return { n: waits.length, median: Math.round(quantile(waits, 0.5)), p90: Math.round(quantile(waits, 0.9)) };
}

/** Entries per hour: digital lane (measured from scans) + general (simulated). */
export function hourlyEntries(passes: Pass[], date = ymd()) {
  const out: { hour: number; digital: number; general: number }[] = [];
  const curH = Math.floor(nowMin() / 60);
  for (let h = 5; h <= 22; h++) {
    const digital = passes
      .filter((p) => p.date === date && p.status === "used" && p.scannedAt && new Date(p.scannedAt).getHours() === h)
      .reduce((s, p) => s + p.groupSize, 0);
    const general = h <= curH ? Math.round(1500 * PROFILE[h] * (0.9 + 0.2 * noise(h))) : 0;
    out.push({ hour: h, digital, general });
  }
  return out;
}

export function upcomingBatches(passes: Pass[], cfg: OpsConfig, count = 8) {
  const today = ymd();
  const now = nowMin();
  const map = new Map<string, { time: string; people: number; passes: number; scanned: number }>();
  for (const p of passes) {
    if (p.date !== today || p.channel === "guest" || (p.status !== "active" && p.status !== "used")) continue;
    const eff = hmToMin(p.batchTime) + (p.delayMin || 0);
    if (eff < now - 20) continue;
    const key = p.batchTime;
    const e = map.get(key) ?? { time: key, people: 0, passes: 0, scanned: 0 };
    e.people += p.groupSize;
    e.passes += 1;
    if (p.status === "used") e.scanned += p.groupSize;
    map.set(key, e);
  }
  return [...map.values()].sort((a, b) => hmToMin(a.time) - hmToMin(b.time)).slice(0, count).map((b) => ({ ...b, capacity: cfg.batchSize }));
}
