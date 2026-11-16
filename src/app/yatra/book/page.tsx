"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Badge, Button, Card, Note } from "@/components/ui";
import { addDays, inr, ymd } from "@/lib/time";
import { listingById } from "@/lib/yatra-data";
import { useYatra } from "@/lib/yatra-store";

export default function BookListing() {
  const sp = useSearchParams();
  const router = useRouter();
  const l = listingById(sp.get("id") ?? "");
  const profile = useYatra((s) => s.profile);
  const consent = useYatra((s) => s.consent);
  const book = useYatra((s) => s.book);
  const [date, setDate] = useState(ymd());
  const [nights, setNights] = useState(1);
  const [rooms, setRooms] = useState(1);
  const [people, setPeople] = useState(2);
  const [time, setTime] = useState("13:00");
  const [name, setName] = useState(profile.name);
  const [mobile, setMobile] = useState(profile.mobile);
  const [paying, setPaying] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!l) return <Note tone="red">Listing not found.</Note>;
  const stay = l.type === "stay";
  const est = stay ? l.priceFrom * rooms * nights : l.priceFrom * people;
  const advance = Math.round((est * l.tokenAdvancePct) / 100);
  const valid = name.trim().length >= 2 && /^[6-9]\d{9}$/.test(mobile);

  function confirm() {
    setBusy(true);
    setTimeout(() => {
      const v = book({
        listingId: l!.id,
        guestName: name.trim(),
        mobile,
        checkIn: stay ? date : undefined,
        nights: stay ? nights : undefined,
        rooms: stay ? rooms : undefined,
        mealDate: stay ? undefined : date,
        mealTime: stay ? undefined : time,
        people,
        estTotal: est,
        advancePaid: advance,
        source: consent?.source ?? "direct",
      });
      useYatra.setState({ profile: { name: name.trim(), mobile } });
      router.push(`/yatra/voucher?id=${v.id}`);
    }, 900);
  }

  const days = [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(ymd(), i));

  return (
    <div className="space-y-4">
      <button onClick={() => router.back()} className="text-sm text-teal-800">
        ← Back
      </button>
      <div>
        <h1 className="text-2xl font-extrabold">{l.name}</h1>
        <div className="text-stone-500">
          {l.nameHi} · {l.area}
        </div>
      </div>
      <Card className="space-y-2 p-4 text-sm">
        <div>
          🚶 <b>{l.walkMin > 0 ? `~${l.walkMin} min walk to temple gate` : "Not walkable"}</b> <span className="text-stone-500">— estimate; basis: {l.walkBasis}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge tone="green">Pure veg ✓</Badge>
          {l.tags.sattvic && <Badge tone="green">Sattvic</Badge>}
          {l.tags.jain && <Badge tone="green">Jain</Badge>}
          {l.tags.noAlcoholVerified ? <Badge tone="green">No alcohol on premises ✓</Badge> : <Badge tone="amber">No-alcohol declaration pending</Badge>}
          {l.tags.family && <Badge>Family-friendly</Badge>}
          {l.tags.parking && <Badge>Parking</Badge>}
        </div>
        <div className="text-xs text-stone-500">
          Verified {l.verifiedOn}: {l.evidence}. &ldquo;No alcohol&rdquo; means no alcohol served, sold or permitted on the premises, per the partner&apos;s signed declaration and our spot checks.
        </div>
      </Card>

      {l.perks.map((p) => (
        <div key={p.title} className="rounded-xl bg-amber-50 p-3 text-sm text-amber-950 ring-1 ring-amber-200">
          <div className="font-bold">
            🎁 {p.title} · {p.titleHi}
          </div>
          <div className="mt-1 text-xs">
            Valid: {p.validity} · Blackout: {p.blackout} · {p.terms}
          </div>
        </div>
      ))}

      {!paying ? (
        <Card className="space-y-3 p-4">
          <div className="font-bold">{stay ? "Book a room" : "Reserve a family table"}</div>
          <label className="block text-sm">
            <span className="font-semibold">{stay ? "Check-in" : "Date"}</span>
            <select value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2">
              {days.map((d) => (
                <option key={d} value={d}>
                  {new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-3 gap-2 text-sm">
            {stay ? (
              <>
                <Num label="Nights" v={nights} set={setNights} max={5} />
                <Num label="Rooms" v={rooms} set={setRooms} max={5} />
              </>
            ) : (
              <label>
                <span className="font-semibold">Time</span>
                <select value={time} onChange={(e) => setTime(e.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 px-2 py-2">
                  {["11:30", "12:30", "13:00", "14:00", "19:00", "19:30", "20:30"].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
            )}
            <Num label="Guests" v={people} set={setPeople} max={stay ? 12 : 15} />
          </div>
          <label className="block text-sm">
            <span className="font-semibold">Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" />
          </label>
          <label className="block text-sm">
            <span className="font-semibold">Mobile (for your voucher)</span>
            <input value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} inputMode="numeric" className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" />
          </label>
          <div className="rounded-lg bg-stone-50 p-3 text-sm">
            <Row k={`Estimated total${stay ? "" : " (pay at restaurant)"}`} v={inr(est)} />
            {advance > 0 && (
              <>
                <Row k={`Token advance via UPI (${l.tokenAdvancePct}%)`} v={inr(advance)} bold />
                <Row k="Balance payable at property" v={inr(est - advance)} />
              </>
            )}
          </div>
          <Note tone="stone">
            Draft terms (to be finalised before launch): free cancellation up to 24 h before check-in with full token refund to the same UPI account; no-shows forfeit the token. Partners agree a {l.commissionPct}% commission with the operator — your price is the same as walking in.
          </Note>
          <Button tone="teal" size="lg" className="w-full" disabled={!valid} onClick={() => (advance > 0 ? setPaying(true) : confirm())}>
            {advance > 0 ? `Continue to pay ${inr(advance)}` : "Reserve table — pay at restaurant"}
          </Button>
        </Card>
      ) : (
        <Card className="space-y-4 p-5 text-center">
          <div className="text-sm text-stone-500">Simulated UPI payment (prototype)</div>
          <div className="text-4xl font-extrabold">{inr(advance)}</div>
          <div className="text-sm">
            to <b>Yatra Saathi (operator escrow)</b> for {l.name}
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {["GPay", "PhonePe", "Paytm"].map((a) => (
              <div key={a} className="rounded-lg py-2 ring-1 ring-stone-200">
                {a}
              </div>
            ))}
          </div>
          <Button tone="teal" size="lg" className="w-full" disabled={busy} onClick={confirm}>
            {busy ? "Processing…" : "Simulate successful UPI payment"}
          </Button>
          <button className="text-sm text-stone-500" onClick={() => setPaying(false)}>
            Cancel
          </button>
        </Card>
      )}
    </div>
  );
}

function Num({ label, v, set, max }: { label: string; v: number; set: (n: number) => void; max: number }) {
  return (
    <label>
      <span className="font-semibold">{label}</span>
      <select value={v} onChange={(e) => set(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-stone-300 px-2 py-2">
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <option key={n}>{n}</option>
        ))}
      </select>
    </label>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-bold" : ""}`}>
      <span>{k}</span>
      <span>{v}</span>
    </div>
  );
}
