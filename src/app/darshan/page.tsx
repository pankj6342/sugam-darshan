"use client";
import Link from "next/link";
import { useTick } from "@/components/ClientOnly";
import { Badge, Card, Note } from "@/components/ui";
import { AARTI_SCHEDULE } from "@/lib/config";
import { useT } from "@/lib/i18n";
import { reportTime } from "@/lib/slots";
import { useTemple } from "@/lib/temple-store";
import { crowdLevel } from "@/lib/telemetry";
import { fmtDate, fmtTime, hmToMin, nowMin, ymd } from "@/lib/time";
import { useMyPasses } from "./shell";

export default function DarshanHome() {
  useTick(30000);
  const { t, lang } = useT();
  const passes = useTemple((s) => s.passes);
  const cfg = useTemple((s) => s.config);
  const outage = useTemple((s) => s.telemetryOutage);
  const ids = useMyPasses((s) => s.ids);
  const mine = passes.filter((p) => ids.includes(p.id) && p.status === "active" && p.date >= ymd());
  const level = crowdLevel();
  const now = nowMin();

  return (
    <div className="space-y-5">
      <section className="rounded-3xl bg-gradient-to-br from-saffron-500 to-mandir p-6 text-white shadow-lg">
        <div className="text-sm font-semibold text-amber-200">{t("jai")}</div>
        <h1 className="mt-2 text-3xl font-extrabold leading-tight">{t("sugam")}</h1>
        <p className="mt-1 text-amber-50">{t("tagline")}</p>
        <Link
          href="/darshan/book"
          className="mt-5 flex w-full items-center justify-center rounded-2xl bg-white px-5 py-4 text-lg font-bold text-mandir shadow active:scale-[0.99]"
        >
          {t("bookCta")} →
        </Link>
        <p className="mt-3 text-xs text-amber-100">{t("generalAlways")}</p>
      </section>

      {mine.length > 0 && (
        <Card className="p-4">
          <h2 className="mb-2 font-bold">{t("myPasses")}</h2>
          <ul className="divide-y divide-stone-100">
            {mine.map((p) => (
              <li key={p.id}>
                <Link href={`/darshan/pass?id=${p.id}`} className="flex items-center justify-between py-2.5">
                  <span>
                    <span className="font-mono font-bold">{p.id}</span>
                    <span className="ml-2 text-sm text-stone-600">{fmtDate(p.date, lang, { short: true })}</span>
                  </span>
                  <span className="text-sm font-semibold text-saffron-700">{fmtTime(reportTime(p, cfg), lang)} →</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="flex items-center justify-between p-4">
        <div>
          <div className="text-sm text-stone-500">{t("crowdNow")}</div>
          <div className="text-xl font-bold">
            {outage ? t("unavailable") : t(`crowd_${level}`)}
          </div>
        </div>
        <Badge tone={outage ? "stone" : level === "high" ? "red" : level === "medium" ? "amber" : "green"}>{outage ? "—" : t("estimated")}</Badge>
      </Card>

      <Card className="p-4">
        <h2 className="font-bold">🪔 {t("aarti")}</h2>
        <ul className="mt-2 space-y-1.5">
          {AARTI_SCHEDULE.map((a) => {
            const past = hmToMin(a.time) < now;
            return (
              <li key={a.time} className={`flex justify-between gap-3 text-sm ${past ? "text-stone-400" : ""}`}>
                <span>{a[lang]}</span>
                <span className="shrink-0 font-semibold">{fmtTime(a.time, lang)}</span>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-xs text-stone-500">{t("aartiNote")}</p>
      </Card>

      <Card className="p-4">
        <h2 className="font-bold">{t("howItWorks")}</h2>
        <ol className="mt-2 space-y-2 text-[15px]">
          {(["how1", "how2", "how3"] as const).map((k, i) => (
            <li key={k} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-saffron-100 font-bold text-saffron-800">{i + 1}</span>
              <span className="pt-0.5">{t(k)}</span>
            </li>
          ))}
        </ol>
      </Card>

      <Note tone="stone">
        📱 {t("whatsappAlt")}
        <br />
        🧾 {t("noPhone")}
      </Note>
      <p className="text-center text-xs text-stone-400">{fmtDate(ymd(), lang)}</p>
    </div>
  );
}
