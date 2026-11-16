"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Emblem } from "@/components/Emblem";
import { useT, useLang } from "@/lib/i18n";
import { useTemple } from "@/lib/temple-store";

/** Pass ids created on this device ("My passes"). */
export const useMyPasses = create<{ ids: string[]; add: (id: string) => void }>()(
  persist((set, get) => ({ ids: [], add: (id) => set({ ids: [id, ...get().ids.filter((x) => x !== id)] }) }), { name: "sd-my-passes" }),
);

export function MandirShell({ children }: { children: ReactNode }) {
  const { t, lang } = useT();
  const setLang = useLang((s) => s.setLang);
  const openFlow = useTemple((s) => s.openFlow);
  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col bg-cream">
      <header className="sticky top-0 z-10 bg-mandir text-white shadow print:hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/darshan" className="flex min-w-0 flex-1 items-center gap-3">
            <Emblem size={42} />
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[15px] font-bold">{t("mandal")}</div>
              <div className="text-xs text-amber-200">
                {t("sugam")} · {t("place")}
              </div>
            </div>
          </Link>
          <div className="flex overflow-hidden rounded-lg ring-1 ring-amber-200/60" role="group" aria-label="Language">
            {(["hi", "en"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2.5 py-1.5 text-xs font-bold ${lang === l ? "bg-amber-300 text-mandir" : "text-amber-100"}`}
                aria-pressed={lang === l}
              >
                {l === "hi" ? "हिं" : "EN"}
              </button>
            ))}
          </div>
        </div>
      </header>
      {openFlow?.active && <div className="bg-red-700 px-4 py-2.5 text-sm font-semibold text-white">⚠️ {t("openFlow")}</div>}
      <main className="flex-1 px-4 py-5">{children}</main>
      <footer className="px-4 pb-6 pt-2 text-center text-xs text-stone-500 print:hidden">
        © {t("mandal")} · {lang === "hi" ? "आधिकारिक निःशुल्क सेवा" : "Official free service"}
      </footer>
    </div>
  );
}
