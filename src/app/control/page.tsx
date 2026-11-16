import type { Metadata } from "next";
import { ClientOnly } from "@/components/ClientOnly";
import { DemoBar } from "@/components/ui";
import { ControlRoom } from "./control";

export const metadata: Metadata = { title: "Control room — Sugam Darshan" };

export default function Page() {
  return (
    <>
      <DemoBar label="Mandal control room" />
      <ClientOnly>
        <ControlRoom />
      </ClientOnly>
    </>
  );
}
