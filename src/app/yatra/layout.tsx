import type { Metadata } from "next";
import { ClientOnly } from "@/components/ClientOnly";
import { DemoBar } from "@/components/ui";
import { YatraShell } from "./shell";

// Browser-storage prototype: pages render client-side only.
export const instant = false;

export const metadata: Metadata = { title: "Yatra Saathi — stays & meals near Mandaphia" };

export default function YatraLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DemoBar label="Yatra Companion marketplace (separate commercial domain)" />
      <ClientOnly>
        <YatraShell>{children}</YatraShell>
      </ClientOnly>
    </>
  );
}
