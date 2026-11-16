"use client";
import { useEffect, useState } from "react";
import { useTick } from "@/components/ClientOnly";
import { QrScanner } from "@/components/QrScanner";
import { Badge, Button, Card, Note } from "@/components/ui";
import { admit, useGate, validateScan, type ScanOutcome } from "@/lib/gate";
import { effectiveBatch, reportTime } from "@/lib/slots";
import { useTemple } from "@/lib/temple-store";
import { fmtAgo, fmtClock, fmtTime, hmToMin, nowMin, ymd } from "@/lib/time";
import type { ScanResultCode } from "@/lib/types";

const RESULT: Record<ScanResultCode, { bg: string; icon: string; hi: string; en: string }> = {
  valid: { bg: "bg-emerald-600", icon: "✅", hi: "मान्य — प्रवेश दें", en: "Valid — admit" },
  duplicate: { bg: "bg-red-700", icon: "⛔", hi: "पहले ही उपयोग हो चुका", en: "Already used (duplicate)" },
  invalid: { bg: "bg-red-700", icon: "⛔", hi: "अमान्य / नकली QR", en: "Invalid or tampered QR" },
  "not-in-cache": { bg: "bg-amber-600", icon: "⚠️", hi: "ऑफ़लाइन सूची में नहीं — सुपरवाइज़र जाँच", en: "Signature OK but not in offline list — supervisor check" },
  "wrong-day": { bg: "bg-red-700", icon: "⛔", hi: "यह पास आज के लिए नहीं है", en: "Not valid today" },
  early: { bg: "bg-amber-600", icon: "⏳", hi: "जल्दी आए — अपने समय पर आएँ", en: "Too early for this batch" },
  late: { bg: "bg-amber-600", icon: "⚠️", hi: "समय निकल चुका — सुपरवाइज़र", en: "Batch time passed — supervisor" },
  cancelled: { bg: "bg-red-700", icon: "⛔", hi: "पास रद्द / समय बदला गया", en: "Pass cancelled or rescheduled" },
  paused: { bg: "bg-amber-600", icon: "🪔", hi: "भोग/आरती विश्राम — बैच रोकें", en: "Ritual pause — hold the batch" },
  "openflow-bypass": { bg: "bg-slate-700", icon: "🚪", hi: "Open-Flow — दृश्य जाँच से प्रवेश", en: "Open-Flow visual-check entry" },
  "sync-conflict": { bg: "bg-red-700", icon: "⚠️", hi: "सिंक टकराव — दो डिवाइस पर स्कैन", en: "Sync conflict — scanned on two devices" },
};

function tamper(token: string) {
  const i = token.length - 3;
  return token.slice(0, i) + (token[i] === "A" ? "B" : "A") + token.slice(i + 1);
}

export function GateScanner() {
  const now = useTick(5000);
  const gate = useGate();
  const passes = useTemple((s) => s.passes);
  const cfg = useTemple((s) => s.config);
  const pause = useTemple((s) => s.pause);
  const openFlow = useTemple((s) => s.openFlow);
  const events = useTemple((s) => s.gateEvents);
  const addGateEvent = useTemple((s) => s.addGateEvent);
  const [result, setResult] = useState<(ScanOutcome & { admitted?: boolean; escalated?: boolean }) | null>(null);
  const [camera, setCamera] = useState(false);
  const [paste, setPaste] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  // Keep a recent local snapshot while online (BRD NFR-05).
  useEffect(() => {
    if (!gate.snapshot) gate.sync();
    const id = setInterval(() => {
      if (useGate.getState().online) useGate.getState().sync();
    }, 30000);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const snapAgeMin = gate.snapshot ? (now - gate.snapshot.at) / 60000 : Infinity;
  const stale = !gate.online && snapAgeMin > cfg.offlineMaxAgeMin;
  const openFlowNow = gate.online ? openFlow?.active : gate.snapshot?.openFlow;
  const pausedNow = gate.online ? pause?.active : gate.snapshot?.paused;

  async function scan(token: string) {
    const r = await validateScan(token);
    if (r.code === "valid" && r.passId) {
      admit(r.passId, "valid");
      setResult({ ...r, admitted: true });
    } else {
      if (r.code !== "valid") addGateEvent({ at: Date.now(), device: gate.deviceId, passId: r.passId, result: r.code, offline: !gate.online });
      setResult(r);
    }
  }

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  const today = ymd();
  const nowM = nowMin();
  const demo = passes
    .filter((p) => p.date === today && p.status === "active" && Math.abs(hmToMin(effectiveBatch(p)) - nowM) < 40)
    .slice(0, 4);
  const used = passes.find((p) => p.date === today && p.status === "used");
  const cancelled = passes.find((p) => p.status === "cancelled" || p.status === "rescheduled");
  const future = passes.find((p) => p.date > today && p.status === "active");
  const later = passes.find((p) => p.date === today && p.status === "active" && hmToMin(effectiveBatch(p)) > nowM + 90);
  const recent = events.filter((e) => e.device === gate.deviceId).slice(0, 8);

  return (
    <div className="mx-auto max-w-5xl p-4">
      {/* Device bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl bg-slate-900 p-4 text-white">
        <div className="flex-1">
          <div className="text-lg font-bold">🛡️ गेट स्कैनर · {gate.deviceId}</div>
          <div className="text-xs text-slate-300">
            Local pass list: {gate.snapshot ? `${Object.keys(gate.snapshot.passes).length} passes · synced ${fmtAgo(gate.snapshot.at)}` : "not synced"} · pending upload: {gate.pending.length}
          </div>
        </div>
        <button
          onClick={() => {
            const r = gate.setOnline(!gate.online);
            if (r) flash(`Synced ${r.synced} offline scans${r.conflicts ? ` · ${r.conflicts} conflict(s)!` : ""}`);
          }}
          className={`rounded-full px-4 py-2 text-sm font-bold ${gate.online ? "bg-emerald-500 text-emerald-950" : "bg-red-500 text-white"}`}
          aria-pressed={!gate.online}
        >
          {gate.online ? "● Online" : "○ Offline (simulated)"}
        </button>
        <Button tone="secondary" size="sm" disabled={!gate.online} onClick={() => { const r = gate.sync(); flash(`Snapshot refreshed · ${r.synced} uploaded`); }}>
          ⟳ Sync now
        </Button>
      </div>

      {toast && <div className="fixed left-1/2 top-16 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-5 py-2 text-sm text-white shadow-lg">{toast}</div>}

      {openFlowNow && (
        <div className="mb-4 rounded-2xl bg-red-700 p-4 text-white">
          <div className="text-xl font-extrabold">🚨 OPEN-FLOW MODE — स्कैन अनिवार्य नहीं</div>
          <div className="text-sm">Physical crowd command takes precedence. Admit by visual check; scanning is optional.</div>
          <Button tone="secondary" size="lg" className="mt-3 w-full" onClick={() => { addGateEvent({ at: Date.now(), device: gate.deviceId, result: "openflow-bypass", offline: !gate.online }); flash("Visual-check entry logged"); }}>
            🚪 दृश्य जाँच से प्रवेश (log +1)
          </Button>
        </div>
      )}
      {pausedNow && !openFlowNow && (
        <div className="mb-4 rounded-2xl bg-amber-500 p-4 font-bold text-amber-950">🪔 भोग / आरती विश्राम — नए बैच को प्रवेश न दें। Hold the batch until resume.</div>
      )}
      {stale && <Note tone="red">⚠️ Offline list is {Math.round(snapAgeMin)} min old (limit {cfg.offlineMaxAgeMin} min). Cancellations since then are not visible — escalate any uncertain pass.</Note>}
      {gate.conflicts.length > 0 && (
        <div className="mb-4">
          <Note tone="red">
            Sync found {gate.conflicts.length} pass(es) scanned on another device while offline: {gate.conflicts.slice(0, 5).map((c) => c.passId).join(", ")}. Reported to control room.
          </Note>
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          {/* Result */}
          {result ? (
            <div className={`rounded-3xl p-6 text-white shadow-lg ${RESULT[result.admitted ? "valid" : result.code].bg}`}>
              <div className="text-5xl">{result.admitted ? "✅" : RESULT[result.code].icon}</div>
              <div className="mt-2 text-3xl font-extrabold">{result.admitted ? `प्रवेश दें — ${result.groupSize} व्यक्ति` : RESULT[result.code].hi}</div>
              <div className="text-white/90">{result.admitted ? `Admitted · ${result.groupSize} persons` : RESULT[result.code].en}</div>
              {result.passId && (
                <div className="mt-3 rounded-xl bg-black/15 p-3 text-sm">
                  <div className="font-mono text-lg font-bold">{result.passId}</div>
                  {result.name && <div>{result.name}</div>}
                  {result.batch && <div>Batch {fmtTime(result.batch, "en")}{result.channel ? ` · via ${result.channel}` : ""}</div>}
                  {result.usedAt && <div>First scanned at {fmtClock(result.usedAt)}</div>}
                </div>
              )}
              <div className="mt-2 text-xs text-white/80">
                Validated {result.offline ? "OFFLINE from local signed list" : "online"} in {result.ms} ms (target &lt; 1000 ms)
              </div>
              {!result.admitted && !result.escalated && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {result.overridable && result.passId && (
                    <Button tone="secondary" onClick={() => { admit(result.passId!, result.code, true); setResult({ ...result, admitted: true }); }}>
                      Override &amp; admit
                    </Button>
                  )}
                  <Button tone="dark" className={result.overridable ? "" : "col-span-2"} onClick={() => setResult({ ...result, escalated: true })}>
                    सुपरवाइज़र को भेजें
                  </Button>
                </div>
              )}
              {result.escalated && <div className="mt-3 rounded-lg bg-black/20 p-2 text-sm">Sent to manual exception desk.</div>}
            </div>
          ) : (
            <Card className="flex h-56 items-center justify-center p-6 text-center text-stone-500">Scan a pass — result appears here in large text for the guard.</Card>
          )}

          <Card className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-semibold">Camera</span>
              <Button tone={camera ? "danger" : "dark"} size="sm" onClick={() => setCamera(!camera)}>
                {camera ? "Stop camera" : "📷 Start camera"}
              </Button>
            </div>
            <QrScanner active={camera} onScan={scan} />
            {!camera && <p className="text-sm text-stone-500">Point the camera at a pass on a phone (e.g. the PWA or WhatsApp simulator) or a printed Kendra slip.</p>}
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <div className="mb-1 font-semibold">Demo: tap to simulate a scan</div>
            <p className="mb-3 text-xs text-stone-500">Toggle “Offline”, book a new pass in another tab, then scan it here to see the not-in-cache path.</p>
            <div className="grid gap-2">
              {demo.map((p) => (
                <DemoBtn key={p.id} onClick={() => scan(p.token)} label={`${p.id} · ${p.name}`} sub={`Batch ${fmtTime(effectiveBatch(p), "en")} · report ${fmtTime(reportTime(p, cfg), "en")}`} tone="green" />
              ))}
              {demo.length === 0 && <div className="text-sm text-stone-500">No batches within ±40 min right now.</div>}
              {used && <DemoBtn onClick={() => scan(used.token)} label={`${used.id} · already used`} sub="Duplicate / screenshot re-use" tone="red" />}
              {used && <DemoBtn onClick={() => scan(tamper(used.token))} label="Tampered QR" sub="Signature check fails" tone="red" />}
              {cancelled && <DemoBtn onClick={() => scan(cancelled.token)} label={`${cancelled.id} · ${cancelled.status}`} sub="Revoked pass" tone="red" />}
              {later && <DemoBtn onClick={() => scan(later.token)} label={`${later.id} · later batch`} sub={`Batch ${fmtTime(effectiveBatch(later), "en")}`} tone="amber" />}
              {future && <DemoBtn onClick={() => scan(future.token)} label={`${future.id} · future date`} sub={future.date} tone="red" />}
            </div>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (paste.trim()) scan(paste.trim());
                setPaste("");
              }}
            >
              <input value={paste} onChange={(e) => setPaste(e.target.value)} placeholder="…or paste token SD1.…" className="min-w-0 flex-1 rounded-lg border border-stone-300 px-3 py-2 font-mono text-xs" />
              <Button tone="secondary" size="sm">Validate</Button>
            </form>
          </Card>

          <Card className="p-4">
            <div className="mb-2 font-semibold">This device — recent scans</div>
            <ul className="space-y-1 text-sm">
              {recent.length === 0 && <li className="text-stone-500">None yet.</li>}
              {recent.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-2">
                  <span className="font-mono">{e.passId ?? "—"}</span>
                  <span className="flex items-center gap-2">
                    {e.offline && <Badge tone="amber">offline</Badge>}
                    <Badge tone={e.result === "valid" ? "green" : e.result === "openflow-bypass" ? "stone" : "red"}>{e.result}</Badge>
                    <span className="text-xs text-stone-500">{fmtClock(e.at)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DemoBtn({ label, sub, onClick, tone }: { label: string; sub: string; onClick: () => void; tone: "green" | "red" | "amber" }) {
  const dot = tone === "green" ? "bg-emerald-500" : tone === "red" ? "bg-red-500" : "bg-amber-500";
  return (
    <button onClick={onClick} className="flex items-center gap-3 rounded-xl bg-stone-50 px-3 py-2 text-left ring-1 ring-stone-200 hover:bg-stone-100">
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold">{label}</span>
        <span className="block text-xs text-stone-500">{sub}</span>
      </span>
    </button>
  );
}
