import type { Metadata } from "next";
import { ClientOnly } from "@/components/ClientOnly";
import { DemoBar } from "@/components/ui";
import { GateScanner } from "./scanner";

export const metadata: Metadata = { title: "Gate scanner — Sugam Darshan" };

export default function Page() {
  return (
    <>
      <DemoBar label="Gate scanner (each tab = one device)" />
      <ClientOnly>
        <GateScanner />
      </ClientOnly>
    </>
  );
}
