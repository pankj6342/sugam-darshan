"use client";
import { useState } from "react";
import { YatraMark } from "@/components/Emblem";
import { QrScanner } from "@/components/QrScanner";
import { Badge, Button, Card, Note, Stat } from "@/components/ui";
import { fmtClock, inr, ymd } from "@/lib/time";
import { LISTINGS, listingById } from "@/lib/yatra-data";
import { commissionOf, useYatra } from "@/lib/yatra-store";
import type { Voucher } from "@/lib/types";

const OPERATOR = "operator";
type Tab = "redeem" | "bookings" | "ledger";

export function PartnerPortal() {
  const partnerId = useYatra((s) => s.partnerId);
  const setPartner = useYatra((s) => s.setPartner);
  const all = useYatra((s) => s.vouchers);
  const isOp = partnerId === OPERATOR;
  const [tab, setTab] = useState<Tab>(isOp ? "ledger" : "redeem");
  const vouchers = isOp ? all : all.filter((v) => v.listingId === partnerId);

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="flex flex-wrap items-center gap-3 bg-teal-900 px-4 py-3 text-white">
        <YatraMark size={34} />
        <div className="flex-1 leading-tight">
          <div className="font-bold">Yatra Saathi · Partner portal</div>
          <div className="text-xs text-teal-200">Voucher redemption, bookings and commission settlement</div>
        </div>
        <select
          value={partnerId}
          onChange={(e) => {
            setPartner(e.target.value);
            setTab(e.target.value === OPERATOR ? "ledger" : "redeem");
          }}
          className="rounded-lg bg-teal-800 px-2 py-1.5 text-sm ring-1 ring-teal-600"
        >
          <option value={OPERATOR}>Operator — all partners</option>
          {LISTINGS.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </header>
      <nav className="flex gap-1 border-b border-stone-200 bg-white px-4">
        {(
          [
            ["redeem", "Redeem voucher"],
            ["bookings", "Bookings"],
            ["ledger", "Commission & settlement"],
          ] as [Tab, string][]
        ).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`border-b-2 px-4 py-2.5 text-sm font-semibold ${tab === k ? "border-teal-700 text-teal-900" : "border-transparent text-stone-500"}`}>
            {l}
          </button>
        ))}
      </nav>
      <main className="mx-auto max-w-5xl p-4">
        {tab === "redeem" && <Redeem partnerId={partnerId} vouchers={vouchers} />}
        {tab === "bookings" && <Bookings vouchers={vouchers} showPartner={isOp} />}
        {tab === "ledger" && <Ledger vouchers={vouchers} isOp={isOp} />}
      </main>
    </div>
  );
}

function Redeem({ partnerId, vouchers }: { partnerId: string; vouchers: Voucher[] }) {
  const redeem = useYatra((s) => s.redeem);
  const all = useYatra((s) => s.vouchers);
  const [code, setCode] = useState("");
  const [cam, setCam] = useState(false);
  const [found, setFound] = useState<Voucher | null>(null);
  const [bill, setBill] = useState("");
  const [ref, setRef] = useState("");
  const [msg, setMsg] = useState<{ tone: "green" | "red" | "amber"; t: string } | null>(null);

  function lookup(raw: string) {
    const id = raw.trim().replace(/^YV1:/, "").toUpperCase();
    const v = all.find((x) => x.id === id);
    setMsg(null);
    if (!v) return setMsg({ tone: "red", t: `Voucher ${id} not found.` });
    if (partnerId !== OPERATOR && v.listingId !== partnerId) return setMsg({ tone: "red", t: `Voucher ${id} belongs to another partner.` });
    setFound(v);
    setBill(String(v.estTotal));
    setRef("");
  }

  const pending = vouchers.filter((v) => v.status === "confirmed").slice(0, 5);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="space-y-3 p-4">
        <div className="font-bold">Scan or enter voucher</div>
        <div className="flex gap-2">
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="YV-XXXXXX" className="min-w-0 flex-1 rounded-lg border border-stone-300 px-3 py-2 font-mono uppercase" />
          <Button tone="teal" onClick={() => lookup(code)}>
            Look up
          </Button>
        </div>
        <Button tone="secondary" size="sm" onClick={() => setCam(!cam)}>
          {cam ? "Stop camera" : "📷 Scan QR"}
        </Button>
        <QrScanner
          active={cam}
          onScan={(t) => {
            setCam(false);
            lookup(t);
          }}
        />
        {pending.length > 0 && (
          <div>
            <div className="mb-1 text-xs text-stone-500">Demo: upcoming confirmed vouchers</div>
            <div className="flex flex-wrap gap-2">
              {pending.map((v) => (
                <button key={v.id} onClick={() => lookup(v.id)} className="rounded-lg bg-stone-100 px-2 py-1 font-mono text-xs">
                  {v.id}
                </button>
              ))}
            </div>
          </div>
        )}
        {msg && <Note tone={msg.tone}>{msg.t}</Note>}
      </Card>

      {found && (
        <Card className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-lg font-bold">{found.id}</span>
            <Badge tone={found.status === "confirmed" ? "green" : found.status === "redeemed" ? "blue" : "red"}>{found.status}</Badge>
          </div>
          <div className="text-sm">
            <div className="font-semibold">{found.guestName} · {found.people} guests</div>
            <div className="text-stone-600">{listingById(found.listingId)?.name}</div>
            <div>Advance paid: {inr(found.advancePaid)} · Estimated: {inr(found.estTotal)}</div>
          </div>
          {found.status === "confirmed" ? (
            <>
              <label className="block text-sm">
                <span className="font-semibold">Final bill amount (₹)</span>
                <input value={bill} onChange={(e) => setBill(e.target.value.replace(/\D/g, ""))} inputMode="numeric" className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" />
              </label>
              <label className="block text-sm">
                <span className="font-semibold">Bill / invoice reference</span>
                <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. BILL-2231" className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" />
              </label>
              <div className="text-sm">
                Collect from guest: <b>{inr(Math.max(0, Number(bill || 0) - found.advancePaid))}</b> (bill minus advance)
              </div>
              <Button
                tone="teal"
                className="w-full"
                disabled={!bill || ref.trim().length < 3}
                onClick={() => {
                  const r = redeem(found.id, Number(bill), ref.trim());
                  setMsg(r === "ok" ? { tone: "green", t: `Redeemed ${found.id}. Commission will appear in the settlement ledger.` } : { tone: "red", t: `Could not redeem: ${r}` });
                  setFound(null);
                  setCode("");
                }}
              >
                Mark redeemed
              </Button>
            </>
          ) : (
            <Note tone={found.status === "redeemed" ? "amber" : "red"}>
              {found.status === "redeemed" ? `Already redeemed at ${fmtClock(found.redeemedAt!)} (ref ${found.txnRef}).` : `Voucher is ${found.status} — do not honour.`}
            </Note>
          )}
        </Card>
      )}
    </div>
  );
}

function Bookings({ vouchers, showPartner }: { vouchers: Voucher[]; showPartner: boolean }) {
  return (
    <Card className="overflow-x-auto p-4">
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-stone-500">
          <tr>
            <th className="py-1">Voucher</th>
            {showPartner && <th>Partner</th>}
            <th>Guest</th>
            <th>When</th>
            <th className="text-right">Est.</th>
            <th className="text-right">Advance</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {vouchers.map((v) => (
            <tr key={v.id}>
              <td className="py-1.5 font-mono">{v.id}</td>
              {showPartner && <td>{listingById(v.listingId)?.name}</td>}
              <td>
                {v.guestName} · {v.people}
              </td>
              <td>{v.checkIn ?? `${v.mealDate} ${v.mealTime}`}</td>
              <td className="text-right">{inr(v.estTotal)}</td>
              <td className="text-right">{inr(v.advancePaid)}</td>
              <td>
                <Badge tone={v.status === "confirmed" ? "green" : v.status === "redeemed" ? "blue" : "red"}>{v.status}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {vouchers.length === 0 && <div className="py-4 text-center text-stone-500">No bookings yet.</div>}
    </Card>
  );
}

function Ledger({ vouchers, isOp }: { vouchers: Voucher[]; isOp: boolean }) {
  const settle = useYatra((s) => s.settle);
  const redeemed = vouchers.filter((v) => v.status === "redeemed");
  const gmv = redeemed.reduce((s, v) => s + (v.finalBill ?? v.estTotal), 0);
  const comm = redeemed.reduce((s, v) => s + commissionOf(v), 0);
  const due = redeemed.filter((v) => !v.settled).reduce((s, v) => s + commissionOf(v), 0);
  const leakage = vouchers.filter((v) => v.status === "confirmed" && (v.checkIn ?? v.mealDate ?? "9999") < ymd());
  const refunds = vouchers.filter((v) => v.status === "refunded").reduce((s, v) => s + v.advancePaid, 0);

  const byPartner = LISTINGS.map((l) => {
    const rs = redeemed.filter((v) => v.listingId === l.id);
    return { l, n: rs.length, gmv: rs.reduce((s, v) => s + (v.finalBill ?? v.estTotal), 0), comm: rs.reduce((s, v) => s + commissionOf(v), 0), unsettled: rs.filter((v) => !v.settled).reduce((s, v) => s + commissionOf(v), 0) };
  }).filter((r) => r.n > 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Redeemed booking value" value={inr(gmv)} sub={`${redeemed.length} vouchers`} />
        <Stat label="Commission earned" value={inr(comm)} sub="per signed partner rate" />
        <Stat label="Commission unsettled" value={inr(due)} tone={due > 0 ? "amber" : "green"} />
        <Stat label="Refunds issued" value={inr(refunds)} sub="token advances returned" />
      </div>
      {leakage.length > 0 && <Note>⚠️ {leakage.length} confirmed voucher(s) are past their date but not redeemed — follow up (possible offline settlement / commission leakage).</Note>}
      <Card className="overflow-x-auto p-4">
        <h2 className="mb-2 font-bold">Settlement by partner</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-stone-500">
            <tr>
              <th className="py-1">Partner</th>
              <th className="text-right">Rate</th>
              <th className="text-right">Redeemed</th>
              <th className="text-right">Value</th>
              <th className="text-right">Commission</th>
              <th className="text-right">Unsettled</th>
              {isOp && <th />}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {byPartner.map((r) => (
              <tr key={r.l.id}>
                <td className="py-1.5">{r.l.name}</td>
                <td className="text-right">{r.l.commissionPct}%</td>
                <td className="text-right">{r.n}</td>
                <td className="text-right">{inr(r.gmv)}</td>
                <td className="text-right">{inr(r.comm)}</td>
                <td className="text-right font-semibold">{inr(r.unsettled)}</td>
                {isOp && (
                  <td className="text-right">
                    {r.unsettled > 0 && (
                      <button className="text-xs text-teal-700 underline" onClick={() => settle(r.l.id)}>
                        mark settled
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="text-xs text-stone-500">Commission applies only to completed, redeemed hospitality bookings. No commission is ever earned from darshan.</p>
    </div>
  );
}
