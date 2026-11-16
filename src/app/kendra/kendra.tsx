"use client";
import { useMemo, useRef, useState } from "react";
import { Emblem } from "@/components/Emblem";
import { QR } from "@/components/QR";
import { Badge, Button, Card, Note } from "@/components/ui";
import { KENDRA_VOLUNTEERS, MANDAL_NAME_GU, MANDAL_NAME_HI, MANDAL_PLACE_GU, MANDAL_PLACE_HI, REPORTING_POINT_GU, REPORTING_POINT_HI } from "@/lib/config";
import { bookableDates, effectiveBatch, nextAvailableWindow, reportTime, windowsFor } from "@/lib/slots";
import { useTemple } from "@/lib/temple-store";
import { fmtDate, fmtTime, ymd } from "@/lib/time";
import type { OpsConfig, Pass } from "@/lib/types";

export function Kendra() {
  const passes = useTemple((s) => s.passes);
  const cfg = useTemple((s) => s.config);
  const pause = useTemple((s) => s.pause);
  const openFlow = useTemple((s) => s.openFlow);
  const createPass = useTemple((s) => s.createPass);

  const [volunteer, setVolunteer] = useState(KENDRA_VOLUNTEERS[0]);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [noPhone, setNoPhone] = useState(false);
  const [group, setGroup] = useState(1);
  const [slipLang, setSlipLang] = useState<"hi" | "gu">("hi");
  const [date, setDate] = useState(ymd());
  const [win, setWin] = useState<string | "auto">("auto");
  const [last, setLast] = useState<{ pass: Pass; secs: number } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const started = useRef<number | null>(null);
  const touch = () => (started.current ??= Date.now());

  const dates = bookableDates(cfg);
  const wins = useMemo(() => windowsFor(date, passes, cfg), [date, passes, cfg]);
  const auto = nextAvailableWindow(date, group, passes, cfg);
  const chosen = win === "auto" ? auto?.start : win;
  const mobileOk = noPhone || /^[6-9]\d{9}$/.test(mobile);
  const mine = passes.filter((p) => p.channel === "kendra" && p.issuedBy === volunteer).sort((a, b) => b.createdAt - a.createdAt).slice(0, 8);

  async function issue() {
    if (!chosen) return;
    setErr(null);
    const t0 = started.current ?? Date.now();
    const r = await createPass({ name, mobile: noPhone ? "" : mobile, groupSize: group, date, windowStart: chosen, channel: "kendra", lang: slipLang, issuedBy: volunteer });
    if (!r.ok) {
      setErr(r.error === "duplicate" ? "इस मोबाइल नंबर पर इस दिन का पास पहले से है। / This number already has a pass for that day." : "यह समय भर गया — दूसरा चुनें। / Slot just filled — pick another.");
      return;
    }
    setLast({ pass: r.pass, secs: Math.round((Date.now() - t0) / 1000) });
    started.current = null;
    setName("");
    setMobile("");
    setGroup(1);
    setWin("auto");
    setTimeout(() => window.print(), 250);
  }

  return (
    <>
      <div className="print:hidden">
        <div className="flex flex-wrap items-center gap-3 bg-mandir px-5 py-3 text-white">
          <Emblem size={40} />
          <div className="flex-1 leading-tight">
            <div className="text-lg font-bold">सुगम दर्शन सहायता केंद्र</div>
            <div className="text-xs text-amber-200">{MANDAL_NAME_HI} · Sahayata Kendra</div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-amber-200">स्वयंसेवक</span>
            <select value={volunteer} onChange={(e) => setVolunteer(e.target.value)} className="rounded-lg bg-white/10 px-2 py-1.5 text-white ring-1 ring-white/30">
              {KENDRA_VOLUNTEERS.map((v) => (
                <option key={v} className="text-stone-900">
                  {v}
                </option>
              ))}
            </select>
          </label>
        </div>
        {(pause?.active || openFlow?.active) && (
          <div className={`px-5 py-2 text-sm font-semibold text-white ${openFlow?.active ? "bg-red-700" : "bg-amber-600"}`}>
            {openFlow?.active ? "⚠️ OPEN-FLOW mode: सभी कतारें खुली हैं — श्रद्धालुओं को सामान्य कतार की ओर भेजें।" : "🪔 भोग/आरती विश्राम चल रहा है — नए पास का समय अपने-आप आगे दिखाया जाएगा।"}
          </div>
        )}

        <div className="mx-auto grid max-w-6xl gap-5 p-5 lg:grid-cols-[1fr_380px]">
          <Card className="space-y-5 p-5" >
            <div onFocusCapture={touch} onPointerDownCapture={touch} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold">श्रद्धालु का नाम (वैकल्पिक)</span>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="जैसे: रामलाल जी" className="mt-1 w-full rounded-xl border border-stone-300 px-4 py-3 text-lg" />
                </label>
                <div>
                  <span className="text-sm font-semibold">मोबाइल नंबर</span>
                  <input
                    value={mobile}
                    disabled={noPhone}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    inputMode="numeric"
                    placeholder="10 अंक"
                    className="mt-1 w-full rounded-xl border border-stone-300 px-4 py-3 text-lg tracking-wider disabled:bg-stone-100"
                  />
                  <label className="mt-2 flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={noPhone} onChange={(e) => setNoPhone(e.target.checked)} className="h-5 w-5" />
                    फ़ोन नहीं है — केवल काग़ज़ की पर्ची
                  </label>
                </div>
              </div>

              <div>
                <span className="text-sm font-semibold">पर्ची की भाषा · Slip language</span>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:w-80">
                  {(
                    [
                      ["hi", "हिंदी"],
                      ["gu", "ગુજરાતી"],
                    ] as const
                  ).map(([code, label]) => (
                    <button key={code} onClick={() => setSlipLang(code)} className={`rounded-xl py-3 text-lg font-bold ring-2 ${slipLang === code ? "bg-saffron-600 text-white ring-saffron-600" : "bg-white ring-stone-200"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-sm font-semibold">कुल व्यक्ति</span>
                <div className="mt-2 grid grid-cols-6 gap-2">
                  {Array.from({ length: cfg.maxGroupSize }, (_, i) => i + 1).map((n) => (
                    <button key={n} onClick={() => setGroup(n)} className={`rounded-xl py-4 text-2xl font-bold ring-2 ${group === n ? "bg-saffron-600 text-white ring-saffron-600" : "bg-white ring-stone-200"}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-sm font-semibold">दिन</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {dates.map((d) => (
                    <button key={d} onClick={() => { setDate(d); setWin("auto"); }} className={`rounded-xl px-4 py-2.5 font-semibold ring-2 ${date === d ? "bg-saffron-50 ring-saffron-500" : "bg-white ring-stone-200"}`}>
                      {d === ymd() ? "आज · " : ""}
                      {fmtDate(d, "hi", { short: true })}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-sm font-semibold">समय</span>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <button onClick={() => setWin("auto")} className={`col-span-2 rounded-xl px-3 py-3 text-left ring-2 ${win === "auto" ? "bg-emerald-50 ring-emerald-600" : "bg-white ring-stone-200"}`}>
                    <div className="font-bold">⚡ अगला उपलब्ध बैच</div>
                    <div className="text-sm text-stone-600">{auto ? fmtTime(auto.start, "hi") : "आज कोई स्थान नहीं"}</div>
                  </button>
                  {wins
                    .filter((w) => w.open)
                    .map((w) => (
                      <button key={w.start} disabled={w.remaining < group} onClick={() => setWin(w.start)} className={`rounded-xl px-3 py-2 text-left ring-2 disabled:opacity-40 ${win === w.start ? "bg-saffron-50 ring-saffron-500" : "bg-white ring-stone-200"}`}>
                        <div className="text-sm font-bold">{fmtTime(w.start, "hi")}</div>
                        <div className="text-xs text-stone-600">{w.remaining} स्थान</div>
                      </button>
                    ))}
                </div>
              </div>
            </div>

            {err && <Note tone="red">{err}</Note>}
            <Button size="xl" className="w-full" disabled={!chosen || !mobileOk} onClick={issue}>
              🖨️ पास बनाएँ और प्रिंट करें
            </Button>
          </Card>

          <div className="space-y-4">
            {last && (
              <Card className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-bold">✅ पास जारी हुआ</span>
                  <Badge tone={last.secs <= 15 ? "green" : "amber"}>{last.secs}s · target ≤ 15s</Badge>
                </div>
                <Slip pass={last.pass} cfg={cfg} />
                <Button tone="secondary" className="mt-3 w-full" onClick={() => window.print()}>
                  दोबारा प्रिंट करें
                </Button>
              </Card>
            )}
            <Card className="p-4">
              <div className="mb-2 font-semibold">हाल में जारी ({volunteer})</div>
              {mine.length === 0 && <div className="text-sm text-stone-500">अभी कोई नहीं</div>}
              <ul className="divide-y divide-stone-100 text-sm">
                {mine.map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-2">
                    <span>
                      <span className="font-mono font-bold">{p.id}</span> · {p.groupSize} व्यक्ति
                    </span>
                    <button className="text-saffron-700 underline" onClick={() => { setLast({ pass: p, secs: 0 }); setTimeout(() => window.print(), 200); }}>
                      {fmtTime(reportTime(p, cfg), "hi")} · प्रिंट
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
            <Note tone="stone">Thermal slip prints at 80 mm. In the pilot, the tablet keeps working from a locally synced capacity view if the network drops, and syncs issued passes when back online.</Note>
          </div>
        </div>
      </div>

      {/* Printed slip — only this is visible when printing */}
      {last && (
        <div className="print-only">
          <Slip pass={last.pass} cfg={cfg} />
        </div>
      )}
    </>
  );
}

const SLIP = {
  hi: {
    mandal: MANDAL_NAME_HI,
    place: MANDAL_PLACE_HI,
    title: "सुगम दर्शन पास · निःशुल्क",
    name: "नाम",
    persons: "व्यक्ति",
    day: "दिन",
    batch: "बैच प्रवेश",
    report: "रिपोर्टिंग समय",
    point: REPORTING_POINT_HI,
    rules: ["यह पर्ची बस टिकट की तरह संभालकर रखें।", "बुलाए जाने पर पंक्ति में आएँ, गार्ड को पर्ची दिखाएँ।", "यह सेवा पूरी तरह निःशुल्क है — किसी को पैसे न दें।"],
    jai: "जय श्री सांवलिया सेठ 🙏",
  },
  gu: {
    mandal: MANDAL_NAME_GU,
    place: MANDAL_PLACE_GU,
    title: "સુગમ દર્શન પાસ · નિઃશુલ્ક",
    name: "નામ",
    persons: "વ્યક્તિ",
    day: "દિવસ",
    batch: "બેચ પ્રવેશ",
    report: "રિપોર્ટિંગ સમય",
    point: REPORTING_POINT_GU,
    rules: ["આ પરચી બસ ટિકિટની જેમ સાચવીને રાખો.", "બોલાવવામાં આવે ત્યારે લાઇનમાં આવો, ગાર્ડને પરચી બતાવો.", "આ સેવા સંપૂર્ણ નિઃશુલ્ક છે — કોઈને પૈસા ન આપો."],
    jai: "જય શ્રી સાંવલિયા શેઠ 🙏",
  },
} as const;

/** Black & white 80mm slip — Mandal identity only. Printed in the devotee's chosen language. */
function Slip({ pass, cfg }: { pass: Pass; cfg: OpsConfig }) {
  const l = pass.lang === "gu" ? "gu" : "hi";
  const x = SLIP[l];
  return (
    <div className="mx-auto w-[72mm] max-w-full bg-white p-2 font-sans text-black ring-1 ring-stone-300 print:ring-0">
      <div className="text-center leading-tight">
        <div className="text-[13px] font-bold">{x.mandal}</div>
        <div className="text-[10px]">{x.place}</div>
        <div className="mt-1 border-y border-black py-0.5 text-[12px] font-bold">{x.title}</div>
      </div>
      <div className="my-2 flex justify-center">
        <QR value={pass.token} size={150} />
      </div>
      <div className="text-center font-mono text-lg font-bold tracking-widest">{pass.id}</div>
      <table className="mt-1 w-full text-[12px]">
        <tbody>
          <tr><td>{x.name}</td><td className="text-right font-semibold">{pass.name}</td></tr>
          <tr><td>{x.persons}</td><td className="text-right font-semibold">{pass.groupSize}</td></tr>
          <tr><td>{x.day}</td><td className="text-right font-semibold">{fmtDate(pass.date, l, { short: true })}</td></tr>
          <tr><td>{x.batch}</td><td className="text-right font-semibold">{fmtTime(effectiveBatch(pass), l)}</td></tr>
        </tbody>
      </table>
      <div className="mt-1 border-2 border-black p-1 text-center">
        <div className="text-[11px]">{x.report}</div>
        <div className="text-xl font-extrabold">{fmtTime(reportTime(pass, cfg), l)}</div>
      </div>
      <div className="mt-1 text-[10.5px] leading-snug">
        📍 {x.point}
        {x.rules.map((r) => (
          <span key={r}>
            <br />• {r}
          </span>
        ))}
      </div>
      <div className="mt-1 text-center text-[9px]">{x.jai}</div>
    </div>
  );
}
