import type { Metadata } from "next";
import { ClientOnly } from "@/components/ClientOnly";
import { DemoBar } from "@/components/ui";
import { WhatsAppSim } from "./sim";

export const metadata: Metadata = { title: "WhatsApp simulator — Sugam Darshan" };

export default function Page() {
  return (
    <>
      <DemoBar label="Hindi WhatsApp bot (simulated)" />
      <ClientOnly>
        <WhatsAppSim />
      </ClientOnly>
    </>
  );
}
