import type { Metadata } from "next";
import { ClientOnly } from "@/components/ClientOnly";
import { DemoBar } from "@/components/ui";
import { MandirShell } from "./shell";

export const metadata: Metadata = {
  title: "सुगम दर्शन — श्री सांवलिया सेठ मंदिर मंडल",
};

export default function DarshanLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DemoBar label="Devotee PWA (Mandal-branded)" />
      <ClientOnly>
        <MandirShell>{children}</MandirShell>
      </ClientOnly>
    </>
  );
}
