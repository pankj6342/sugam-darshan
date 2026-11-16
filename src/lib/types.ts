// ───────────────────────── Sacred domain (Mandir Mandal data) ─────────────────────────

export type Lang = "hi" | "en";
export type Channel = "whatsapp" | "pwa" | "kendra" | "guest";
export type PassStatus = "active" | "used" | "cancelled" | "rescheduled";
export type Role = "ceo" | "manager" | "police" | "gate_lead" | "trustee" | "operator";

export interface Pass {
  id: string; // e.g. SD-7K3P9
  name: string;
  mobile: string; // may be "" for Kendra walk-ins without a phone
  groupSize: number;
  date: string; // YYYY-MM-DD
  batchTime: string; // HH:MM — batch entry call time
  channel: Channel;
  status: PassStatus;
  createdAt: number;
  token: string; // signed QR payload
  lang: Lang;
  delayMin: number; // accumulated ritual-pause delay communicated to the devotee
  reminderSent?: boolean;
  scannedAt?: number;
  scannedBy?: string; // gate device id
  rescheduledTo?: string;
  rescheduledFrom?: string;
  issuedBy?: string; // Kendra volunteer / trustee
  guest?: { purpose: string; expiresAt: number };
}

export interface OpsConfig {
  batchSize: number; // devotees per batch in the dedicated lane
  intervalMin: number; // minutes between batch calls
  reportLeadMin: number; // devotee should report this many minutes before batch time
  lateGraceMin: number; // accepted at gate up to this many minutes after batch time (+ delay)
  maxGroupSize: number;
  pilotCapPct: number; // share of lane capacity released digitally (definition pending — BRD 8.3)
  offlineMaxAgeMin: number; // max snapshot age for offline validation (BRD NFR-05)
  pauseDefaultMin: number; // default ritual-pause duration communicated to devotees
  demoAllowToday: boolean; // prototype: treat today as a pilot day so the demo works on any weekday
}

export interface RitualPause {
  active: boolean;
  reason: "bhog" | "aarti" | "other";
  since: number;
  expectedMin: number;
  by: Role;
}

export interface OpenFlow {
  active: boolean;
  since: number;
  by: Role;
  note: string;
}

export interface AuditEntry {
  id: string;
  at: number;
  role: Role;
  action: string;
  detail: string;
}

export interface WaButton {
  id: string;
  label: string;
}

export interface WaMessage {
  id: string;
  phone: string; // conversation key (devotee mobile)
  at: number;
  from: "bot" | "user";
  text: string;
  buttons?: WaButton[];
  passId?: string; // renders the pass card inline
  kind?: "normal" | "reminder" | "ritual" | "optional-invite" | "voice";
}

export interface WaSession {
  step:
    | "menu"
    | "date"
    | "window"
    | "people"
    | "name"
    | "confirm"
    | "reschedule-pick"
    | "reschedule-window";
  draft: { date?: string; windowStart?: string; people?: number; name?: string; passId?: string };
}

export interface GateEvent {
  id: string;
  at: number;
  device: string;
  passId?: string;
  result: ScanResultCode;
  offline: boolean;
}

export type ScanResultCode =
  | "valid"
  | "duplicate"
  | "invalid"
  | "not-in-cache"
  | "wrong-day"
  | "early"
  | "late"
  | "cancelled"
  | "paused"
  | "openflow-bypass"
  | "sync-conflict";

// ───────────────────────── Commercial domain (Yatra Companion) ─────────────────────────

export type ListingType = "stay" | "eatery";

export interface Perk {
  title: string;
  titleHi: string;
  validity: string;
  blackout: string;
  terms: string;
}

export interface Listing {
  id: string;
  type: ListingType;
  name: string;
  nameHi: string;
  area: string;
  walkMin: number; // estimated
  walkBasis: string;
  priceFrom: number; // ₹ per room-night or per thali
  priceUnit: string;
  tags: {
    pureVeg: boolean;
    sattvic: boolean;
    jain: boolean;
    noAlcoholVerified: boolean;
    family: boolean;
    ac: boolean;
    parking: boolean;
  };
  verifiedOn: string; // YYYY-MM-DD
  evidence: string;
  rating: number;
  reviews: number;
  perks: Perk[];
  commissionPct: number;
  tokenAdvancePct: number;
  blurb: string;
}

export interface YatraConsent {
  at: number;
  sharedName: boolean;
  sharedMobile: boolean;
  source: "post-pass-pwa" | "post-pass-whatsapp" | "direct";
  passDate?: string; // aggregate attribution only — no pass id / personal data
}

export type VoucherStatus = "confirmed" | "redeemed" | "cancelled" | "refunded";

export interface Voucher {
  id: string;
  listingId: string;
  guestName: string;
  mobile: string;
  createdAt: number;
  // stay
  checkIn?: string;
  nights?: number;
  rooms?: number;
  // eatery
  mealDate?: string;
  mealTime?: string;
  // common
  people: number;
  estTotal: number;
  advancePaid: number;
  upiRef?: string;
  status: VoucherStatus;
  redeemedAt?: number;
  finalBill?: number;
  txnRef?: string;
  settled?: boolean;
  source: YatraConsent["source"];
}
