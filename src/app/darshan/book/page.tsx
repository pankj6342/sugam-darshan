"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Button, Card, Note } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { bookableDates, windowsFor } from "@/lib/slots";
import { useTemple } from "@/lib/temple-store";
import { fmtDate, fmtTime, ymd } from "@/lib/time";
import { useMyPasses } from "../shell";

type Step = "day" | "time" | "people" | "details";

export default function BookPage() {
  const { t, lang } = useT();
  const router = useRouter();
  const sp = useSearchParams();
  const rescheduleId = sp.get("reschedule");
  const passes = useTemple((s) => s.passes);
  const cfg = useTemple((s) => s.config);
  const createPass = useTemple((s) => s.createPass);
  const reschedulePass = useTemple((s) => s.reschedulePass);
  const addMine = useMyPasses((s) => s.add);
  const old = rescheduleId ? passes.find((p) => p.id === rescheduleId) : undefined;

  const [step, setStep] = useState<Step>("day");
  const [date, setDate] = useState<string>();
  const [win, setWin] = useState<string>();
  const [people, setPeople] = useState(2);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const DEMO_OTP = "4321";

  const dates = bookableDates(cfg);
  const groupSize = old?.groupSize ?? people;
  const wins = useMemo(() => (date ? windowsFor(date, passes.filter((p) => p.id !== rescheduleId), cfg) : []), [date, passes, cfg, rescheduleId]);

  const steps: Step[] = old ? ["day", "time"] : ["day", "time", "people", "details"];
  const idx = steps.indexOf(step);

  async function finish() {
    setBusy(true);
    setErr(null);
    const r = old
      ? await reschedulePass(old.id, date!, win!)
      : await createPass({ name, mobile, groupSize: people, date: date!, windowStart: win!, channel: "pwa", lang });
    setBusy(false);
    if (!r.ok) {
      setErr(r.error === "duplicate" ? t("dupErr") : t("fullErr"));
      if (r.error === "full") setStep("time");
      return;
    }
    addMine(r.pass.id);
    router.push(`/darshan/pass?id=${r.pass.id}&new=1`);
  }

  const mobileOk = /^[6-9]\d{9}$/.test(mobile);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= idx ? "bg-saffron-500" : "bg-stone-200"}`} />
        ))}
      </div>
      {old && (
        <Note>
          {t("reschedule")}: <b className="font-mono">{old.id}</b> · {old.groupSize} {t("persons")}
        </Note>
      )}
      {err && <Note tone="red">{err}</Note>}

      {step === "day" && (
        <section className="space-y-3">
          <h1 className="text-2xl font-bold">{t("chooseDay")}</h1>
          {dates.map((d) => (
            <button
              key={d}
              onClick={() => {
                setDate(d);
                setStep("time");
              }}
              className={`flex w-full items-center justify-between rounded-2xl bg-white px-5 py-4 text-left text-lg font-semibold ring-2 transition ${date === d ? "ring-saffron-500" : "ring-stone-200 hover:ring-saffron-300"}`}
            >
              <span>
                {d === ymd() && <span className="mr-2 rounded bg-saffron-100 px-2 py-0.5 text-sm text-saffron-800">{t("today")}</span>}
                {fmtDate(d, lang)}
              </span>
              <span className="text-saffron-600">→</span>
            </button>
          ))}
        </section>
      )}

      {step === "time" && date && (
        <section className="space-y-3">
          <h1 className="text-2xl font-bold">{t("chooseTime")}</h1>
          <p className="text-stone-600">{fmtDate(date, lang)}</p>
          <div className="grid grid-cols-2 gap-3">
            {wins.filter((w) => w.open).map((w) => {
              const disabled = !w.open || w.remaining < groupSize;
              return (
                <button
                  key={w.start}
                  disabled={disabled}
                  onClick={() => {
                    setWin(w.start);
                    if (!old) setStep("people");
                  }}
                  className={`rounded-2xl bg-white px-3 py-3.5 text-left ring-2 transition disabled:opacity-40 ${win === w.start ? "ring-saffron-500" : "ring-stone-200 hover:ring-saffron-300"}`}
                >
                  <div className="font-bold">{fmtTime(w.start, lang)}</div>
                  <div className={`text-sm ${disabled ? "text-stone-500" : w.remaining < 80 ? "text-amber-700" : "text-emerald-700"}`}>
                    {!w.open ? t("past") : w.remaining < groupSize ? t("full") : `${w.remaining} ${t("seats")}`}
                  </div>
                </button>
              );
            })}
          </div>
          {old && (
            <Button size="lg" className="w-full" disabled={!win || busy} onClick={finish}>
              {t("reschedule")} ✓
            </Button>
          )}
        </section>
      )}

      {step === "people" && (
        <section className="space-y-4">
          <h1 className="text-2xl font-bold">{t("people")}</h1>
          <p className="text-stone-600">{t("peopleHint")}</p>
          <div className="flex items-center justify-center gap-6 py-4">
            <button aria-label="minus" onClick={() => setPeople(Math.max(1, people - 1))} className="h-16 w-16 rounded-full bg-white text-3xl font-bold ring-2 ring-stone-300">
              −
            </button>
            <div className="w-16 text-center text-5xl font-extrabold tabular-nums">{people}</div>
            <button aria-label="plus" onClick={() => setPeople(Math.min(cfg.maxGroupSize, people + 1))} className="h-16 w-16 rounded-full bg-white text-3xl font-bold ring-2 ring-stone-300">
              +
            </button>
          </div>
          <Button size="lg" className="w-full" onClick={() => setStep("details")}>
            {t("next")} →
          </Button>
        </section>
      )}

      {step === "details" && (
        <section className="space-y-4">
          <h1 className="text-2xl font-bold">{t("details")}</h1>
          <Card className="space-y-4 p-4">
            <label className="block">
              <span className="text-sm font-semibold">{t("name")}</span>
              <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-xl border border-stone-300 px-4 py-3 text-lg" autoComplete="name" />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">{t("mobile")}</span>
              <div className="mt-1 flex gap-2">
                <span className="rounded-xl bg-stone-100 px-3 py-3 text-lg text-stone-600">+91</span>
                <input
                  value={mobile}
                  onChange={(e) => {
                    setMobile(e.target.value.replace(/\D/g, "").slice(0, 10));
                    setOtpSent(false);
                  }}
                  inputMode="numeric"
                  className="w-full rounded-xl border border-stone-300 px-4 py-3 text-lg tracking-wider"
                  autoComplete="tel-national"
                />
              </div>
              <span className="mt-1 block text-xs text-stone-500">{t("mobileWhy")}</span>
            </label>
            {!otpSent ? (
              <Button tone="secondary" className="w-full" disabled={!mobileOk} onClick={() => setOtpSent(true)}>
                {t("sendOtp")}
              </Button>
            ) : (
              <label className="block">
                <span className="text-sm font-semibold">{t("otp")}</span>
                <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" className="mt-1 w-full rounded-xl border border-stone-300 px-4 py-3 text-center text-2xl tracking-[0.5em]" />
                <span className="mt-1 block text-xs text-amber-700">
                  {t("demoOtp")}: {DEMO_OTP}
                </span>
              </label>
            )}
          </Card>
          <Card className="p-4 text-sm">
            <div className="flex justify-between">
              <span>{fmtDate(date!, lang)}</span>
              <b>{fmtTime(win!, lang)}</b>
            </div>
            <div className="mt-1 flex justify-between">
              <span>
                {people} {t("persons")}
              </span>
              <b className="text-emerald-700">{t("free")}</b>
            </div>
          </Card>
          <Button size="lg" className="w-full" disabled={name.trim().length < 2 || !mobileOk || otp !== DEMO_OTP || busy} onClick={finish}>
            {t("confirm")}
          </Button>
        </section>
      )}

      {idx > 0 && (
        <button onClick={() => setStep(steps[idx - 1])} className="w-full py-2 text-center text-stone-600">
          ← {t("back")}
        </button>
      )}
    </div>
  );
}
