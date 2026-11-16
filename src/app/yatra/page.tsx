"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, Card } from "@/components/ui";
import { inr } from "@/lib/time";
import { LISTINGS } from "@/lib/yatra-data";
import type { Listing, ListingType } from "@/lib/types";

const FILTERS: { k: keyof Listing["tags"] | "walkable"; label: string }[] = [
  { k: "sattvic", label: "Sattvic (no onion/garlic)" },
  { k: "jain", label: "Jain food" },
  { k: "noAlcoholVerified", label: "No-alcohol verified" },
  { k: "walkable", label: "Walkable (≤15 min)" },
  { k: "ac", label: "AC" },
  { k: "parking", label: "Bus / car parking" },
];

type Sort = "walk" | "price" | "rating";

export default function YatraList() {
  const [type, setType] = useState<ListingType>("stay");
  const [on, setOn] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<Sort>("walk");

  const list = useMemo(() => {
    const xs = LISTINGS.filter((l) => l.type === type).filter((l) =>
      [...on].every((k) => (k === "walkable" ? l.walkMin > 0 && l.walkMin <= 15 : l.tags[k as keyof Listing["tags"]])),
    );
    const walk = (l: Listing) => (l.walkMin > 0 ? l.walkMin : 999);
    return xs.sort((a, b) => (sort === "walk" ? walk(a) - walk(b) : sort === "price" ? a.priceFrom - b.priceFrom : b.rating - a.rating));
  }, [type, on, sort]);

  const toggle = (k: string) => {
    const n = new Set(on);
    if (n.has(k)) n.delete(k);
    else n.add(k);
    setOn(n);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 rounded-xl bg-stone-100 p-1">
        {(["stay", "eatery"] as const).map((t) => (
          <button key={t} onClick={() => setType(t)} className={`rounded-lg py-2.5 font-semibold ${type === t ? "bg-white text-teal-900 shadow" : "text-stone-600"}`}>
            {t === "stay" ? "🛏️ Stays · ठहरना" : "🍛 Meals · भोजन"}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge tone="green">✓ All listings pure vegetarian</Badge>
        {FILTERS.map((f) => (
          <button key={f.k} onClick={() => toggle(f.k)} className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${on.has(f.k) ? "bg-teal-700 text-white ring-teal-700" : "bg-white text-stone-700 ring-stone-300"}`}>
            {f.label}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-stone-500">{list.length} verified {type === "stay" ? "stays" : "eateries"}</span>
        <label className="flex items-center gap-2">
          Sort
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="rounded-lg border border-stone-300 px-2 py-1">
            <option value="walk">Walking time to temple</option>
            <option value="price">Price</option>
            <option value="rating">Rating</option>
          </select>
        </label>
      </div>

      <div className="space-y-3">
        {list.map((l) => (
          <Link key={l.id} href={`/yatra/book?id=${l.id}`} className="block">
            <Card className="p-4 transition hover:ring-teal-400">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-bold text-stone-900">{l.name}</div>
                  <div className="text-sm text-stone-500">
                    {l.nameHi} · {l.area}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-bold text-teal-800">{inr(l.priceFrom)}</div>
                  <div className="text-xs text-stone-500">/ {l.priceUnit}</div>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Badge tone={l.walkMin > 0 ? "teal" : "stone"} className="" >
                  🚶 {l.walkMin > 0 ? `~${l.walkMin} min walk (est.)` : "Not walkable"}
                </Badge>
                <Badge>★ {l.rating} ({l.reviews})</Badge>
                {l.tags.sattvic && <Badge tone="green">Sattvic</Badge>}
                {l.tags.jain && <Badge tone="green">Jain</Badge>}
                {l.tags.noAlcoholVerified ? <Badge tone="green">No-alcohol ✓</Badge> : <Badge tone="amber">No-alcohol: pending</Badge>}
                {l.tags.ac && <Badge>AC</Badge>}
              </div>
              <p className="mt-2 text-sm text-stone-600">{l.blurb}</p>
              {l.perks[0] && <div className="mt-2 rounded-lg bg-amber-50 px-3 py-1.5 text-sm text-amber-900">🎁 {l.perks[0].title}</div>}
              <div className="mt-2 text-[11px] text-stone-400">
                Verified {l.verifiedOn} · {l.evidence}
              </div>
            </Card>
          </Link>
        ))}
      </div>
      <p className="text-xs text-stone-400">
        Sample listings (fictional) for the prototype. Walking times are estimates — see each listing for the basis. Ranking is never paid and has no link to darshan.
      </p>
    </div>
  );
}
