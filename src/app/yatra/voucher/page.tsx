"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { YatraMark } from "@/components/Emblem";
import { QR } from "@/components/QR";
import { Badge, Button, Note } from "@/components/ui";
import { inr } from "@/lib/time";
import { listingById } from "@/lib/yatra-data";
import { useYatra } from "@/lib/yatra-store";

export default function VoucherPage() {
  const id = useSearchParams().get("id");
  const v = useYatra((s) => s.vouchers.find((x) => x.id === id));
  const cancel = useYatra((s) => s.cancel);
  if (!v) return <Note tone="red">Voucher not found.</Note>;
  const l = listingById(v.listingId)!;
  const stay = l.type === "stay";
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl ring-1 ring-teal-200">
        <div className="flex items-center gap-3 bg-teal-800 px-4 py-3 text-white">
          <YatraMark size={32} />
          <div className="flex-1">
            <div className="font-bold">Yatra Saathi voucher</div>
            <div className="text-xs text-teal-100">Show this QR to the partner</div>
          </div>
          <Badge tone={v.status === "confirmed" ? "green" : v.status === "redeemed" ? "blue" : "red"}>{v.status}</Badge>
        </div>
        <div className="flex flex-col items-center gap-4 p-5 sm:flex-row sm:items-start">
          <QR value={`YV1:${v.id}`} size={170} />
          <dl className="w-full space-y-1 text-sm">
            <div className="font-mono text-xl font-bold">{v.id}</div>
            <div className="font-bold">{l.name}</div>
            <div className="text-stone-600">
              {v.guestName} · {v.people} guests
            </div>
            <div>{stay ? `Check-in ${v.checkIn} · ${v.nights} night(s) · ${v.rooms} room(s)` : `${v.mealDate} at ${v.mealTime}`}</div>
            <div className="mt-2 rounded-lg bg-stone-50 p-2">
              <div className="flex justify-between">
                <span>Estimated total</span>
                <b>{inr(v.estTotal)}</b>
              </div>
              {v.advancePaid > 0 && (
                <>
                  <div className="flex justify-between text-emerald-700">
                    <span>Paid (UPI {v.upiRef})</span>
                    <b>{inr(v.advancePaid)}</b>
                  </div>
                  <div className="flex justify-between">
                    <span>Balance at property</span>
                    <b>{inr(v.estTotal - v.advancePaid)}</b>
                  </div>
                </>
              )}
            </div>
            {l.perks[0] && <div className="text-amber-800">🎁 Includes: {l.perks[0].title}</div>}
          </dl>
        </div>
      </div>
      <Note tone="stone">This voucher is a private booking with {l.name}. It is unrelated to your darshan pass and gives no darshan priority.</Note>
      <div className="flex gap-3">
        <Link href="/yatra" className="flex-1 rounded-xl bg-white px-4 py-2.5 text-center font-semibold text-stone-800 ring-1 ring-stone-300 hover:bg-stone-50">
          Browse more
        </Link>
        {v.status === "confirmed" && (
          <Button tone="secondary" className="flex-1 text-red-700" onClick={() => confirm("Cancel this booking?") && cancel(v.id)}>
            Cancel booking
          </Button>
        )}
      </div>
    </div>
  );
}
