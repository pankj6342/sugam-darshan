import type { Lang } from "./types";

export const pad = (n: number) => String(n).padStart(2, "0");

export function ymd(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseYmd(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function hmToMin(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}

export function minToHm(min: number): string {
  const m = ((min % 1440) + 1440) % 1440;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

export function nowMin(d: Date = new Date()): number {
  return d.getHours() * 60 + d.getMinutes();
}

/** Epoch ms for a given date + HH:MM (local time). */
export function at(date: string, hm: string): number {
  const d = parseYmd(date);
  const mins = hmToMin(hm);
  d.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
  return d.getTime();
}

const locale = (lang: Lang) => (lang === "hi" ? "hi-IN" : lang === "gu" ? "gu-IN" : "en-IN");

export function fmtDate(date: string, lang: Lang, opts?: { short?: boolean }): string {
  return new Intl.DateTimeFormat(locale(lang), {
    weekday: opts?.short ? "short" : "long",
    day: "numeric",
    month: opts?.short ? "short" : "long",
  }).format(parseYmd(date));
}

/** 12-hour time with a Hindi day-part prefix (सुबह / दोपहर / शाम / रात). */
export function fmtTime(hm: string, lang: Lang): string {
  const mins = hmToMin(hm);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const mm = m ? `:${pad(m)}` : "";
  if (lang === "en") return `${h12}${m ? `:${pad(m)}` : ""} ${h < 12 ? "AM" : "PM"}`;
  if (lang === "gu") {
    const gp = h < 4 ? "રાત્રે" : h < 12 ? "સવારે" : h < 16 ? "બપોરે" : h < 19 ? "સાંજે" : "રાત્રે";
    return `${gp} ${h12}${mm} વાગ્યે`;
  }
  const part = h < 4 ? "रात" : h < 12 ? "सुबह" : h < 16 ? "दोपहर" : h < 19 ? "शाम" : "रात";
  return `${part} ${h12}${mm} बजे`;
}

export function fmtClock(ts: number): string {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function fmtAgo(ts: number, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  return `${Math.round(m / 60)} h ago`;
}

export const isWeekend = (date: string) => {
  const d = parseYmd(date).getDay();
  return d === 0 || d === 6;
};

export function addDays(date: string, n: number): string {
  const d = parseYmd(date);
  d.setDate(d.getDate() + n);
  return ymd(d);
}

export const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
