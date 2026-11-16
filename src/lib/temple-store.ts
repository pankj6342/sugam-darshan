"use client";
/**
 * Sacred-domain store — represents Mandir Mandal data (passes, ops config, audit, WhatsApp
 * conversation log). Persisted to localStorage under its own key so it is never mixed with
 * the commercial Yatra store (BRD NFR-01 / NFR-02). In the pilot this becomes the
 * Mandal-controlled backend.
 */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DEFAULT_CONFIG } from "./config";
import { assignBatch, effectiveBatch, reportTime } from "./slots";
import { at, fmtTime, hmToMin, nowMin, ymd } from "./time";
import { shortId, signPass } from "./token";
import type {
  AuditEntry,
  Channel,
  GateEvent,
  Lang,
  OpenFlow,
  OpsConfig,
  Pass,
  RitualPause,
  Role,
  WaMessage,
  WaSession,
} from "./types";

export interface CreatePassInput {
  name: string;
  mobile: string;
  groupSize: number;
  date: string;
  windowStart?: string;
  batchTime?: string; // explicit (guest passes)
  channel: Channel;
  lang: Lang;
  issuedBy?: string;
  guest?: Pass["guest"];
}

export type CreatePassResult = { ok: true; pass: Pass } | { ok: false; error: "full" | "duplicate" };

interface TempleState {
  seeded: boolean;
  passes: Pass[];
  config: OpsConfig;
  pause: RitualPause | null;
  openFlow: OpenFlow | null;
  audit: AuditEntry[];
  gateEvents: GateEvent[];
  messages: WaMessage[];
  waSessions: Record<string, WaSession>;
  controlRole: Role;
  telemetryOutage: boolean;

  createPass: (i: CreatePassInput) => Promise<CreatePassResult>;
  reschedulePass: (id: string, date: string, windowStart: string) => Promise<CreatePassResult>;
  cancelPass: (id: string, by?: string) => void;
  markUsed: (id: string, device: string, ts: number) => "ok" | "already";
  addGateEvent: (e: Omit<GateEvent, "id">) => void;
  setConfig: (c: Partial<OpsConfig>, role: Role) => void;
  startPause: (reason: RitualPause["reason"], expectedMin: number, role: Role) => number;
  endPause: (role: Role) => void;
  setOpenFlow: (active: boolean, role: Role, note?: string) => void;
  log: (role: Role, action: string, detail: string) => void;
  pushMessage: (m: Omit<WaMessage, "id" | "at"> & { at?: number }) => void;
  setSession: (phone: string, s: WaSession) => void;
  clearChat: (phone: string) => void;
  sendDueReminders: () => number;
  setRole: (r: Role) => void;
  setTelemetryOutage: (v: boolean) => void;
  _replace: (s: Partial<TempleState>) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

function activeDuplicate(passes: Pass[], mobile: string, date: string, ignoreId?: string) {
  if (!mobile) return undefined;
  return passes.find((p) => p.mobile === mobile && p.date === date && p.status === "active" && p.id !== ignoreId && p.channel !== "guest");
}

export function delayMessageHi(p: Pass, cfg: OpsConfig, reason: RitualPause["reason"]) {
  const what = reason === "bhog" ? "ठाकुरजी के राजभोग का समय है" : reason === "aarti" ? "ठाकुरजी की आरती का समय है" : "मंदिर व्यवस्था हेतु दर्शन कुछ समय के लिए रुके हैं";
  return `🙏 ${what}। कृपया शांतिपूर्वक प्रतीक्षा करें।\n\nपास ${p.id} — आपका नया रिपोर्टिंग समय: *${fmtTime(reportTime(p, cfg), "hi")}*\n(बैच प्रवेश: ${fmtTime(effectiveBatch(p), "hi")})\n\nसमय में फिर बदलाव होने पर हम आपको यहीं सूचित करेंगे।`;
}

export const useTemple = create<TempleState>()(
  persist(
    (set, get) => ({
      seeded: false,
      passes: [],
      config: DEFAULT_CONFIG,
      pause: null,
      openFlow: null,
      audit: [],
      gateEvents: [],
      messages: [],
      waSessions: {},
      controlRole: "ceo",
      telemetryOutage: false,

      async createPass(i) {
        const { passes, config } = get();
        if (i.channel !== "guest" && activeDuplicate(passes, i.mobile, i.date)) return { ok: false, error: "duplicate" };
        const batchTime = i.batchTime ?? (i.windowStart ? assignBatch(i.date, i.windowStart, i.groupSize, passes, config) : null);
        if (!batchTime) return { ok: false, error: "full" };
        const base = {
          id: shortId(i.channel === "guest" ? "MA" : "SD"),
          name: i.name.trim() || (i.lang === "hi" ? "श्रद्धालु" : "Devotee"),
          mobile: i.mobile,
          groupSize: i.groupSize,
          date: i.date,
          batchTime,
          channel: i.channel,
        };
        const token = await signPass(base, i.guest?.expiresAt);
        const pass: Pass = {
          ...base,
          status: "active",
          createdAt: Date.now(),
          token,
          lang: i.lang,
          delayMin: 0,
          issuedBy: i.issuedBy,
          guest: i.guest,
        };
        // Re-check capacity against latest state (another tab may have booked meanwhile).
        const latest = get().passes;
        if (i.channel !== "guest" && !i.batchTime) {
          const again = assignBatch(i.date, i.windowStart!, i.groupSize, latest, get().config);
          if (!again) return { ok: false, error: "full" };
          pass.batchTime = again;
          if (again !== batchTime) pass.token = await signPass(pass);
        }
        set({ passes: [...get().passes, pass] });
        return { ok: true, pass };
      },

      async reschedulePass(id, date, windowStart) {
        const old = get().passes.find((p) => p.id === id);
        if (!old || old.status !== "active") return { ok: false, error: "full" };
        const others = get().passes.filter((p) => p.id !== id);
        if (activeDuplicate(others, old.mobile, date, id)) return { ok: false, error: "duplicate" };
        const batchTime = assignBatch(date, windowStart, old.groupSize, others, get().config);
        if (!batchTime) return { ok: false, error: "full" };
        const base = { id: shortId("SD"), name: old.name, mobile: old.mobile, groupSize: old.groupSize, date, batchTime, channel: old.channel };
        const pass: Pass = {
          ...base,
          token: await signPass(base),
          status: "active",
          createdAt: Date.now(),
          lang: old.lang,
          delayMin: 0,
          rescheduledFrom: old.id,
        };
        // Atomic swap: old pass is retired in the same update so there is never two active passes.
        set({
          passes: [...get().passes.map((p) => (p.id === id ? { ...p, status: "rescheduled" as const, rescheduledTo: pass.id } : p)), pass],
        });
        return { ok: true, pass };
      },

      cancelPass(id) {
        set({ passes: get().passes.map((p) => (p.id === id && p.status === "active" ? { ...p, status: "cancelled" } : p)) });
      },

      markUsed(id, device, ts) {
        const p = get().passes.find((x) => x.id === id);
        if (!p) return "ok";
        if (p.status === "used") return "already";
        set({ passes: get().passes.map((x) => (x.id === id ? { ...x, status: "used", scannedAt: ts, scannedBy: device } : x)) });
        return "ok";
      },

      addGateEvent(e) {
        set({ gateEvents: [{ ...e, id: uid() }, ...get().gateEvents].slice(0, 2000) });
      },

      setConfig(c, role) {
        const before = get().config;
        const changes = Object.entries(c)
          .filter(([k, v]) => before[k as keyof OpsConfig] !== v)
          .map(([k, v]) => `${k}: ${before[k as keyof OpsConfig]} → ${v}`);
        if (!changes.length) return;
        set({ config: { ...before, ...c } });
        get().log(role, "Capacity / cadence changed", changes.join(", "));
      },

      startPause(reason, expectedMin, role) {
        const { passes, config } = get();
        const today = ymd();
        const now = nowMin();
        let notified = 0;
        const updated = passes.map((p) => {
          if (p.status !== "active" || p.date !== today) return p;
          if (hmToMin(effectiveBatch(p)) < now - config.intervalMin) return p; // batch already called — don't shift it
          return { ...p, delayMin: (p.delayMin || 0) + expectedMin };
        });
        set({ passes: updated, pause: { active: true, reason, since: Date.now(), expectedMin, by: role } });
        for (const p of updated) {
          if (p.status === "active" && p.date === today && p.delayMin && p.mobile && passes.find((o) => o.id === p.id)?.delayMin !== p.delayMin) {
            get().pushMessage({ phone: p.mobile, from: "bot", text: delayMessageHi(p, config, reason), kind: "ritual" });
            notified++;
          }
        }
        get().log(role, `Ritual pause started (${reason === "bhog" ? "Bhog" : reason === "aarti" ? "Aarti" : "Other"} Vishram)`, `Expected ${expectedMin} min. ${notified} devotees notified in Hindi; batch calls halted.`);
        return notified;
      },

      endPause(role) {
        const pz = get().pause;
        if (!pz) return;
        const mins = Math.round((Date.now() - pz.since) / 60000);
        set({ pause: null });
        get().log(role, "Ritual pause ended — batch calls resumed", `Paused for ${mins} min (announced ${pz.expectedMin} min).`);
      },

      setOpenFlow(active, role, note = "") {
        set({ openFlow: active ? { active: true, since: Date.now(), by: role, note } : null });
        get().log(role, active ? "OPEN-FLOW MODE ACTIVATED" : "Open-Flow mode ended — QR checks restored", note || (active ? "Physical crowd command takes precedence over scanning." : ""));
      },

      log(role, action, detail) {
        set({ audit: [{ id: uid(), at: Date.now(), role, action, detail }, ...get().audit].slice(0, 500) });
      },

      pushMessage(m) {
        set({ messages: [...get().messages, { ...m, id: uid(), at: m.at ?? Date.now() }].slice(-800) });
      },

      setSession(phone, s) {
        set({ waSessions: { ...get().waSessions, [phone]: s } });
      },

      clearChat(phone) {
        const { [phone]: _drop, ...rest } = get().waSessions;
        void _drop;
        set({ messages: get().messages.filter((m) => m.phone !== phone), waSessions: rest });
      },

      sendDueReminders() {
        const { passes, config } = get();
        const today = ymd();
        const now = Date.now();
        let n = 0;
        const due = passes.filter((p) => {
          if (p.status !== "active" || p.date !== today || p.reminderSent || !p.mobile) return false;
          const report = at(p.date, reportTime(p, config));
          const delta = report - now;
          return delta > 0 && delta <= 30 * 60000; // ~30 minutes before reporting (BRD A-05)
        });
        if (!due.length) return 0;
        const ids = new Set(due.map((p) => p.id));
        set({ passes: get().passes.map((p) => (ids.has(p.id) ? { ...p, reminderSent: true } : p)) });
        for (const p of due) {
          get().pushMessage({
            phone: p.mobile,
            from: "bot",
            kind: "reminder",
            text: `🔔 *दर्शन स्मरण* — जय श्री सांवलिया सेठ!\n\nआपका सुगम दर्शन बैच जल्द आने वाला है।\nपास: ${p.id} · ${p.groupSize} व्यक्ति\nरिपोर्टिंग समय: *${fmtTime(reportTime(p, config), "hi")}*\n\nकृपया अपना QR पास तैयार रखें।`,
            buttons: [{ id: "mypass", label: "मेरा पास देखें" }],
          });
          n++;
        }
        return n;
      },

      setRole(r) {
        set({ controlRole: r });
      },
      setTelemetryOutage(v) {
        set({ telemetryOutage: v });
      },
      _replace(s) {
        set(s);
      },
    }),
    {
      name: "sd-temple-v1",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
