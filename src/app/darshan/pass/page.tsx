"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PassCard } from "@/components/PassCard";
import { YatraMark } from "@/components/Emblem";
import { Button, Note } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { useTemple } from "@/lib/temple-store";

export default function PassPage() {
  const { t, lang } = useT();
  const sp = useSearchParams();
  const router = useRouter();
  const id = sp.get("id");
  const isNew = sp.get("new") === "1";
  const pass = useTemple((s) => s.passes.find((p) => p.id === id));
  const cfg = useTemple((s) => s.config);
  const pause = useTemple((s) => s.pause);
  const cancelPass = useTemple((s) => s.cancelPass);

  if (!pass) return <Note tone="red">Pass not found.</Note>;

  return (
    <div className="space-y-4">
      {isNew && pass.status === "active" && (
        <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-center font-bold text-emerald-800 ring-1 ring-emerald-200">✅ {t("passReady")}</div>
      )}
      {pass.status === "cancelled" && <Note tone="red">{t("cancelled")}</Note>}
      {pass.status === "used" && <Note tone="green">{t("used")}</Note>}
      {pass.status === "rescheduled" && (
        <Note>
          {t("rescheduled")}:{" "}
          <Link className="font-mono font-bold underline" href={`/darshan/pass?id=${pass.rescheduledTo}`}>
            {pass.rescheduledTo}
          </Link>
        </Note>
      )}

      <PassCard pass={pass} cfg={cfg} lang={lang} />

      {pass.status === "active" && (
        <>
          {(pause?.active || pass.delayMin > 0) && <Note>🪔 {t("paused")}</Note>}
          <p className="text-center text-sm text-stone-600">
            {t("showAtGate")}
            <br />
            {t("reminderNote")}
          </p>
          <div className="grid grid-cols-2 gap-3 print:hidden">
            <Button tone="secondary" onClick={() => router.push(`/darshan/book?reschedule=${pass.id}`)}>
              {t("reschedule")}
            </Button>
            <Button
              tone="secondary"
              className="text-red-700"
              onClick={() => {
                if (confirm(t("cancelConfirm"))) cancelPass(pass.id);
              }}
            >
              {t("cancel")}
            </Button>
          </div>
          <Button tone="ghost" className="w-full print:hidden" onClick={() => window.print()}>
            🖨️ {t("print")}
          </Button>

          {/*
            BRD C-01 / C-02: the commercial invitation appears only AFTER a free pass exists,
            is visually separate from the Mandal pass, and requires an explicit tap. Nothing is
            pre-selected and no temple data is passed along with the link.
          */}
          <div className="pt-4 print:hidden">
            <div className="mb-3 flex items-center gap-3 text-xs text-stone-400">
              <div className="h-px flex-1 bg-stone-300" />
              {t("optDivider")}
              <div className="h-px flex-1 bg-stone-300" />
            </div>
            <div className="rounded-2xl bg-teal-50 p-4 ring-1 ring-teal-200">
              <div className="flex items-start gap-3">
                <YatraMark size={40} />
                <div className="text-sm text-teal-950">
                  <div className="font-bold">{t("yatraTitle")}</div>
                  <p className="mt-1">
                    {t("yatraBody")}
                  </p>
                </div>
              </div>
              <Link
                href={`/yatra?src=pwa&d=${pass.date}`}
                className="mt-3 block rounded-xl bg-white px-4 py-2.5 text-center text-sm font-semibold text-teal-800 ring-1 ring-teal-300 hover:bg-teal-100"
              >
                {t("yatraCta")}
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
