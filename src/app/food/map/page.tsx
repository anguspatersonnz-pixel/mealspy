"use client";

import { ArrowLeft, LocateFixed, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FOOD_CATEGORIES, regionCentres, regions } from "@/lib/data";
import type { FoodCategory } from "@/lib/data";
import FoodMapShell from "@/components/FoodMapShell";
import type { FoodMapVenue } from "@/components/FoodMap";

export default function FoodMapPage() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [region, setRegion] = useState("Auckland");
  const [category, setCategory] = useState<FoodCategory | "all">("all");
  const [venues, setVenues] = useState<FoodMapVenue[]>([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    locate();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!coords) return;
    setLoading(true);
    const params = new URLSearchParams({
      lat: String(coords.lat), lng: String(coords.lng),
      radiusKm: "9999", region, category,
    });
    fetch(`/api/food/venues?${params}`)
      .then((r) => r.json())
      .then((d) => setVenues(Array.isArray(d.venues) ? d.venues : []))
      .catch(() => setVenues([]))
      .finally(() => setLoading(false));
  }, [coords, region, category]);

  function locate() {
    if (!navigator.geolocation) { setCoords(regionCentres.Auckland); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setRegion("Near me"); setLocating(false); },
      () => { setCoords(regionCentres.Auckland); setLocating(false); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }

  function chooseRegion(r: string) {
    setRegion(r);
    setCoords(regionCentres[r] ?? regionCentres.Auckland);
  }

  const centre = coords ?? regionCentres.Auckland;

  return (
    <div className="flex h-dvh flex-col bg-[#faf9f7]">
      {/* Header */}
      <header className="z-10 flex items-center gap-2 border-b border-[#ece8e3] bg-white/95 px-3 py-2.5 backdrop-blur-sm">
        <Link href="/" className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-[#ece8e3] bg-white text-[#6b6560]">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <span className="text-sm font-semibold text-[#1a1714]">mealspy map</span>
        <span className="text-xs text-[#a09c98]">
          {loading ? "Loading…" : `${venues.length} places`}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={locate}
            disabled={locating}
            className="flex items-center gap-1.5 rounded-lg border border-[#ece8e3] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#6b6560] disabled:opacity-50"
          >
            <LocateFixed className={`h-3.5 w-3.5 ${locating ? "animate-pulse" : ""}`} />
            {locating ? "…" : "Near me"}
          </button>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`rounded-lg border p-1.5 transition ${showFilters ? "border-[#e8472a] bg-[#fff4f2] text-[#e8472a]" : "border-[#ece8e3] bg-white text-[#6b6560]"}`}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Filter drawer */}
      {showFilters && (
        <div className="z-10 border-b border-[#ece8e3] bg-white px-3 py-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-xs font-semibold text-[#a09c98]">Jump to city</span>
              <select value={region} onChange={(e) => chooseRegion(e.target.value)} className="control mt-1 w-full text-sm">
                {regions.map((r) => <option key={r}>{r}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-[#a09c98]">Type</span>
              <select value={category} onChange={(e) => setCategory(e.target.value as FoodCategory | "all")} className="control mt-1 w-full text-sm">
                <option value="all">All types</option>
                {FOOD_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </label>
          </div>
        </div>
      )}

      {/* Category chips */}
      <div className="z-10 flex gap-2 overflow-x-auto border-b border-[#ece8e3] bg-white px-3 py-2 scrollbar-hide">
        <button onClick={() => setCategory("all")} className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${category === "all" ? "bg-[#e8472a] text-white" : "bg-[#faf9f7] text-[#6b6560]"}`}>All</button>
        {FOOD_CATEGORIES.map((c) => (
          <button key={c.value} onClick={() => setCategory(c.value)} className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${category === c.value ? "bg-[#e8472a] text-white" : "bg-[#faf9f7] text-[#6b6560]"}`}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Map — fills remaining height */}
      <div className="relative min-h-0 flex-1">
        {coords ? (
          <FoodMapShell venues={venues} centre={centre} activeId={activeId} onActive={setActiveId} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <button onClick={locate} className="btn-primary flex items-center gap-2">
              <LocateFixed className="h-4 w-4" />
              Share location to load map
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
