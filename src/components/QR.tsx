"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QR({ value, size = 180, className = "" }: { value: string; size?: number; className?: string }) {
  const [svg, setSvg] = useState("");
  useEffect(() => {
    let live = true;
    QRCode.toString(value, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#1c1917", light: "#ffffff" } }).then((s) => {
      if (live) setSvg(s);
    });
    return () => {
      live = false;
    };
  }, [value]);
  return (
    <div
      className={`bg-white [&>svg]:h-full [&>svg]:w-full ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label="QR code"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
