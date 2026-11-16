"use client";
/**
 * Gate scanner device state (BRD B-01, NFR-05).
 *
 * Each browser tab acts as one handheld scanner (state in sessionStorage). The device keeps
 * a signed local snapshot of today's passes; when "offline" it validates against that
 * snapshot only and queues scans for later sync. Revocations made after the snapshot are
 * NOT visible offline — which is why the snapshot age is bounded and shown to the guard.
 */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useTemple } from "./temple-store";
import { effectiveBatch } from "./slots";
import { at, ymd, addDays } from "./time";
import { verifyToken } from "./token";
import type { PassStatus, ScanResultCode } from "./types";

interface SnapPass {
  id: string;
  name: string;
  groupSize: number;
  date: string;
  batchTime: string;
  delayMin: number;
  status: PassStatus;
  channel: string;
  scannedAt?: number;
}

interface Pending {
  passId: string;
  at: number;
}

interface GateState {
  deviceId: string;
  online: boolean;
  snapshot: { at: number; passes: Record<string, SnapPass>; paused: boolean; openFlow: boolean } | null;
  pending: Pending[];
  conflicts: { passId: string; at: number }[];
  lastSync: number | null;

  setOnline: (v: boolean) => { synced: number; conflicts: number } | null;
  sync: () => { synced: number; conflicts: number };
  recordLocalUse: (id: string, ts: number) => void;
}

const newDeviceId = () => `GATE-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

export const useGate = create<GateState>()(
  persist(
    (set, get) => ({
      deviceId: newDeviceId(),
      online: true,
      snapshot: null,
      pending: [],
      conflicts: [],
      lastSync: null,

      setOnline(v) {
        set({ online: v });
        return v ? get().sync() : null;
      },

      sync() {
        const temple = useTemple.getState();
        let conflicts = 0;
        const now = Date.now();
        const newConflicts: { passId: string; at: number }[] = [];
        for (const p of get().pending) {
          const r = temple.markUsed(p.passId, get().deviceId, p.at);
          if (r === "already") {
            const rec = useTemple.getState().passes.find((x) => x.id === p.passId);
            if (rec?.scannedBy !== get().deviceId || rec?.scannedAt !== p.at) {
              conflicts++;
              newConflicts.push(p);
              temple.addGateEvent({ at: now, device: get().deviceId, passId: p.passId, result: "sync-conflict", offline: false });
            }
          }
        }
        const fresh = useTemple.getState();
        const today = ymd();
        const tomorrow = addDays(today, 1);
        const passes: Record<string, SnapPass> = {};
        for (const p of fresh.passes) {
          if (p.date !== today && p.date !== tomorrow) continue;
          passes[p.id] = {
            id: p.id,
            name: p.name,
            groupSize: p.groupSize,
            date: p.date,
            batchTime: p.batchTime,
            delayMin: p.delayMin,
            status: p.status,
            channel: p.channel,
            scannedAt: p.scannedAt,
          };
        }
        const synced = get().pending.length;
        set({
          snapshot: { at: now, passes, paused: !!fresh.pause?.active, openFlow: !!fresh.openFlow?.active },
          pending: [],
          conflicts: [...newConflicts, ...get().conflicts].slice(0, 50),
          lastSync: now,
        });
        return { synced, conflicts };
      },

      recordLocalUse(id, ts) {
        const snap = get().snapshot;
        if (!snap) return;
        const p = snap.passes[id];
        set({
          snapshot: p ? { ...snap, passes: { ...snap.passes, [id]: { ...p, status: "used", scannedAt: ts } } } : snap,
          pending: [...get().pending, { passId: id, at: ts }],
        });
      },
    }),
    { name: "sd-gate-device-v1", storage: createJSONStorage(() => sessionStorage) },
  ),
);

export interface ScanOutcome {
  code: ScanResultCode;
  passId?: string;
  name?: string;
  groupSize?: number;
  batch?: string;
  channel?: string;
  usedAt?: number;
  offline: boolean;
  /** true when the guard can override (early / late / paused / not in cache) */
  overridable: boolean;
  ms: number; // validation time
}

/**
 * Validate a scanned token. Does NOT consume the pass — call `admit()` for that, so the
 * guard sees the result first and overrides are explicit.
 */
export async function validateScan(token: string): Promise<ScanOutcome> {
  const t0 = performance.now();
  const gate = useGate.getState();
  const temple = useTemple.getState();
  const offline = !gate.online;
  const done = (o: Omit<ScanOutcome, "offline" | "ms">): ScanOutcome => ({ ...o, offline, ms: Math.round(performance.now() - t0) });

  const v = await verifyToken(token);
  if (!v.ok) return done({ code: "invalid", overridable: false });
  const { payload } = v;
  if (payload.d !== ymd() || v.expired) return done({ code: "wrong-day", passId: payload.p, batch: payload.t, groupSize: payload.g, overridable: false });

  // Look the pass up — live record when online, signed local snapshot when offline.
  let rec: SnapPass | undefined;
  let paused: boolean;
  if (offline) {
    rec = gate.snapshot?.passes[payload.p];
    paused = !!gate.snapshot?.paused;
  } else {
    const p = temple.passes.find((x) => x.id === payload.p);
    rec = p && { ...p };
    paused = !!temple.pause?.active;
  }
  const info = rec
    ? { passId: rec.id, name: rec.name, groupSize: rec.groupSize, batch: effectiveBatch(rec), channel: rec.channel }
    : { passId: payload.p, groupSize: payload.g, batch: payload.t };

  if (!rec) return done({ code: offline ? "not-in-cache" : "invalid", ...info, overridable: offline });
  if (rec.status === "cancelled" || rec.status === "rescheduled") return done({ code: "cancelled", ...info, overridable: false });
  if (rec.status === "used") return done({ code: "duplicate", ...info, usedAt: rec.scannedAt, overridable: false });
  if (paused) return done({ code: "paused", ...info, overridable: true });

  const cfg = temple.config;
  const batchAt = at(rec.date, effectiveBatch(rec));
  const now = Date.now();
  if (now < batchAt - (cfg.reportLeadMin + 15) * 60000) return done({ code: "early", ...info, overridable: true });
  if (now > batchAt + cfg.lateGraceMin * 60000) return done({ code: "late", ...info, overridable: true });
  return done({ code: "valid", ...info, overridable: false });
}

/** Consume the pass (entry granted). */
export function admit(passId: string, code: ScanResultCode, override = false) {
  const gate = useGate.getState();
  const temple = useTemple.getState();
  const ts = Date.now();
  if (gate.online) temple.markUsed(passId, gate.deviceId, ts);
  else gate.recordLocalUse(passId, ts);
  temple.addGateEvent({ at: ts, device: gate.deviceId, passId, result: override ? code : "valid", offline: !gate.online });
}
