"use client";
import { QR } from "./QR";
import { Emblem } from "./Emblem";
import { effectiveBatch, reportTime } from "@/lib/slots";
import { fmtDate, fmtTime } from "@/lib/time";
import { tr } from "@/lib/i18n";
import type { Lang, OpsConfig, Pass } from "@/lib/types";

/** Mandal-branded pass. Contains ONLY Mandal identity — no partner logos or ads (BRD A-01). */
export function PassCard({ pass, cfg, lang, compact = false }: { pass: Pass; cfg: OpsConfig; lang: Lang; compact?: boolean }) {
  const dim = pass.status !== "active";
  const isGuest = pass.channel === "guest";
  return (
    <div className={`overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-saffron-200 ${dim ? "opacity-60" : ""}`}>
      <div className="flex items-center gap-3 bg-mandir px-4 py-3 text-white">
        <Emblem size={compact ? 30 : 38} />
        <div className="min-w-0 leading-tight">
          <div className={`font-bold ${compact ? "text-sm" : ""}`}>{tr("mandal", lang)}</div>
          <div className="text-xs text-amber-200">
            {isGuest ? tr("guestPass", lang) : `${tr("sugam", lang)} · ${tr("free", lang)}`}
          </div>
        </div>
      </div>
      <div className={`flex ${compact ? "gap-3 p-3" : "flex-col items-center gap-4 p-5 sm:flex-row sm:items-start"}`}>
        <div className="rounded-xl p-1.5 ring-1 ring-stone-200">
          <QR value={pass.token} size={compact ? 108 : 176} />
        </div>
        <dl className={`grid flex-1 gap-y-1.5 ${compact ? "text-xs" : "w-full text-sm"}`}>
          <div>
            <dt className="text-stone-500">{tr("passNo", lang)}</dt>
            <dd className={`font-mono font-bold tracking-wider ${compact ? "text-sm" : "text-xl"}`}>{pass.id}</dd>
          </div>
          <div className="flex gap-4">
            <div>
              <dt className="text-stone-500">{tr("lblName", lang)}</dt>
              <dd className="font-semibold">{pass.name}</dd>
            </div>
            <div>
              <dt className="text-stone-500">{tr("lblGroup", lang)}</dt>
              <dd className="font-semibold">
                {pass.groupSize} {tr("persons", lang)}
              </dd>
            </div>
          </div>
          <div>
            <dt className="text-stone-500">{tr("lblDate", lang)}</dt>
            <dd className="font-semibold">{fmtDate(pass.date, lang)}</dd>
          </div>
          <div className="rounded-lg bg-saffron-50 px-2.5 py-1.5 ring-1 ring-saffron-200">
            <dt className="text-saffron-800">{tr("reportAt", lang)}</dt>
            <dd className={`font-bold text-saffron-900 ${compact ? "" : "text-2xl"}`}>
              {fmtTime(reportTime(pass, cfg), lang)}
              {pass.delayMin > 0 && <span className="ml-2 align-middle text-xs font-semibold text-red-700">({tr("delayed", lang)})</span>}
            </dd>
            {!compact && (
              <div className="text-xs text-saffron-800">
                {tr("batchAt", lang)}: {fmtTime(effectiveBatch(pass), lang)}
              </div>
            )}
          </div>
          {!compact && (
            <div>
              <dt className="text-stone-500">{tr("where", lang)}</dt>
              <dd>{tr("reportingPoint", lang)}</dd>
            </div>
          )}
        </dl>
      </div>
      {!compact && (
        <div className="border-t border-dashed border-stone-300 bg-stone-50 px-4 py-2 text-center text-xs text-stone-600">{tr("officialOnly", lang)}</div>
      )}
    </div>
  );
}
