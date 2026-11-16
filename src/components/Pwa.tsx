"use client";
import { useEffect, useState } from "react";
import { create } from "zustand";
import { BASE } from "@/lib/base-path";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** Holds the browser's deferred install prompt (Chrome / Edge / Android). */
const useInstall = create<{ evt: BeforeInstallPromptEvent | null; installed: boolean }>(() => ({ evt: null, installed: false }));

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    useInstall.setState({ evt: e as BeforeInstallPromptEvent });
  });
  window.addEventListener("appinstalled", () => useInstall.setState({ evt: null, installed: true }));
}

/** Registers the service worker in production builds (dev keeps HMR untouched). */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register(`${BASE}/sw.js`, { scope: `${BASE}/` }).catch(() => {});
  }, []);
  return null;
}

const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);

const isIos = () => typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);

/**
 * "Install app" button: uses the native prompt where the browser offers one; on iPhone
 * (Safari has no prompt) it shows the Share → Add to Home Screen steps instead.
 */
export function InstallButton({ label, iosHelp }: { label: string; iosHelp: string }) {
  const evt = useInstall((s) => s.evt);
  const installed = useInstall((s) => s.installed);
  const [showHelp, setShowHelp] = useState(false);
  const [standalone] = useState(isStandalone);
  const [ios] = useState(isIos);

  if (standalone || installed || (!evt && !ios)) return null;
  return (
    <div className="relative">
      <button
        onClick={async () => {
          if (evt) {
            await evt.prompt();
            await evt.userChoice;
            useInstall.setState({ evt: null });
          } else setShowHelp((v) => !v);
        }}
        className="rounded-lg bg-amber-300 px-2.5 py-1.5 text-xs font-bold text-mandir"
      >
        ⬇ {label}
      </button>
      {showHelp && (
        <div className="absolute right-0 top-10 z-20 w-64 rounded-xl bg-white p-3 text-sm text-stone-800 shadow-lg ring-1 ring-stone-200">{iosHelp}</div>
      )}
    </div>
  );
}
