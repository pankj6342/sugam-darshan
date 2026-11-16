/**
 * Signed, time-bound QR tokens (BRD NFR-07).
 *
 * PROTOTYPE NOTE: this uses HMAC-SHA256 with a demo key embedded in the client so the
 * whole demo runs without a server. In the pilot, passes must be signed server-side
 * with an asymmetric key (e.g. Ed25519) so gate scanners only hold the public key.
 */
import type { Pass } from "./types";
import { at, addDays } from "./time";

const DEMO_KEY = "sugam-darshan-demo-signing-key-v1";

export interface TokenPayload {
  v: 1;
  p: string; // pass id
  d: string; // date
  t: string; // batch time
  g: number; // group size
  m: string; // last 4 of mobile ("" if none)
  c: string; // channel initial
  x: number; // expiry epoch ms
}

const enc = new TextEncoder();

function b64url(bytes: Uint8Array | string): string {
  const bin = typeof bytes === "string" ? bytes : String.fromCharCode(...bytes);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function unb64url(s: string): string {
  const pad = s.length % 4 ? "=".repeat(4 - (s.length % 4)) : "";
  return atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
}

let keyPromise: Promise<CryptoKey> | null = null;
function key() {
  keyPromise ??= crypto.subtle.importKey("raw", enc.encode(DEMO_KEY), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
  return keyPromise;
}

async function sig(data: string): Promise<string> {
  const s = new Uint8Array(await crypto.subtle.sign("HMAC", await key(), enc.encode(data)));
  return b64url(s.slice(0, 16)); // truncated to keep QR density low for cheap printers
}

export async function signPass(p: Pick<Pass, "id" | "date" | "batchTime" | "groupSize" | "mobile" | "channel">, expiry?: number) {
  const payload: TokenPayload = {
    v: 1,
    p: p.id,
    d: p.date,
    t: p.batchTime,
    g: p.groupSize,
    m: p.mobile ? p.mobile.slice(-4) : "",
    c: p.channel[0],
    x: expiry ?? at(addDays(p.date, 1), "02:00"),
  };
  const body = b64url(unescape(encodeURIComponent(JSON.stringify(payload))));
  return `SD1.${body}.${await sig(body)}`;
}

export type VerifyResult = { ok: true; payload: TokenPayload; expired: boolean } | { ok: false; reason: "format" | "signature" };

export async function verifyToken(token: string): Promise<VerifyResult> {
  const parts = token.trim().split(".");
  if (parts.length !== 3 || parts[0] !== "SD1") return { ok: false, reason: "format" };
  const [, body, s] = parts;
  if ((await sig(body)) !== s) return { ok: false, reason: "signature" };
  try {
    const payload = JSON.parse(decodeURIComponent(escape(unb64url(body)))) as TokenPayload;
    return { ok: true, payload, expired: Date.now() > payload.x };
  } catch {
    return { ok: false, reason: "format" };
  }
}

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
export function shortId(prefix: string, len = 5): string {
  const r = crypto.getRandomValues(new Uint8Array(len));
  return `${prefix}-${Array.from(r, (b) => ALPHABET[b % ALPHABET.length]).join("")}`;
}
