"use client";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { ensureSeeded } from "@/lib/seed";
import { useTemple } from "@/lib/temple-store";
import { useYatra } from "@/lib/yatra-store";

/** Rehydrate stores when another tab writes, so the demo stays in sync across screens. */
function useCrossTabSync() {
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "sd-temple-v1") useTemple.persist.rehydrate();
      if (e.key === "sd-yatra-v1") useYatra.persist.rehydrate();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
}

const noop = () => () => {};
/** false during server prerender / hydration, true once running in the browser. */
const useMounted = () => useSyncExternalStore(noop, () => true, () => false);

function Boot({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(() => useTemple.getState().seeded && useYatra.getState().seeded);
  useCrossTabSync();
  useEffect(() => {
    if (!ready) ensureSeeded().then(() => setReady(true));
  }, [ready]);
  if (!ready) return <Loading />;
  return <>{children}</>;
}

function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center text-sm text-stone-500">
      <span className="animate-pulse">लोड हो रहा है… · Loading…</span>
    </div>
  );
}

/** Prototype state lives in this browser's storage, so screens render only in the browser. */
export function ClientOnly({ children }: { children: ReactNode }) {
  const mounted = useMounted();
  return mounted ? <Boot>{children}</Boot> : <Loading />;
}

/** Current time, refreshed every `ms` (for clocks / countdowns / simulated telemetry). */
export function useTick(ms = 1000) {
  const [now, set] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => set(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}
