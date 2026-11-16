import type { Metadata } from "next";
import { ClientOnly } from "@/components/ClientOnly";
import { DemoBar } from "@/components/ui";
import { KpiReport } from "./report";

export const metadata: Metadata = { title: "Pilot KPI report — Sugam Darshan" };

export default function Page() {
  return (
    <>
      <DemoBar label="Weekly pilot KPI report" />
      <ClientOnly>
        <KpiReport />
      </ClientOnly>
    </>
  );
}
