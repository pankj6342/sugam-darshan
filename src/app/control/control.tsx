"use client";
import { useState } from "react";
import { useTick } from "@/components/ClientOnly";
import { Emblem } from "@/components/Emblem";
import { PassCard } from "@/components/PassCard";
import { Badge, Button, Card, Note, Stat } from "@/components/ui";
import { PERMS, ROLE_LABEL } from "@/lib/config";
import { useTemple } from "@/lib/temple-store";
import { digitalWaits, generalWaitEstimateMin, hourlyEntries, upcomingBatches, zones } from "@/lib/telemetry";
import { at, fmtClock, fmtTime, hmToMin, nowMin, pad, ymd } from "@/lib/time";
import type { OpsConfig, Role } from "@/lib/types";

type Tab = "live" | "atithi" | "audit";

export function ControlRoom() {
  const now = useTick(5000);
  const role = useTemple((s) => s.controlRole);
  const setRole = useTemple((s) => s.setRole);
  const pause = useTemple((s) => s.pause);
  const openFlow = useTemple((s) => s.openFlow);
  const outage = useTemple((s) => s.telemetryOutage);
  const [tab, setTab] = useState<Tab>("live");

  const status = openFlow?.active ? { t: "OPEN-FLOW", c: "bg-red-600" } : pause?.active ? { t: "RITUAL PAUSE", c: "bg-amber-500 text-amber-950" } : { t: "NORMAL · BATCHES RUNNING", c: "bg-emerald-600" };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-3">
          <Emblem size={38} />
          <div className="flex-1 leading-tight">
            <div className="font-bold">नियंत्रण कक्ष · Sugam Darshan Control Room</div>
            <div className="text-xs text-slate-400">Shri Sanwaliya Seth Mandir Mandal · pilot lane · {new Date(now).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })} · {fmtClock(now).slice(0, 5)}</div>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${status.c}`}>{status.t}</span>
          <label className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Signed in as</span>
            <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="rounded-lg bg-slate-800 px-2 py-1.5 text-sm ring-1 ring-slate-600">
              {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 px-4">
          {(
            [
              ["live", "Live operations"],
              ["atithi", "Mandal Atithi passes"],
              ["audit", "Audit log & day summary"],
            ] as [Tab, string][]
          ).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`rounded-t-lg px-4 py-2 text-sm font-semibold ${tab === k ? "bg-slate-100 text-slate-900" : "text-slate-300 hover:text-white"}`}>
              {l}
            </button>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl space-y-4 p-4">
        {outage && <Note tone="red">⚠️ Crowd telemetry feed unavailable — zone counts below are STALE (last good reading frozen). Rely on ground reports.</Note>}
        {tab === "live" && <Live role={role} />}
        {tab === "atithi" && <Atithi role={role} />}
        {tab === "audit" && <Audit />}
      </main>
    </div>
  );
}

function can(role: Role, perm: keyof typeof PERMS) {
  return PERMS[perm].includes(role);
}

function NoPerm({ perm }: { perm: keyof typeof PERMS }) {
  return <div className="mt-2 text-xs text-stone-500">🔒 Requires: {PERMS[perm].map((r) => ROLE_LABEL[r]).join(" / ")}</div>;
}

function Live({ role }: { role: Role }) {
  const now = useTick(5000);
  const passes = useTemple((s) => s.passes);
  const cfg = useTemple((s) => s.config);
  const events = useTemple((s) => s.gateEvents);
  const outage = useTemple((s) => s.telemetryOutage);
  const setOutage = useTemple((s) => s.setTelemetryOutage);
  const today = ymd();
  const todays = passes.filter((p) => p.date === today && p.channel !== "guest" && p.status !== "rescheduled");
  const issuedPeople = todays.filter((p) => p.status !== "cancelled").reduce((s, p) => s + p.groupSize, 0);
  const admitted = todays.filter((p) => p.status === "used").reduce((s, p) => s + p.groupSize, 0);
  const noShow = todays.filter((p) => p.status === "active" && at(p.date, p.batchTime) + ((p.delayMin || 0) + cfg.lateGraceMin) * 60000 < now).length;
  const waits = digitalWaits(passes, cfg);
  const zs = zones(outage ? hmToMin("09:10") : nowMin());
  const genWait = generalWaitEstimateMin();
  const todaysEvents = events.filter((e) => new Date(e.at).toDateString() === new Date().toDateString());
  const ex = (c: string) => todaysEvents.filter((e) => e.result === c).length;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Digital lane wait (measured)" value={`${waits.median} min`} sub={`median · p90 ${waits.p90} min · n=${waits.n}`} tone={waits.p90 > 45 ? "amber" : "green"} />
        <Stat label="General queue wait" value={outage ? "—" : `~${genWait} min`} sub={outage ? "telemetry unavailable" : "estimate from simulated counts"} />
        <Stat label="Today: admitted / booked" value={`${admitted} / ${issuedPeople}`} sub={`${todays.length} passes · ${noShow} no-show so far`} />
        <Stat label="Gate exceptions today" value={ex("duplicate") + ex("invalid") + ex("not-in-cache") + ex("sync-conflict")} sub={`${ex("duplicate")} dup · ${ex("invalid")} invalid · ${ex("not-in-cache")} cache-miss · ${ex("openflow-bypass")} open-flow`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-4">
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold">Live crowd view by zone</h2>
              <div className="flex items-center gap-2">
                <Badge tone={outage ? "red" : "green"}>{outage ? "STALE" : "live · simulated"}</Badge>
                <label className="flex items-center gap-1 text-xs text-stone-500">
                  <input type="checkbox" checked={outage} onChange={(e) => setOutage(e.target.checked)} /> simulate feed outage
                </label>
              </div>
            </div>
            <div className="space-y-3">
              {zs.map((z) => {
                const pct = Math.min(100, Math.round((z.count / z.capacity) * 100));
                return (
                  <div key={z.id} className={outage ? "opacity-50" : ""}>
                    <div className="flex justify-between text-sm">
                      <span>
                        {z.label} <span className="text-stone-400">· {z.labelHi}</span>
                      </span>
                      <span className="font-semibold tabular-nums">
                        {z.count.toLocaleString("en-IN")} <span className="text-stone-400">/ {z.capacity.toLocaleString("en-IN")}</span>
                      </span>
                    </div>
                    <div className="mt-1 h-2.5 rounded-full bg-stone-100">
                      <div className={`h-full rounded-full ${pct > 85 ? "bg-red-500" : pct > 65 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} />
                    </div>
                    {pct > 85 && !outage && <div className="mt-0.5 text-xs font-semibold text-red-700">⚠ Unusual build-up — consider slowing batch calls</div>}
                  </div>
                );
              })}
            </div>
          </Card>

          <Batches />
          <Hourly />
        </div>

        <div className="space-y-4">
          <PauseCard role={role} />
          <OpenFlowCard role={role} />
          <ConfigCard role={role} cfg={cfg} />
        </div>
      </div>
    </>
  );
}

function Batches() {
  const passes = useTemple((s) => s.passes);
  const cfg = useTemple((s) => s.config);
  const pause = useTemple((s) => s.pause);
  const list = upcomingBatches(passes, cfg, 9);
  const now = nowMin();
  return (
    <Card className="p-4">
      <h2 className="mb-3 font-bold">Batch schedule — digital lane</h2>
      {list.length === 0 && <div className="text-sm text-stone-500">No digital batches in the next hours.</div>}
      <div className="space-y-2">
        {list.map((b) => {
          const delay = passes.find((p) => p.batchTime === b.time && p.date === ymd() && p.delayMin)?.delayMin ?? 0;
          const eff = hmToMin(b.time) + delay;
          const state = pause?.active && eff >= now ? "held" : eff <= now ? (b.scanned >= b.people * 0.85 ? "done" : "entering") : eff - now <= cfg.intervalMin ? "next" : "scheduled";
          return (
            <div key={b.time} className="grid grid-cols-[88px_1fr_110px] items-center gap-3 text-sm">
              <span className="font-mono font-semibold">
                {b.time}
                {delay > 0 && <span className="block text-[11px] text-amber-700">→ {pad(Math.floor(eff / 60))}:{pad(eff % 60)}</span>}
              </span>
              <div className="h-3 overflow-hidden rounded-full bg-stone-100">
                <div className="h-full bg-sky-200" style={{ width: `${(b.people / b.capacity) * 100}%` }}>
                  <div className="h-full bg-emerald-500" style={{ width: `${b.people ? (b.scanned / b.people) * 100 : 0}%` }} />
                </div>
              </div>
              <span className="flex items-center justify-end gap-2 tabular-nums">
                {b.people}/{b.capacity}
                <Badge tone={state === "held" ? "amber" : state === "done" ? "stone" : state === "entering" ? "green" : state === "next" ? "blue" : "stone"}>{state}</Badge>
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex gap-4 text-xs text-stone-500">
        <span>
          <span className="mr-1 inline-block h-2 w-3 rounded bg-sky-200" />
          booked
        </span>
        <span>
          <span className="mr-1 inline-block h-2 w-3 rounded bg-emerald-500" />
          admitted at gate
        </span>
      </div>
    </Card>
  );
}

function Hourly() {
  const passes = useTemple((s) => s.passes);
  const data = hourlyEntries(passes);
  const max = Math.max(1, ...data.map((d) => d.digital + d.general));
  return (
    <Card className="p-4">
      <h2 className="mb-3 font-bold">Hourly entries — today</h2>
      <div className="flex h-40 items-end gap-1">
        {data.map((d) => (
          <div key={d.hour} className="flex flex-1 flex-col items-center gap-1" title={`${d.hour}:00 — digital ${d.digital}, general ${d.general}`}>
            <div className="flex w-full flex-col justify-end" style={{ height: 128 }}>
              <div className="w-full rounded-t bg-stone-300" style={{ height: `${(d.general / max) * 128}px` }} />
              <div className="w-full bg-saffron-500" style={{ height: `${(d.digital / max) * 128}px` }} />
            </div>
            <span className="text-[10px] text-stone-500">{d.hour}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-4 text-xs text-stone-500">
        <span>
          <span className="mr-1 inline-block h-2 w-3 rounded bg-saffron-500" />
          Sugam lane (from scans)
        </span>
        <span>
          <span className="mr-1 inline-block h-2 w-3 rounded bg-stone-300" />
          General (simulated counter)
        </span>
      </div>
    </Card>
  );
}

function PauseCard({ role }: { role: Role }) {
  const pause = useTemple((s) => s.pause);
  const cfg = useTemple((s) => s.config);
  const startPause = useTemple((s) => s.startPause);
  const endPause = useTemple((s) => s.endPause);
  const [reason, setReason] = useState<"bhog" | "aarti" | "other">("bhog");
  const [mins, setMins] = useState(cfg.pauseDefaultMin);
  const [msg, setMsg] = useState<string | null>(null);
  const ok = can(role, "pause");
  const now = useTick(15000);
  return (
    <Card className={`p-4 ${pause?.active ? "ring-2 ring-amber-500" : ""}`}>
      <h2 className="font-bold">🪔 Bhog / Aarti Vishram</h2>
      <p className="text-xs text-stone-500">Pauses new batch calls and sends a Mandal-approved Hindi delay message with each devotee&apos;s revised reporting time.</p>
      {pause?.active ? (
        <div className="mt-3 space-y-2">
          <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
            Paused for <b>{pause.reason}</b> since {fmtClock(pause.since).slice(0, 5)} by {ROLE_LABEL[pause.by]} · announced {pause.expectedMin} min · elapsed {Math.max(0, Math.round((now - pause.since) / 60000))} min
          </div>
          <Button tone="success" size="lg" className="w-full" disabled={!ok} onClick={() => endPause(role)}>
            ▶ Resume darshan batches
          </Button>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <div className="flex gap-2">
            <select value={reason} onChange={(e) => setReason(e.target.value as typeof reason)} className="flex-1 rounded-lg border border-stone-300 px-2 py-2 text-sm">
              <option value="bhog">Rajbhog</option>
              <option value="aarti">Aarti</option>
              <option value="other">Other temple instruction</option>
            </select>
            <select value={mins} onChange={(e) => setMins(Number(e.target.value))} className="rounded-lg border border-stone-300 px-2 py-2 text-sm">
              {[15, 20, 30, 45, 60, 90].map((m) => (
                <option key={m} value={m}>
                  {m} min
                </option>
              ))}
            </select>
          </div>
          <Button
            tone="primary"
            size="lg"
            className="w-full"
            disabled={!ok}
            onClick={() => {
              const n = startPause(reason, mins, role);
              setMsg(`${n} devotees notified on WhatsApp in Hindi.`);
              setTimeout(() => setMsg(null), 5000);
            }}
          >
            ⏸ Bhog / Aarti Vishram
          </Button>
        </div>
      )}
      {msg && <div className="mt-2 text-sm text-emerald-700">{msg}</div>}
      {!ok && <NoPerm perm="pause" />}
    </Card>
  );
}

function OpenFlowCard({ role }: { role: Role }) {
  const openFlow = useTemple((s) => s.openFlow);
  const setOpenFlow = useTemple((s) => s.setOpenFlow);
  const [confirming, setConfirming] = useState(false);
  const [note, setNote] = useState("");
  const ok = can(role, "openFlow");
  return (
    <Card className={`p-4 ${openFlow?.active ? "bg-red-50 ring-2 ring-red-600" : ""}`}>
      <h2 className="font-bold">🚨 Amavasya Open-Flow override</h2>
      <p className="text-xs text-stone-500">Bypasses QR scanning at all gates during extreme surges. Police / on-ground command always overrides the software.</p>
      {openFlow?.active ? (
        <div className="mt-3 space-y-2">
          <div className="rounded-xl bg-red-100 p-3 text-sm text-red-900">
            ACTIVE since {fmtClock(openFlow.since).slice(0, 5)} · {ROLE_LABEL[openFlow.by]}
            {openFlow.note && <div className="mt-1 italic">“{openFlow.note}”</div>}
          </div>
          <Button tone="dark" className="w-full" disabled={!ok} onClick={() => setOpenFlow(false, role)}>
            Restore QR checks
          </Button>
        </div>
      ) : confirming ? (
        <div className="mt-3 space-y-2">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason / instruction (logged)" className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <Button tone="secondary" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button
              tone="danger"
              onClick={() => {
                setOpenFlow(true, role, note);
                setConfirming(false);
                setNote("");
              }}
            >
              Confirm OPEN-FLOW
            </Button>
          </div>
        </div>
      ) : (
        <Button tone="danger" size="lg" className="mt-3 w-full" disabled={!ok} onClick={() => setConfirming(true)}>
          Activate Open-Flow
        </Button>
      )}
      {!ok && <NoPerm perm="openFlow" />}
    </Card>
  );
}

function ConfigCard({ role, cfg }: { role: Role; cfg: OpsConfig }) {
  const setConfig = useTemple((s) => s.setConfig);
  const [draft, setDraft] = useState(cfg);
  const ok = can(role, "configure");
  const dirty = JSON.stringify(draft) !== JSON.stringify(cfg);
  const field = (k: keyof OpsConfig, label: string, opts: number[]) => (
    <label className="flex items-center justify-between gap-2 text-sm">
      <span>{label}</span>
      <select disabled={!ok} value={draft[k] as number} onChange={(e) => setDraft({ ...draft, [k]: Number(e.target.value) })} className="rounded-lg border border-stone-300 px-2 py-1">
        {opts.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <Card className="p-4">
      <h2 className="font-bold">⚙️ Capacity &amp; cadence</h2>
      <div className="mt-3 space-y-2">
        {field("batchSize", "Devotees per batch", [50, 60, 80, 100, 120, 150])}
        {field("intervalMin", "Release interval (min)", [5, 10, 15, 20])}
        {field("reportLeadMin", "Report before batch (min)", [10, 15, 20, 30])}
        {field("lateGraceMin", "Late grace at gate (min)", [15, 30, 45, 60])}
        {field("maxGroupSize", "Max group per pass", [4, 5, 6, 8])}
        {field("offlineMaxAgeMin", "Offline list max age (min)", [10, 15, 30, 60])}
      </div>
      <div className="mt-3 rounded-lg bg-stone-50 p-2 text-sm">
        = <b>{Math.round((60 / draft.intervalMin) * draft.batchSize)}</b> devotees / hour on the digital lane
      </div>
      <Note>Pilot cap “≈{cfg.pilotCapPct}%” is not yet defined (footfall vs lane vs allocation) — BRD 8.3. Do not set production capacity until agreed.</Note>
      <Button className="mt-3 w-full" disabled={!ok || !dirty} onClick={() => setConfig(draft, role)}>
        Save (audit-logged)
      </Button>
      {!ok && <NoPerm perm="configure" />}
    </Card>
  );
}

function Atithi({ role }: { role: Role }) {
  const passes = useTemple((s) => s.passes);
  const cfg = useTemple((s) => s.config);
  const createPass = useTemple((s) => s.createPass);
  const cancelPass = useTemple((s) => s.cancelPass);
  const log = useTemple((s) => s.log);
  const ok = can(role, "guestPass");
  const [f, setF] = useState({ name: "", mobile: "", group: 2, time: "18:30", purpose: "Donor family darshan", expiry: "22:00" });
  const [show, setShow] = useState<string | null>(null);
  const guests = passes.filter((p) => p.channel === "guest").sort((a, b) => b.createdAt - a.createdAt);
  const shown = guests.find((g) => g.id === show);

  return (
    <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
      <Card className="space-y-3 p-4">
        <h2 className="font-bold">Issue Mandal Atithi pass</h2>
        <p className="text-xs text-stone-500">Official guest passes for named visitors — role-restricted, time-bound and audit-logged (BRD B-06). Not counted against devotee batch capacity.</p>
        {[
          ["name", "Guest name"],
          ["mobile", "Mobile (optional)"],
          ["purpose", "Purpose"],
        ].map(([k, l]) => (
          <label key={k} className="block text-sm">
            <span className="font-semibold">{l}</span>
            <input disabled={!ok} value={f[k as "name"]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" />
          </label>
        ))}
        <div className="grid grid-cols-3 gap-2 text-sm">
          <label>
            <span className="font-semibold">Persons</span>
            <input disabled={!ok} type="number" min={1} max={15} value={f.group} onChange={(e) => setF({ ...f, group: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-stone-300 px-2 py-2" />
          </label>
          <label>
            <span className="font-semibold">Entry</span>
            <input disabled={!ok} type="time" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} className="mt-1 w-full rounded-lg border border-stone-300 px-2 py-2" />
          </label>
          <label>
            <span className="font-semibold">Expires</span>
            <input disabled={!ok} type="time" value={f.expiry} onChange={(e) => setF({ ...f, expiry: e.target.value })} className="mt-1 w-full rounded-lg border border-stone-300 px-2 py-2" />
          </label>
        </div>
        <Button
          className="w-full"
          disabled={!ok || f.name.trim().length < 2}
          onClick={async () => {
            const r = await createPass({
              name: f.name,
              mobile: f.mobile.replace(/\D/g, ""),
              groupSize: f.group,
              date: ymd(),
              batchTime: f.time,
              channel: "guest",
              lang: "hi",
              issuedBy: ROLE_LABEL[role],
              guest: { purpose: f.purpose, expiresAt: at(ymd(), f.expiry) },
            });
            if (r.ok) {
              log(role, "Atithi guest pass issued", `${r.pass.id} · ${r.pass.name} · ${r.pass.groupSize} persons · ${f.purpose} · expires ${f.expiry}`);
              setShow(r.pass.id);
              setF({ ...f, name: "", mobile: "" });
            }
          }}
        >
          Issue guest pass
        </Button>
        {!ok && <NoPerm perm="guestPass" />}
      </Card>
      <div className="space-y-4">
        {shown && (
          <div className="max-w-md">
            <PassCard pass={shown} cfg={cfg} lang="en" />
          </div>
        )}
        <Card className="overflow-x-auto p-4">
          <h2 className="mb-2 font-bold">Guest passes</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-stone-500">
              <tr>
                <th className="py-1">Pass</th>
                <th>Guest</th>
                <th>Purpose</th>
                <th>Entry</th>
                <th>Issued by</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {guests.map((g) => (
                <tr key={g.id}>
                  <td className="py-1.5 font-mono">
                    <button className="underline" onClick={() => setShow(g.id)}>
                      {g.id}
                    </button>
                  </td>
                  <td>
                    {g.name} · {g.groupSize}
                  </td>
                  <td>{g.guest?.purpose}</td>
                  <td>{fmtTime(g.batchTime, "en")}</td>
                  <td className="text-xs">{g.issuedBy}</td>
                  <td>
                    <Badge tone={g.status === "active" ? "green" : g.status === "used" ? "stone" : "red"}>{g.status}</Badge>
                  </td>
                  <td>
                    {g.status === "active" && ok && (
                      <button
                        className="text-xs text-red-700 underline"
                        onClick={() => {
                          cancelPass(g.id);
                          log(role, "Atithi guest pass revoked", g.id);
                        }}
                      >
                        revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

function Audit() {
  const audit = useTemple((s) => s.audit);
  const passes = useTemple((s) => s.passes);
  const events = useTemple((s) => s.gateEvents);
  const today = ymd();
  const t = passes.filter((p) => p.date === today && p.status !== "rescheduled");
  const by = (c: string) => t.filter((p) => p.channel === c).length;
  const todaysEvents = events.filter((e) => new Date(e.at).toDateString() === new Date().toDateString());
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <Card className="p-4">
        <h2 className="mb-3 font-bold">Time-stamped operator actions</h2>
        <ul className="divide-y divide-stone-100">
          {audit.map((a) => (
            <li key={a.id} className="grid grid-cols-[70px_1fr] gap-3 py-2 text-sm">
              <span className="font-mono text-xs text-stone-500">{fmtClock(a.at)}</span>
              <div>
                <div className="font-semibold">{a.action}</div>
                <div className="text-xs text-stone-500">
                  {ROLE_LABEL[a.role]} · {a.detail}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Card>
      <Card className="h-fit p-4">
        <h2 className="mb-3 font-bold">Daily operational summary</h2>
        <dl className="space-y-1.5 text-sm">
          {[
            ["Passes issued (today)", t.length],
            ["· via WhatsApp", by("whatsapp")],
            ["· via Sahayata Kendra", by("kendra")],
            ["· via web / PWA", by("pwa")],
            ["· Mandal Atithi", by("guest")],
            ["Redeemed at gate", t.filter((p) => p.status === "used").length],
            ["Cancelled", t.filter((p) => p.status === "cancelled").length],
            ["Ritual-delayed passes", t.filter((p) => p.delayMin > 0).length],
            ["Duplicate scans", todaysEvents.filter((e) => e.result === "duplicate").length],
            ["Offline scans", todaysEvents.filter((e) => e.offline).length],
            ["Open-Flow visual entries", todaysEvents.filter((e) => e.result === "openflow-bypass").length],
          ].map(([k, v]) => (
            <div key={k as string} className="flex justify-between">
              <dt className="text-stone-600">{k}</dt>
              <dd className="font-semibold tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-stone-500">End-of-day reconciliation of issued vs redeemed passes and exceptions (BRD 6.1).</p>
      </Card>
    </div>
  );
}
