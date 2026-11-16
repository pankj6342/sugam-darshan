import { DARSHAN_WINDOWS } from "./config";
import type { OpsConfig, Pass } from "./types";
import { addDays, hmToMin, isWeekend, minToHm, nowMin, ymd } from "./time";

export function bookableDates(cfg: OpsConfig, today = ymd()): string[] {
  const out: string[] = [];
  if (cfg.demoAllowToday || isWeekend(today)) out.push(today);
  for (let i = 1; i <= 14 && out.length < 3; i++) {
    const d = addDays(today, i);
    if (isWeekend(d)) out.push(d);
  }
  return out;
}

export function batchTimesInWindow(windowStart: string, cfg: OpsConfig): string[] {
  const w = DARSHAN_WINDOWS.find((x) => x.start === windowStart);
  if (!w) return [];
  const s = hmToMin(w.start);
  const e = hmToMin(w.end);
  const out: string[] = [];
  for (let t = s; t < e; t += cfg.intervalMin) out.push(minToHm(t));
  return out;
}

export function batchLoad(passes: Pass[], date: string, batchTime: string): number {
  let n = 0;
  for (const p of passes) {
    if (p.date === date && p.batchTime === batchTime && p.channel !== "guest" && (p.status === "active" || p.status === "used"))
      n += p.groupSize;
  }
  return n;
}

/** Earliest batch a devotee can still be assigned to (today: reporting time must still be ahead). */
function minBatchMin(date: string, cfg: OpsConfig): number {
  return date === ymd() ? nowMin() + cfg.reportLeadMin + 2 : -1;
}

export interface WindowAvailability {
  start: string;
  end: string;
  remaining: number;
  capacity: number;
  open: boolean; // not in the past
}

export function windowsFor(date: string, passes: Pass[], cfg: OpsConfig): WindowAvailability[] {
  const floor = minBatchMin(date, cfg);
  return DARSHAN_WINDOWS.map((w) => {
    const batches = batchTimesInWindow(w.start, cfg).filter((b) => hmToMin(b) >= floor);
    const capacity = batches.length * cfg.batchSize;
    const used = batches.reduce((s, b) => s + batchLoad(passes, date, b), 0);
    return { ...w, capacity, remaining: Math.max(0, capacity - used), open: batches.length > 0 };
  });
}

/** Assign the first batch in the window with room for the whole group. */
export function assignBatch(date: string, windowStart: string, groupSize: number, passes: Pass[], cfg: OpsConfig): string | null {
  const floor = minBatchMin(date, cfg);
  for (const b of batchTimesInWindow(windowStart, cfg)) {
    if (hmToMin(b) < floor) continue;
    if (batchLoad(passes, date, b) + groupSize <= cfg.batchSize) return b;
  }
  return null;
}

/** Next window (today or later) that can fit the group — used by the Kendra quick-issue flow. */
export function nextAvailableWindow(date: string, groupSize: number, passes: Pass[], cfg: OpsConfig) {
  return windowsFor(date, passes, cfg).find((w) => w.open && assignBatch(date, w.start, groupSize, passes, cfg));
}

export function reportTime(p: Pick<Pass, "batchTime" | "delayMin">, cfg: OpsConfig): string {
  return minToHm(hmToMin(p.batchTime) + (p.delayMin || 0) - cfg.reportLeadMin);
}

export function effectiveBatch(p: Pick<Pass, "batchTime" | "delayMin">): string {
  return minToHm(hmToMin(p.batchTime) + (p.delayMin || 0));
}
