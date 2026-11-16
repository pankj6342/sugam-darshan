# Sugam Darshan & Yatra Companion — clickable prototype

Clickable prototype for the Shri Sanwaliya Seth Mandir Mandal pitch (BRD v1.0, Phase 1–2
deliverable: "clickable Hindi WhatsApp and PWA prototypes and printed sample QR passes").

```bash
npm install
npm run dev   # http://localhost:3000 — demo console with links to every screen
```

There is **no backend**. All state is sample data kept in this browser's storage and synced
across tabs, so open several screens side by side (e.g. WhatsApp + Control room + Gate).
Use **↺ Reset demo data** on the home page to start fresh.

## Screens

| Route | Persona | BRD |
| --- | --- | --- |
| `/darshan` | Devotee PWA — Hindi-first, free QR pass, reschedule, Aarti timings | A-01, A-02, A-06 |
| `/whatsapp` | Simulated Hindi WhatsApp bot — booking, reminders, ritual-delay messages, voice-note fallback | A-03, A-05, C-01 |
| `/kendra` | Sahayata Kendra volunteer tablet — walk-in pass + 80 mm printable slip, issue timer | B-02 |
| `/gate` | Offline-first gate scanner — signed local list, duplicate / tamper / cache-miss handling, sync conflicts (each tab = one device) | B-01, NFR-05 |
| `/control` | Control room — zones, batches, Bhog/Aarti pause, Open-Flow, capacity, Atithi guest passes, audit log, role permissions | A-04, B-03…B-06 |
| `/yatra` | Yatra Saathi marketplace — separate opt-in, filters, walking time, perks, simulated UPI advance, vouchers | C-02…C-06 |
| `/partner` | Partner portal — voucher redemption, bookings, commission ledger, leakage flags | C-06, C-07 |
| `/kpi` | Pilot KPI report vs BRD §2 targets | §2 |

## How the BRD guardrails show up

- **Two separate data domains** — `src/lib/temple-store.ts` (Mandal) and `src/lib/yatra-store.ts`
  (operator) are separate persisted stores; the marketplace never reads temple data. Only an
  aggregate "came from post-pass invitation" source flag crosses, for KPI attribution.
- **Invitation only after a pass exists**, visually separated, explicit tap, nothing pre-ticked.
- **Signed, time-bound QR tokens** — `src/lib/token.ts`.
- **Offline gate** validates against a bounded-age local snapshot; revocations after the snapshot
  are not visible offline (shown to the guard) — `src/lib/gate.ts`.

## Prototype limits (must change for the pilot)

- QR signing uses an HMAC demo key in the browser. Pilot: sign server-side with an asymmetric key
  so scanners hold only a public key.
- WhatsApp, OTP and UPI are simulated. Crowd telemetry is simulated.
- Darshan windows, Aarti timings, batch size/interval and the "20% cap" are illustrative and need
  Mandal sign-off (BRD 8.3). Listings and names are fictional.
- English + Hindi only; Gujarati is an optional later addition (NFR-03).
