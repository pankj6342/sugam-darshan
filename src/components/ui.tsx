import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

type Tone = "primary" | "secondary" | "danger" | "ghost" | "success" | "teal" | "dark";

const TONES: Record<Tone, string> = {
  primary: "bg-saffron-600 text-white hover:bg-saffron-700 disabled:bg-saffron-300",
  secondary: "bg-white text-stone-800 ring-1 ring-stone-300 hover:bg-stone-50 disabled:text-stone-400",
  danger: "bg-red-700 text-white hover:bg-red-800 disabled:bg-red-300",
  ghost: "text-stone-700 hover:bg-stone-100",
  success: "bg-emerald-700 text-white hover:bg-emerald-800 disabled:bg-emerald-300",
  teal: "bg-teal-700 text-white hover:bg-teal-800 disabled:bg-teal-300",
  dark: "bg-slate-800 text-white hover:bg-slate-900 disabled:bg-slate-400",
};

export function Button({
  tone = "primary",
  size = "md",
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone; size?: "sm" | "md" | "lg" | "xl" }) {
  const sz = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2.5", lg: "px-5 py-3.5 text-lg", xl: "px-6 py-5 text-xl" }[size];
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:cursor-not-allowed ${sz} ${TONES[tone]} ${className}`}
    />
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl bg-white shadow-sm ring-1 ring-stone-200 ${className}`}>{children}</div>;
}

export function Badge({ children, tone = "stone", className = "" }: { children: ReactNode; tone?: "stone" | "green" | "amber" | "red" | "teal" | "blue" | "saffron"; className?: string }) {
  const t = {
    stone: "bg-stone-100 text-stone-700",
    green: "bg-emerald-100 text-emerald-800",
    amber: "bg-amber-100 text-amber-900",
    red: "bg-red-100 text-red-800",
    teal: "bg-teal-100 text-teal-800",
    blue: "bg-sky-100 text-sky-800",
    saffron: "bg-saffron-100 text-saffron-800",
  }[tone];
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${t} ${className}`}>{children}</span>;
}

export function Note({ children, tone = "amber" }: { children: ReactNode; tone?: "amber" | "green" | "red" | "stone" }) {
  const t = {
    amber: "bg-amber-50 text-amber-900 ring-amber-200",
    green: "bg-emerald-50 text-emerald-900 ring-emerald-200",
    red: "bg-red-50 text-red-900 ring-red-200",
    stone: "bg-stone-50 text-stone-700 ring-stone-200",
  }[tone];
  return <div className={`rounded-xl px-4 py-3 text-sm ring-1 ${t}`}>{children}</div>;
}

/** Small strip shown on every screen so viewers know this is a prototype and can jump around. */
export function DemoBar({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 bg-slate-900 px-4 py-1.5 text-[11px] text-slate-300 print:hidden">
      <span className="truncate">
        PROTOTYPE · {label} · sample data only
      </span>
      <Link href="/" className="shrink-0 font-semibold text-amber-300 hover:text-amber-200">
        ← Demo console
      </Link>
    </div>
  );
}

export function Stat({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: "red" | "amber" | "green" }) {
  const c = tone === "red" ? "text-red-700" : tone === "amber" ? "text-amber-700" : tone === "green" ? "text-emerald-700" : "text-stone-900";
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
      <div className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</div>
      <div className={`mt-1 text-2xl font-bold tabular-nums ${c}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-stone-500">{sub}</div>}
    </div>
  );
}
