import type { Metadata } from "next";
import { ClientOnly } from "@/components/ClientOnly";
import { DemoBar } from "@/components/ui";
import { MandirShell } from "./shell";

// Browser-storage prototype: pages render client-side only.
export const instant = false;

export const metadata: Metadata = {
  title: "सुगम दर्शन — श्री सांवलिया सेठ मंदिर मंडल",
  manifest: "/manifest.webmanifest",
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
