"use client";
import Link from "next/link";
import { Badge, Button, Card } from "@/components/ui";
import { inr } from "@/lib/time";
import { listingById } from "@/lib/yatra-data";
import { useYatra } from "@/lib/yatra-store";

export default function MyBookings() {
  const profile = useYatra((s) => s.profile);
  const all = useYatra((s) => s.vouchers);
  const vouchers = all.filter((v) => profile.mobile && v.mobile === profile.mobile);
  const withdraw = useYatra((s) => s.withdrawConsent);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">My bookings</h1>
      {vouchers.length === 0 && <p className="text-stone-500">No bookings yet.</p>}
      {vouchers.map((v) => {
        const l = listingById(v.listingId)!;
        return (
          <Link key={v.id} href={`/yatra/voucher?id=${v.id}`} className="block">
            <Card className="flex items-center justify-between p-4">
              <div>
                <div className="font-semibold">{l.name}</div>
                <div className="text-sm text-stone-500">
                  {v.id} · {inr(v.estTotal)}
                </div>
              </div>
              <Badge tone={v.status === "confirmed" ? "green" : v.status === "redeemed" ? "blue" : "red"}>{v.status}</Badge>
            </Card>
          </Link>
        );
      })}
      <Button tone="ghost" className="w-full text-sm" onClick={withdraw}>
        Withdraw consent &amp; sign out of Yatra Saathi
      </Button>
    </div>
  );
}
