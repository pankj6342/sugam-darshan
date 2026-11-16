"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { YatraMark } from "@/components/Emblem";
import { Button, Card } from "@/components/ui";
import { useYatra } from "@/lib/yatra-store";
import type { YatraConsent } from "@/lib/types";

export function YatraShell({ children }: { children: ReactNode }) {
  const consent = useYatra((s) => s.consent);
  const vouchers = useYatra((s) => s.vouchers);
  const mine = useYatra((s) => s.profile.mobile);
  const count = vouchers.filter((v) => v.mobile && v.mobile === mine).length;
  return (
    <div className="mx-auto min-h-screen max-w-3xl bg-white">
      <header className="sticky top-0 z-10 border-b border-teal-100 bg-white/95 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/yatra" className="flex flex-1 items-center gap-3">
            <YatraMark />
            <div className="leading-tight">
              <div className="font-extrabold text-teal-900">यात्रा साथी · Yatra Saathi</div>
              <div className="text-xs text-teal-700">Verified pure-veg stays & meals · Mandaphia</div>
            </div>
          </Link>
          {consent && (
            <Link href="/yatra/bookings" className="rounded-lg px-3 py-1.5 text-sm font-semibold text-teal-800 ring-1 ring-teal-200">
              My bookings{count ? ` (${count})` : ""}
            </Link>
          )}
        </div>
        <div className="bg-teal-50 px-4 py-1.5 text-[11px] text-teal-900">
          Independent commercial service by the technology operator — <b>not</b> run or endorsed by the Mandir Mandal. Bookings here never affect darshan passes, batch priority or entry.
        </div>
      </header>
      <main className="px-4 py-5">{consent ? children : <ConsentGate />}</main>
    </div>
  );
}

/** Separate, explicit opt-in (BRD C-02, NFR-02). Nothing pre-ticked; no temple data imported. */
function ConsentGate() {
  const sp = useSearchParams();
  const src = sp.get("src");
  const source: YatraConsent["source"] = src === "wa" ? "post-pass-whatsapp" : src === "pwa" ? "post-pass-pwa" : "direct";
  const give = useYatra((s) => s.giveConsent);
  const [terms, setTerms] = useState(false);
  const [updates, setUpdates] = useState(false);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-teal-950">स्वागत है 🙏 Welcome to Yatra Saathi</h1>
      <p className="text-stone-700">
        Find verified pure-vegetarian dharamshalas, hotels and bhojanalayas near the temple. This is optional and separate from your free darshan pass.
      </p>
      <Card className="space-y-3 p-4 text-sm">
        <div className="font-bold">What we do — and don&apos;t do — with your data</div>
        <ul className="list-disc space-y-1 pl-5 text-stone-700">
          <li>We have <b>not</b> received your temple booking details. The Mandal&apos;s data stays with the Mandal.</li>
          <li>We only ask for your name and mobile when you make a booking, to send your voucher.</li>
          <li>Partners see only what they need to honour your booking.</li>
          <li>We never sell your data. You can withdraw consent any time.</li>
        </ul>
      </Card>
      <label className="flex items-start gap-3 rounded-xl p-3 ring-1 ring-stone-200">
        <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-0.5 h-5 w-5" />
        <span className="text-sm">
          I agree to Yatra Saathi&apos;s <u>terms</u> and <u>privacy notice</u> (separate from the Mandir Mandal). <span className="text-stone-500">Required to continue.</span>
        </span>
      </label>
      <label className="flex items-start gap-3 rounded-xl p-3 ring-1 ring-stone-200">
        <input type="checkbox" checked={updates} onChange={(e) => setUpdates(e.target.checked)} className="mt-0.5 h-5 w-5" />
        <span className="text-sm">
          Send me booking updates on WhatsApp. <span className="text-stone-500">Optional — no promotional messages.</span>
        </span>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <Button tone="secondary" onClick={() => history.back()}>
          No thanks
        </Button>
        <Button tone="teal" disabled={!terms} onClick={() => give({ sharedName: false, sharedMobile: updates, source, passDate: sp.get("d") ?? undefined }, { name: "", mobile: "" })}>
          Continue
        </Button>
      </div>
    </div>
  );
}
