import Link from "next/link";
import { Emblem, YatraMark } from "@/components/Emblem";
import { ResetDemo } from "./reset-button";

const SACRED = [
  { href: "/darshan", title: "Devotee web app (PWA)", hi: "श्रद्धालु वेब ऐप", body: "Hindi-first booking, free QR pass, reschedule, Aarti timings. Mandal branding only.", req: "A-01 · A-02 · A-06" },
  { href: "/whatsapp", title: "WhatsApp bot", hi: "व्हाट्सऐप बॉट", body: "Book in Hindi with reply buttons, reminders, ritual-delay messages, voice-note fallback.", req: "A-03 · A-05 · C-01" },
  { href: "/kendra", title: "Sahayata Kendra kiosk", hi: "सहायता केंद्र", body: "Volunteer tablet for walk-ins without smartphones. Prints an 80 mm QR slip and times each issue.", req: "B-02" },
  { href: "/gate", title: "Gate scanner", hi: "गेट स्कैनर", body: "Offline-first QR validation from a signed local list, duplicate detection, sync conflicts, override.", req: "B-01 · NFR-05" },
  { href: "/control", title: "Control room", hi: "नियंत्रण कक्ष", body: "Live zones, batch schedule, Bhog/Aarti pause, Open-Flow override, capacity, Atithi passes, audit.", req: "A-04 · B-03…B-06" },
];
const COMMERCIAL = [
  { href: "/yatra", title: "Yatra Saathi marketplace", body: "Separate opt-in after the pass: verified pure-veg stays & eateries, walking time, perks, UPI token advance, vouchers.", req: "C-02…C-06" },
  { href: "/partner", title: "Partner portal", body: "Hotel / bhojanalaya staff redeem vouchers by QR; operator sees commission ledger and leakage.", req: "C-06 · C-07" },
  { href: "/kpi", title: "Pilot KPI report", body: "Wait median/p90, channel share, supply onboarding and conversion against the BRD targets.", req: "BRD §2" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold uppercase tracking-widest text-amber-400">Jai Shri Sanwaliya Seth · Clickable prototype</div>
            <h1 className="mt-2 text-4xl font-extrabold">Sugam Darshan &amp; Yatra Companion</h1>
            <p className="mt-2 max-w-2xl text-slate-400">
              Demo console for the Mandir Mandal presentation. Every screen shares sample data in this browser — open several tabs side by side (e.g. WhatsApp + Control room + Gate) and actions in one appear in the others.
            </p>
          </div>
          <ResetDemo />
        </div>

        <section className="mt-10">
          <div className="mb-3 flex items-center gap-3">
            <Emblem size={30} />
            <h2 className="text-lg font-bold">Sacred domain — free, Mandal-branded, Mandal-controlled</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SACRED.map((c) => (
              <Link key={c.href} href={c.href} className="group rounded-2xl bg-gradient-to-br from-[#7c2d12] to-[#4a1a0b] p-5 ring-1 ring-amber-900/50 transition hover:ring-amber-400">
                <div className="text-xs font-semibold text-amber-300">{c.req}</div>
                <div className="mt-1 text-lg font-bold">{c.title}</div>
                <div className="text-sm text-amber-200/80">{c.hi}</div>
                <p className="mt-2 text-sm text-orange-100/80">{c.body}</p>
                <div className="mt-3 text-sm font-semibold text-amber-300 group-hover:underline">Open →</div>
              </Link>
            ))}
          </div>
        </section>

        <div className="my-8 flex items-center gap-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
          <div className="h-px flex-1 bg-slate-800" />
          Hard boundary · separate data · explicit opt-in only after a free pass exists
          <div className="h-px flex-1 bg-slate-800" />
        </div>

        <section>
          <div className="mb-3 flex items-center gap-3">
            <YatraMark size={30} />
            <h2 className="text-lg font-bold">Commercial domain — operator-run, opt-in hospitality</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {COMMERCIAL.map((c) => (
              <Link key={c.href} href={c.href} className="group rounded-2xl bg-gradient-to-br from-teal-900 to-teal-950 p-5 ring-1 ring-teal-800 transition hover:ring-teal-400">
                <div className="text-xs font-semibold text-teal-300">{c.req}</div>
                <div className="mt-1 text-lg font-bold">{c.title}</div>
                <p className="mt-2 text-sm text-teal-100/80">{c.body}</p>
                <div className="mt-3 text-sm font-semibold text-teal-300 group-hover:underline">Open →</div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-2xl bg-slate-900 p-5 text-sm text-slate-300 ring-1 ring-slate-800">
          <h3 className="font-bold text-white">Suggested 5-minute demo script</h3>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>
              <b>WhatsApp</b>: send “Hi” and book a pass in Hindi → note the separate, optional Yatra message afterwards.
            </li>
            <li>
              <b>Gate</b> (new tab): tap a demo pass → green in &lt;1 s. Tap it again → duplicate. Try the tampered QR.
            </li>
            <li>
              <b>Gate</b>: switch to Offline, book a new pass in the PWA, scan it → “not in offline list” → supervisor path. Go online → sync.
            </li>
            <li>
              <b>Control room</b>: start “Bhog Vishram” → the WhatsApp tab receives a Hindi delay message with a new reporting time. Switch role to Trustee to see permissions change.
            </li>
            <li>
              <b>Control room</b> as Police: activate Open-Flow → gate scanner switches to visual-check mode.
            </li>
            <li>
              <b>Kendra</b>: issue a walk-in pass for a devotee without a phone and print the slip.
            </li>
            <li>
              <b>Yatra → Partner</b>: book a stay with UPI token advance, then redeem the voucher in the partner portal and see commission in the ledger.
            </li>
          </ol>
          <p className="mt-3 text-xs text-slate-500">
            Prototype limits: no backend (data lives in this browser), WhatsApp is simulated, QR signing uses a demo key in the browser, UPI is simulated, listings and names are fictional.
          </p>
        </section>
      </div>
    </div>
  );
}
