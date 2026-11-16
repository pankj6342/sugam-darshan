import type { Metadata } from "next";
import { ClientOnly } from "@/components/ClientOnly";
import { DemoBar } from "@/components/ui";
import { PartnerPortal } from "./portal";

export const metadata: Metadata = { title: "Partner portal — Yatra Saathi" };

export default function Page() {
  return (
    <>
      <DemoBar label="Hospitality partner portal & commission ledger" />
      <ClientOnly>
        <PartnerPortal />
      </ClientOnly>
    </>
  );
}
