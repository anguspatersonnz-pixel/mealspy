"use client";

import dynamic from "next/dynamic";
import type { FoodMapProps } from "./FoodMap";

const LeafletFoodMap = dynamic(() => import("./FoodMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#f4f4f0] text-sm font-medium text-gray-400">
      Loading map…
    </div>
  ),
});

export default function FoodMapShell(props: FoodMapProps) {
  return <LeafletFoodMap {...props} />;
}
