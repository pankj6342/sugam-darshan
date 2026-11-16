"use client";
import { Card, Note } from "@/components/ui";
import { useTemple } from "@/lib/temple-store";
import { digitalWaits } from "@/lib/telemetry";
import { fmtDate, ymd } from "@/lib/time";
import { LISTINGS, TARGETS, listingById } from "@/lib/yatra-data";
import { useYatra } from "@/lib/yatra-store";

function Kpi({ title, value, target, met, note }: { title: string; value: string; target: string; met: boolean | null; note: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-semibold text-stone-500">{title}</div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${met === null ? "bg-stone-100 text-stone-600" : met ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}>
          {met === null ? "pending" : met ? "on track" : "below target"}
        </span>
      </div>
      <div className="mt-2 text-3xl font-extrabold tabular-nums">{value}</div>
      <div className="text-sm text-stone-600">Target: {target}</div>
      <div className="mt-2 text-xs text-stone-500">{note}</div>
    </Card>
  );
}

export function KpiReport() {
  const passes = useTemple((s) => s.passes);
  const cfg = useTemple((s) => s.config);
  const audit = useTemple((s) => s.audit);
  const vouchers = useYatra((s) => s.vouchers);
  const today = ymd();

  const completed = passes.filter((p) => p.channel !== "guest" && p.status !== "cancelled" && p.status !== "rescheduled");
  const assisted = completed.filter((p) => p.channel === "whatsapp" || p.channel === "kendra").length;
  const share = completed.length ? Math.round((assisted / completed.length) * 100) : 0;
  const ch = (c: string) => completed.filter((p) => p.channel === c).length;

  const w = digitalWaits(passes, cfg, today);

  const verified = (t: "stay" | "eatery") => LISTINGS.filter((l) => l.type === t && l.verifiedOn).length;

  // Conversion: completed (redeemed) bookings attributed to the post-pass invitation / eligible pass holders.
  const eligible = completed.filter((p) => p.date === today).length;
  const attributed = vouchers.filter((v) => v.status === "redeemed" && v.source !== "direct");
  const stays = attributed.filter((v) => listingById(v.listingId)?.type === "stay").length;
  const meals = attributed.filter((v) => listingById(v.listingId)?.type === "eatery").length;
  const pct = (n: number) => (eligible ? ((n / eligible) * 100).toFixed(1) : "0");

  const approval = audit.some((a) => a.action.includes("Pilot lane configured"));

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4">
      <div>
        <h1 className="text-2xl font-extrabold">Pilot KPI report</h1>
        <p className="text-stone-600">Shri Sanwaliya Seth Sugam Darshan · {fmtDate(today, "en")} · BRD section 2</p>
      </div>
      <Note>Targets are proposed pilot goals, not proven claims. Baselines and definitions must be agreed with the Mandal before launch. The general-queue “3+ hours” comparison must not be presented until independently observed.</Note>
      <div className="grid gap-4 md:grid-cols-2">
        <Kpi title="Trust adoption" value={approval ? "Lane configured" : "—"} target="Written CEO approval for 1 dedicated lane" met={null} note="Tracked outside the system: written approval + named Mandal pilot owner." />
        <Kpi
          title="Crowd decongestion — digital lane wait"
          value={`${w.median} min median`}
          target="Under 45 min · report p90 too"
          met={w.n ? w.p90 <= 45 : null}
          note={`p90 ${w.p90} min across ${w.n} admitted passes today. Measured from reporting time to gate scan.`}
        />
        <Kpi
          title="Devotee accessibility — WhatsApp + Kendra share"
          value={`${share}%`}
          target="More than 65%"
          met={share > 65}
          note={`WhatsApp ${ch("whatsapp")} · Kendra ${ch("kendra")} · Web ${ch("pwa")} completed passes (guest passes excluded).`}
        />
        <Kpi
          title="Supply onboarding"
          value={`${verified("stay")} stays + ${verified("eatery")} eateries`}
          target={`${TARGETS.stays} stays + ${TARGETS.eateries} eateries verified & live`}
          met={verified("stay") >= TARGETS.stays && verified("eatery") >= TARGETS.eateries}
          note="Counts only verified partners with signed terms and live listings (sample data in prototype)."
        />
        <Kpi
          title="Monetization — stays"
          value={`${pct(stays)}%`}
          target={`${TARGETS.stayConversionPct}% of eligible pass holders`}
          met={Number(pct(stays)) >= TARGETS.stayConversionPct}
          note={`${stays} redeemed stay bookings from the post-pass invitation ÷ ${eligible} eligible passes today. Clicks and abandoned checkouts excluded.`}
        />
        <Kpi
          title="Monetization — meals"
          value={`${pct(meals)}%`}
          target={`${TARGETS.mealConversionPct}% of eligible pass holders`}
          met={Number(pct(meals)) >= TARGETS.mealConversionPct}
          note={`${meals} redeemed meal reservations ÷ ${eligible} eligible passes today.`}
        />
      </div>
      <p className="text-xs text-stone-500">
        Conversion is computed from aggregate counts only: the marketplace records which invitation a visitor came from, never their pass id or temple booking data.
      </p>
    </div>
  );
}
