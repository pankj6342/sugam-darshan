import type { Metadata, Viewport } from "next";
import { Noto_Sans, Noto_Sans_Devanagari, Noto_Sans_Gujarati } from "next/font/google";
import "./globals.css";
import { ServiceWorker } from "@/components/Pwa";
import { BASE } from "@/lib/base-path";

const noto = Noto_Sans({ variable: "--font-noto", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const deva = Noto_Sans_Devanagari({ variable: "--font-deva", subsets: ["devanagari"], weight: ["400", "500", "600", "700", "800"] });
const guj = Noto_Sans_Gujarati({ variable: "--font-guj", subsets: ["gujarati"], weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "Sugam Darshan — Prototype",
  description: "Clickable prototype: Shri Sanwaliya Seth Sugam Darshan & Yatra Companion",
  applicationName: "Sugam Darshan",
  manifest: `${BASE}/manifest.webmanifest`,
  icons: {
    icon: [
      { url: `${BASE}/icons/icon-192.png`, sizes: "192x192", type: "image/png" },
      { url: `${BASE}/icons/icon.svg`, type: "image/svg+xml" },
    ],
    apple: [{ url: `${BASE}/icons/apple-touch-icon.png`, sizes: "180x180" }],
  },
  appleWebApp: { capable: true, title: "सुगम दर्शन", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#7c2d12",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hi" className={`${noto.variable} ${deva.variable} ${guj.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
