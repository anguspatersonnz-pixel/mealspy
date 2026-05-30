"use client";

import { Beer, ChevronDown, ChevronUp, LocateFixed, MapPin, Plus, Search, SlidersHorizontal, Tag, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { FOOD_CATEGORIES, money, regionCentres, regions } from "@/lib/data";
import type { FoodCategory, FoodItem, FoodVenue } from "@/lib/data";

type VenueWithMeta = FoodVenue & { cheapestPrice: number | null; dealCount: number };

export default function MealSpyApp() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [region, setRegion] = useState("Auckland");
  const [radius, setRadius] = useState(5);
  const [category, setCategory] = useState<FoodCategory | "all">("all");
  const [venues, setVenues] = useState<VenueWithMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [itemsByVenue, setItemsByVenue] = useState<Record<string, FoodItem[]>>({});
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { locate(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!coords) return;
    setLoading(true);
    const params = new URLSearchParams({
      lat: String(coords.lat), lng: String(coords.lng),
      radiusKm: String(radius), region, category,
    });
    fetch(`/api/food/venues?${params}`)
      .then((r) => r.json())
      .then((d) => setVenues(Array.isArray(d.venues) ? d.venues : []))
      .catch(() => setVenues([]))
      .finally(() => setLoading(false));
  }, [coords, radius, category, region]);

  async function expandVenue(venue: VenueWithMeta) {
    if (expandedId === venue.id) { setExpandedId(null); return; }
    setExpandedId(venue.id);
    if (itemsByVenue[venue.id]) return;
    const res = await fetch(`/api/food/venues/${venue.id}/items`);
    const data = await res.json();
    setItemsByVenue((prev) => ({ ...prev, [venue.id]: data.items ?? [] }));
  }

  function locate() {
    if (!navigator.geolocation) {
      setCoords(regionCentres.Auckland);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setRegion("Near me");
        setLocating(false);
      },
      () => {
        setCoords(regionCentres.Auckland);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 6000 },
    );
  }

  function chooseRegion(r: string) {
    setRegion(r);
    setCoords(regionCentres[r] ?? regionCentres.Auckland);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return venues;
    return venues.filter((v) =>
      [v.name, v.suburb, v.city, v.category].some((f) => f?.toLowerCase().includes(q))
    );
  }, [venues, query]);

  const now = new Date();
  const hasDeals = filtered.some((v) => v.dealCount > 0);

  return (
    <div className="min-h-dvh">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-[#ece8e3] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl px-4">
          {/* Top bar */}
          <div className="flex items-center justify-between gap-3 py-3.5">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl leading-none">🍜</span>
              <div>
                <span className="block text-[17px] font-bold leading-none tracking-tight text-[#1a1714]">mealspy</span>
                <span className="block text-[11px] font-medium text-[#a09c98] leading-none mt-0.5">cheap food near you</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={locate}
                disabled={locating}
                className="flex items-center gap-1.5 rounded-lg border border-[#ece8e3] bg-white px-3 py-2 text-xs font-semibold text-[#6b6560] transition hover:border-[#e8472a] hover:text-[#e8472a] disabled:opacity-50"
              >
                <LocateFixed className={`h-3.5 w-3.5 ${locating ? "animate-pulse" : ""}`} />
                {locating ? "Locating…" : region === "Near me" ? "Near me" : region}
              </button>
              <button
                onClick={() => setShowFilters((v) => !v)}
                className={`rounded-lg border p-2 transition ${showFilters ? "border-[#e8472a] bg-[#fff4f2] text-[#e8472a]" : "border-[#ece8e3] bg-white text-[#6b6560] hover:border-[#e8472a] hover:text-[#e8472a]"}`}
                aria-label="Filters"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
              <Link
                href="/drinks"
                className="rounded-lg border border-[#ece8e3] bg-white p-2 text-[#6b6560] transition hover:border-[#1a6b3c] hover:text-[#1a6b3c]"
                title="Switch to yourbeer"
              >
                <Beer className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Search */}
          <div className="pb-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a09c98]" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search a place or suburb…"
                className="h-10 w-full rounded-xl border border-[#ece8e3] bg-[#faf9f7] pl-10 pr-10 text-sm text-[#1a1714] outline-none placeholder:text-[#a09c98] focus:border-[#e8472a] focus:bg-white focus:ring-2 focus:ring-[#e8472a]/10 transition"
              />
              {query && (
                <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a09c98]">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="border-t border-[#ece8e3] py-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block">
                  <span className="label">City</span>
                  <select value={region} onChange={(e) => chooseRegion(e.target.value)} className="control mt-1.5">
                    {regions.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="label flex justify-between">
                    Radius <span className="normal-case font-semibold text-[#1a1714]">{radius} km</span>
                  </span>
                  <input
                    type="range" min={1} max={20} value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className="mt-3 w-full accent-[#e8472a]"
                  />
                </label>
                <label className="block">
                  <span className="label">Type</span>
                  <select value={category} onChange={(e) => setCategory(e.target.value as FoodCategory | "all")} className="control mt-1.5">
                    <option value="all">All types</option>
                    {FOOD_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          )}

          {/* Category chips */}
          <div className="flex gap-2 overflow-x-auto pb-3 pt-0.5 scrollbar-hide">
            <button
              onClick={() => setCategory("all")}
              className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${category === "all" ? "bg-[#e8472a] text-white" : "bg-[#faf9f7] text-[#6b6560] hover:bg-[#ece8e3]"}`}
            >
              All
            </button>
            {FOOD_CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${category === c.value ? "bg-[#e8472a] text-white" : "bg-[#faf9f7] text-[#6b6560] hover:bg-[#ece8e3]"}`}
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="mx-auto max-w-2xl px-4 py-5">
        {/* Status + CTA */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-[#6b6560]">
            {loading ? (
              <span className="animate-pulse">Finding places…</span>
            ) : (
              <>{filtered.length} place{filtered.length !== 1 ? "s" : ""} within {radius} km</>
            )}
          </p>
          <Link href="/list" className="flex items-center gap-1.5 rounded-lg bg-[#e8472a] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#c73d22]">
            <Plus className="h-3.5 w-3.5" />
            List your place
          </Link>
        </div>

        {/* Deals banner */}
        {hasDeals && !loading && (
          <div className="mb-4 flex items-center gap-2.5 rounded-xl bg-[#fff8f6] border border-[#fad5ce] px-4 py-3">
            <span className="text-xl">🔥</span>
            <p className="text-sm font-semibold text-[#c73d22]">
              {filtered.filter((v) => v.dealCount > 0).length} place{filtered.filter((v) => v.dealCount > 0).length !== 1 ? "s" : ""} with active deals nearby
            </p>
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="rounded-2xl border border-[#ece8e3] bg-white px-6 py-12 text-center">
            <p className="text-4xl mb-4">🍽️</p>
            <p className="text-lg font-semibold text-[#1a1714]">Nothing here yet</p>
            <p className="mt-1.5 text-sm text-[#6b6560] max-w-xs mx-auto">
              Be the first to list a food place in this area — it&apos;s free and takes two minutes.
            </p>
            <Link href="/list" className="btn-primary mt-5 mx-auto">
              List a place
            </Link>
          </div>
        )}

        {/* Venue cards */}
        <div className="grid gap-3">
          {filtered.map((venue) => {
            const catInfo = FOOD_CATEGORIES.find((c) => c.value === venue.category);
            const expanded = expandedId === venue.id;
            const items = itemsByVenue[venue.id] ?? [];
            const availableItems = items.filter((i) => i.isAvailable);
            const deals = availableItems.filter(
              (i) => i.isDeal && (!i.dealExpires || new Date(i.dealExpires) > now)
            );
            const regularItems = availableItems.filter((i) => !deals.includes(i));

            return (
              <article key={venue.id} className="card overflow-hidden">
                {/* Image */}
                {venue.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={venue.imageUrl}
                    alt={venue.name}
                    className="h-40 w-full object-cover cursor-pointer"
                    onClick={() => expandVenue(venue)}
                  />
                )}

                {/* Card header */}
                <button className="w-full px-4 py-4 text-left" onClick={() => expandVenue(venue)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold text-[#1a1714] leading-snug">{venue.name}</h2>
                        {venue.dealCount > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#fff4f2] border border-[#fad5ce] px-2 py-0.5 text-[11px] font-semibold text-[#e8472a]">
                            <Tag className="h-2.5 w-2.5" />
                            {venue.dealCount} deal{venue.dealCount !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-[#a09c98]">
                        {catInfo?.emoji} {catInfo?.label}
                        {(venue.suburb || venue.city) && <> · {venue.suburb || venue.city}</>}
                        {venue.distanceKm != null && <> · {venue.distanceKm} km</>}
                      </p>
                      {venue.description && (
                        <p className="mt-1.5 text-sm text-[#6b6560] line-clamp-1">{venue.description}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      {venue.cheapestPrice != null ? (
                        <div className="text-right">
                          <p className="text-[11px] font-medium text-[#a09c98]">from</p>
                          <p className="text-xl font-bold text-[#1a6b3c]">{money(venue.cheapestPrice)}</p>
                        </div>
                      ) : (
                        <span className="rounded-lg bg-[#faf9f7] px-2 py-1 text-[11px] font-medium text-[#a09c98]">
                          no menu
                        </span>
                      )}
                      {expanded
                        ? <ChevronUp className="h-4 w-4 text-[#a09c98]" />
                        : <ChevronDown className="h-4 w-4 text-[#a09c98]" />}
                    </div>
                  </div>
                </button>

                {/* Expanded menu */}
                {expanded && (
                  <div className="border-t border-[#ece8e3] px-4 pb-4 pt-3">
                    {items.length === 0 ? (
                      <p className="py-4 text-center text-sm text-[#a09c98]">No menu items added yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {/* Deals */}
                        {deals.length > 0 && (
                          <div>
                            <p className="label mb-2">🔥 Deals</p>
                            <div className="space-y-2">
                              {deals.map((item) => (
                                <div key={item.id} className="flex items-start justify-between gap-3 rounded-xl bg-[#fff8f6] border border-[#fad5ce] px-3.5 py-3">
                                  <div>
                                    <p className="text-sm font-semibold text-[#1a1714]">{item.name}</p>
                                    {item.dealNote && <p className="mt-0.5 text-xs font-medium text-[#e8472a]">{item.dealNote}</p>}
                                    {item.description && <p className="mt-0.5 text-xs text-[#6b6560]">{item.description}</p>}
                                  </div>
                                  <p className="flex-shrink-0 text-sm font-bold text-[#1a6b3c]">{money(item.price)}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Regular menu */}
                        {regularItems.length > 0 && (
                          <div>
                            <p className="label mb-2">Menu</p>
                            <div className="divide-y divide-[#ece8e3]">
                              {regularItems.map((item) => (
                                <div key={item.id} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                                  <div>
                                    <p className="text-sm font-medium text-[#1a1714]">{item.name}</p>
                                    {item.description && <p className="mt-0.5 text-xs text-[#a09c98]">{item.description}</p>}
                                  </div>
                                  <p className="flex-shrink-0 text-sm font-semibold text-[#1a6b3c]">{money(item.price)}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Contact row */}
                    {(venue.phone || venue.website || venue.address) && (
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-[#ece8e3] pt-3">
                        {venue.phone && (
                          <a href={`tel:${venue.phone}`} className="flex items-center gap-1 text-xs font-semibold text-[#e8472a] hover:underline">
                            📞 {venue.phone}
                          </a>
                        )}
                        {venue.website && (
                          <a href={venue.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-semibold text-[#e8472a] hover:underline">
                            🌐 Website
                          </a>
                        )}
                        {venue.address && (
                          <span className="flex items-center gap-1 text-xs text-[#a09c98]">
                            <MapPin className="h-3 w-3" />{venue.address}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {/* Bottom trust note */}
        {!loading && filtered.length > 0 && (
          <p className="mt-8 text-center text-xs text-[#a09c98]">
            Prices listed directly by venues. Always check before you go.
          </p>
        )}
      </main>
    </div>
  );
}
