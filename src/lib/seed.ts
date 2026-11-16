"use client";
import { DEFAULT_CONFIG, DARSHAN_WINDOWS } from "./config";
import { batchTimesInWindow, reportTime } from "./slots";
import { at, addDays, hmToMin, nowMin, ymd, isWeekend } from "./time";
import { shortId, signPass } from "./token";
import { useTemple } from "./temple-store";
import { useYatra } from "./yatra-store";
import { LISTINGS } from "./yatra-data";
import type { Channel, Pass, Voucher } from "./types";

const NAMES = [
  "रामलाल जाट", "कमला देवी", "सुरेश पटेल", "भगवती बाई", "मोहनलाल मेघवाल", "गीता शर्मा", "हरीश सुथार",
  "प्रकाश गुर्जर", "सरोज कंवर", "दिनेश पाटीदार", "Anita Jain", "Rohit Agarwal", "शंकरलाल धाकड़", "पुष्पा माली",
  "Kiran Shah", "भैरूलाल कुमावत", "नर्मदा बाई", "Vikas Porwal", "लक्ष्मी नारायण", "Meena Bhandari",
];

let s = 42;
const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];
const mobile = () => `9${Math.floor(100000000 + rnd() * 899999999)}`;

function channel(): Channel {
  const r = rnd();
  return r < 0.5 ? "whatsapp" : r < 0.72 ? "kendra" : "pwa";
}

export async function seedDemo() {
  s = 42;
  const cfg = DEFAULT_CONFIG;
  const today = ymd();
  const now = nowMin();
  const passes: Pass[] = [];

  const mk = async (date: string, batchTime: string, ch: Channel, extra: Partial<Pass> = {}) => {
    const base = {
      id: shortId(ch === "guest" ? "MA" : "SD"),
      name: pick(NAMES),
      mobile: ch === "kendra" && rnd() < 0.4 ? "" : mobile(),
      groupSize: 1 + Math.floor(rnd() * 5),
      date,
      batchTime,
      channel: ch,
    };
    const p: Pass = {
      ...base,
      token: await signPass(base),
      status: "active",
      createdAt: at(date, batchTime) - (1 + rnd() * 30) * 3600_000,
      lang: "hi",
      delayMin: 0,
      issuedBy: ch === "kendra" ? "Ramesh ji (Seva Dal)" : undefined,
      ...extra,
    };
    passes.push(p);
    return p;
  };

  // Today's batches within ~3h before / ~4h after now.
  for (const w of DARSHAN_WINDOWS) {
    for (const b of batchTimesInWindow(w.start, cfg)) {
      const m = hmToMin(b);
      if (m < now - 180 || m > now + 240) continue;
      const groups = 3 + Math.floor(rnd() * 6);
      for (let g = 0; g < groups; g++) {
        const p = await mk(today, b, channel());
        if (m < now - 10) {
          const r = rnd();
          if (r < 0.88) {
            // wait from reporting point to gate entry: 8–55 min, long tail
            const wait = 8 + rnd() * 30 + (rnd() < 0.15 ? 25 : 0);
            p.status = "used";
            p.scannedAt = at(today, reportTime(p, cfg)) + wait * 60000;
            p.scannedBy = pick(["GATE-A1", "GATE-B2"]);
            p.reminderSent = true;
          }
          // else: no-show (remains active, will expire)
        }
      }
    }
  }

  // Future weekend bookings.
  for (let i = 1; i <= 8; i++) {
    const d = addDays(today, i);
    if (!isWeekend(d)) continue;
    for (let k = 0; k < 14; k++) {
      const w = pick(DARSHAN_WINDOWS);
      await mk(d, pick(batchTimesInWindow(w.start, cfg)), channel());
    }
  }

  // A couple of Mandal Atithi guest passes.
  for (const g of [{ name: "Shri R. K. Mehta (donor family)", purpose: "Donor family darshan" }, { name: "District Collector office guest", purpose: "Official visit" }]) {
    const p = await mk(today, "17:30", "guest", { name: g.name, issuedBy: "Trustee", guest: { purpose: g.purpose, expiresAt: at(today, "22:00") } });
    p.groupSize = 4;
  }

  const gateEvents = passes
    .filter((p) => p.status === "used")
    .map((p) => ({ id: p.id + "-e", at: p.scannedAt!, device: p.scannedBy!, passId: p.id, result: "valid" as const, offline: false }));
  // a few exception events for realism
  gateEvents.push(
    { id: "x1", at: Date.now() - 52 * 60000, device: "GATE-A1", passId: passes[3]?.id, result: "duplicate" as never, offline: false },
    { id: "x2", at: Date.now() - 38 * 60000, device: "GATE-B2", passId: undefined as never, result: "invalid" as never, offline: false },
    { id: "x3", at: Date.now() - 21 * 60000, device: "GATE-B2", passId: passes[9]?.id, result: "not-in-cache" as never, offline: true },
  );

  useTemple.getState()._replace({
    seeded: true,
    passes,
    config: cfg,
    pause: null,
    openFlow: null,
    gateEvents: gateEvents.sort((a, b) => b.at - a.at),
    audit: [
      { id: "a1", at: Date.now() - 5 * 3600_000, role: "ceo", action: "Pilot lane configured", detail: "Batch 100 every 10 min (600/hour). Pilot cap definition pending Mandal decision (BRD 8.3)." },
      { id: "a2", at: Date.now() - 4.5 * 3600_000, role: "gate_lead", action: "Pre-day readiness confirmed", detail: "2 scanners synced, printer tested, Open-Flow drill done." },
    ],
    messages: [],
    waSessions: {},
    telemetryOutage: false,
  });

  // Commercial domain: a handful of past opt-ins and vouchers (fictional).
  const vouchers: Voucher[] = [];
  const consents = [];
  for (let i = 0; i < 22; i++) {
    const src = rnd() < 0.6 ? "post-pass-whatsapp" : "post-pass-pwa";
    consents.push({ at: Date.now() - rnd() * 6 * 3600_000, sharedName: true, sharedMobile: rnd() < 0.8, source: src as Voucher["source"], passDate: today });
  }
  for (let i = 0; i < 12; i++) {
    const l = pick(LISTINGS);
    const people = 2 + Math.floor(rnd() * 4);
    const est = l.type === "stay" ? l.priceFrom * (1 + Math.floor(rnd() * 2)) : l.priceFrom * people;
    const redeemed = rnd() < 0.6;
    vouchers.push({
      id: shortId("YV", 6),
      listingId: l.id,
      guestName: pick(NAMES),
      mobile: mobile(),
      createdAt: Date.now() - rnd() * 8 * 3600_000,
      checkIn: l.type === "stay" ? today : undefined,
      nights: l.type === "stay" ? 1 : undefined,
      rooms: l.type === "stay" ? 1 : undefined,
      mealDate: l.type === "eatery" ? today : undefined,
      mealTime: l.type === "eatery" ? pick(["12:30", "13:00", "19:30", "20:00"]) : undefined,
      people,
      estTotal: est,
      advancePaid: Math.round((est * l.tokenAdvancePct) / 100),
      upiRef: l.tokenAdvancePct ? `UPI${Math.floor(1e11 + rnd() * 9e11)}` : undefined,
      status: redeemed ? "redeemed" : rnd() < 0.15 ? "cancelled" : "confirmed",
      redeemedAt: redeemed ? Date.now() - rnd() * 3 * 3600_000 : undefined,
      finalBill: redeemed ? Math.round(est * (0.9 + rnd() * 0.4)) : undefined,
      txnRef: redeemed ? `BILL-${Math.floor(1000 + rnd() * 9000)}` : undefined,
      settled: redeemed && rnd() < 0.3,
      source: pick(["post-pass-whatsapp", "post-pass-pwa"]) as Voucher["source"],
    });
  }
  useYatra.getState()._replace({ seeded: true, consent: null, consents, vouchers, profile: { name: "", mobile: "" } });
}

export async function ensureSeeded() {
  if (!useTemple.getState().seeded || !useYatra.getState().seeded) await seedDemo();
}
