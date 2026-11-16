"use client";
import { useState } from "react";
import { seedDemo } from "@/lib/seed";

export function ResetDemo() {
  const [busy, setBusy] = useState(false);
  return (
    <button
      disabled={busy}
      onClick={async () => {
        if (!confirm("Reset all demo data (passes, chats, vouchers) to a fresh seeded state?")) return;
        setBusy(true);
        await seedDemo();
        try {
          localStorage.removeItem("sd-my-passes");
          sessionStorage.removeItem("sd-gate-device-v1");
        } catch {}
        setBusy(false);
        alert("Demo data reset. Reload any other open tabs.");
      }}
      className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-300 ring-1 ring-slate-600 hover:bg-slate-800"
    >
      {busy ? "Resetting…" : "↺ Reset demo data"}
    </button>
  );
}
