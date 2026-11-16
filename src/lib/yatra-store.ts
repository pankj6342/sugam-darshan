"use client";
/**
 * Commercial-domain store (Yatra Companion). Deliberately a separate persisted store:
 * it never reads the temple store. The only data that crosses is what the devotee
 * explicitly chooses to share on the consent screen (BRD C-02, NFR-02).
 */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { listingById } from "./yatra-data";
import { shortId } from "./token";
import type { Voucher, YatraConsent } from "./types";

interface YatraState {
  seeded: boolean;
  consent: YatraConsent | null;
  consents: YatraConsent[]; // all opt-ins (aggregate attribution for KPI)
  profile: { name: string; mobile: string };
  vouchers: Voucher[];
  partnerId: string; // logged-in partner (partner portal)

  giveConsent: (c: Omit<YatraConsent, "at">, profile: { name: string; mobile: string }) => void;
  withdrawConsent: () => void;
  book: (v: Omit<Voucher, "id" | "createdAt" | "status" | "upiRef">) => Voucher;
  cancel: (id: string) => void;
  redeem: (id: string, finalBill: number, txnRef: string) => "ok" | "already" | "not-found" | "cancelled";
  settle: (listingId: string) => void;
  setPartner: (id: string) => void;
  _replace: (s: Partial<YatraState>) => void;
}

export const useYatra = create<YatraState>()(
  persist(
    (set, get) => ({
      seeded: false,
      consent: null,
      consents: [],
      profile: { name: "", mobile: "" },
      vouchers: [],
      partnerId: "ea-01",

      giveConsent(c, profile) {
        const rec = { ...c, at: Date.now() };
        set({ consent: rec, consents: [...get().consents, rec], profile });
      },
      withdrawConsent() {
        set({ consent: null, profile: { name: "", mobile: "" } });
      },
      book(v) {
        const voucher: Voucher = {
          ...v,
          id: shortId("YV", 6),
          createdAt: Date.now(),
          status: "confirmed",
          upiRef: v.advancePaid > 0 ? `UPI${Math.floor(1e11 + Math.random() * 9e11)}` : undefined,
        };
        set({ vouchers: [voucher, ...get().vouchers] });
        return voucher;
      },
      cancel(id) {
        set({
          vouchers: get().vouchers.map((v) => (v.id === id && v.status === "confirmed" ? { ...v, status: v.advancePaid ? "refunded" : "cancelled" } : v)),
        });
      },
      redeem(id, finalBill, txnRef) {
        const v = get().vouchers.find((x) => x.id === id);
        if (!v) return "not-found";
        if (v.status === "redeemed") return "already";
        if (v.status !== "confirmed") return "cancelled";
        set({ vouchers: get().vouchers.map((x) => (x.id === id ? { ...x, status: "redeemed", finalBill, txnRef, redeemedAt: Date.now() } : x)) });
        return "ok";
      },
      settle(listingId) {
        set({ vouchers: get().vouchers.map((v) => (v.listingId === listingId && v.status === "redeemed" ? { ...v, settled: true } : v)) });
      },
      setPartner(id) {
        set({ partnerId: id });
      },
      _replace(s) {
        set(s);
      },
    }),
    { name: "sd-yatra-v1", storage: createJSONStorage(() => localStorage) },
  ),
);

export function commissionOf(v: Voucher): number {
  const l = listingById(v.listingId);
  if (!l || v.status !== "redeemed") return 0;
  return ((v.finalBill ?? v.estTotal) * l.commissionPct) / 100;
}
