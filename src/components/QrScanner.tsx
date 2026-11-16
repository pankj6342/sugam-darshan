"use client";
import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

/** Minimal camera QR scanner (getUserMedia + jsQR). Calls onScan once per distinct code. */
export function QrScanner({ onScan, active }: { onScan: (text: string) => void; active: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const last = useRef<{ text: string; at: number } | null>(null);
  const cb = useRef(onScan);
  useEffect(() => {
    cb.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!active) return;
    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        if (stopped || !video.current) return;
        video.current.srcObject = stream;
        await video.current.play();
        const tick = () => {
          const v = video.current;
          const c = canvas.current;
          if (!v || !c || stopped) return;
          if (v.readyState === v.HAVE_ENOUGH_DATA) {
            c.width = v.videoWidth;
            c.height = v.videoHeight;
            const ctx = c.getContext("2d", { willReadFrequently: true })!;
            ctx.drawImage(v, 0, 0);
            const img = ctx.getImageData(0, 0, c.width, c.height);
            const code = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
            if (code?.data) {
              const now = Date.now();
              if (!last.current || last.current.text !== code.data || now - last.current.at > 4000) {
                last.current = { text: code.data, at: now };
                cb.current(code.data);
              }
            }
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Camera unavailable");
      }
    })();
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [active]);

  if (!active) return null;
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-black">
      {err ? (
        <div className="flex h-full items-center justify-center p-4 text-center text-sm text-stone-300">
          Camera not available ({err}). Use the demo pass list or paste a token below.
        </div>
      ) : (
        <>
          <video ref={video} className="h-full w-full object-cover" playsInline muted />
          <div className="pointer-events-none absolute inset-[18%] rounded-lg border-4 border-white/80" />
        </>
      )}
      <canvas ref={canvas} className="hidden" />
    </div>
  );
}
