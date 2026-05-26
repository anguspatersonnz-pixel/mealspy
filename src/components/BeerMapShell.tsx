"use client";

import dynamic from "next/dynamic";
import type { BeerMapProps } from "./BeerMap";

const LeafletBeerMap = dynamic(() => import("./BeerMap"), {
  ssr: false,
  loading: () => (
    <section className="flex h-full flex-col bg-white p-2">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xl font-black">Beer map</h2>
        <span className="text-xs font-bold text-black/45">loading</span>
      </div>
      <div className="grid min-h-[190px] flex-1 place-items-center rounded-lg border border-black/10 bg-[#e8ecd8] text-sm font-black text-black/45">
        Loading map
      </div>
    </section>
  ),
});

export default function BeerMapShell(props: BeerMapProps) {
  return <LeafletBeerMap {...props} />;
}
