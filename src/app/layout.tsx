import type { Metadata, Viewport } from "next";
import { Noto_Sans, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import { BASE } from "@/lib/base-path";

const noto = Noto_Sans({ variable: "--font-noto", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const deva = Noto_Sans_Devanagari({ variable: "--font-deva", subsets: ["devanagari"], weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "Sugam Darshan — Prototype",
  description: "Clickable prototype: Shri Sanwaliya Seth Sugam Darshan & Yatra Companion",
  applicationName: "Sugam Darshan",
  manifest: `${BASE}/manifest.webmanifest`,
};

export const viewport: Viewport = {
  themeColor: "#7c2d12",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hi" className={`${noto.variable} ${deva.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
