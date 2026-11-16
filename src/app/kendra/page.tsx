import type { Metadata } from "next";
import { ClientOnly } from "@/components/ClientOnly";
import { DemoBar } from "@/components/ui";
import { Kendra } from "./kendra";

export const metadata: Metadata = { title: "Sahayata Kendra — Sugam Darshan" };

export default function Page() {
  return (
    <>
      <DemoBar label="Sahayata Kendra volunteer tablet" />
      <ClientOnly>
        <Kendra />
      </ClientOnly>
    </>
  );
}
