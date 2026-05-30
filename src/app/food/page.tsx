"use client";

import { UtensilsCrossed, LocateFixed, SlidersHorizontal, X, MapPin, Tag, ChevronDown, ChevronUp, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FOOD_CATEGORIES, regionCentres, regions, money } from "@/lib/data";
import type { FoodCategory, FoodItem, FoodVenue } from "@/lib/data";

type VenueWithMeta = FoodVenue & { cheapestPrice: number | null; dealCount: number };

export default function FoodPage() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [region, setRegion] = useState("Auckland");
  const [radius, setRadius] = useState(5);
  const [category, setCategory] = useState<FoodCategory | "all">("all");
  const [venues, setVenues] = useState<VenueWithMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [itemsByVenue, setItemsByVenue] = useState<Record<string, FoodItem[]>>({});
  const [query, setQuery] = useState("");

  useEffect(() => { locate(); }, []);

  useEffect(() => {
    if (!coords) return;
    setLoading(true);
    const params = new URLSearchParams({
      lat: String(coords.lat),
      lng: String(coords.lng),
      radiusKm: String(radius),
      region,
      category,
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
      setNotice("Location unavailable — showing Auckland.");
      return;
    }
    setNotice("Finding you...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setRegion("Near me");
        setNotice("Showing places near you.");
      },
      () => {
        setCoords(regionCentres.Auckland);
        setNotice("Location blocked — showing Auckland.");
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

  return (
    <div className="min-h-dvh bg-[#f7efe0]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#2f2417]/10 bg-[#ff6b35] shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border-2 border-[#2f2417] bg-[#fff7df] text-xl shadow-[3px_3px_0_#2f2417]">
              🍜
            </span>
            <span>
              <span className="block text-xl font-black leading-none text-white">mealspy</span>
              <span className="block text-xs font-bold text-white/70">cheap food near you</span>
            </span>
          </Link>
          <div className="flex gap-2">
            <button
              onClick={locate}
              className="grid h-9 w-9 place-items-center rounded-md border-2 border-white/30 bg-white/15 text-white"
              aria-label="Use my location"
            >
              <LocateFixed className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className="grid h-9 w-9 place-items-center rounded-md border-2 border-white/30 bg-white/15 text-white"
              aria-label="Filters"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="px-4 pb-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search venues or suburb..."
            className="h-10 w-full rounded-md border-2 border-white/30 bg-white/90 px-3 text-sm font-bold text-[#1f1b16] placeholder:text-black/35 outline-none focus:border-white"
          />
        </div>

        {/* Filters drawer */}
        {showFilters && (
          <div className="border-t border-white/20 bg-[#e85c2a] px-4 py-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block">
                <span className="text-xs font-black text-white/70 uppercase tracking-wide">City</span>
                <select
                  value={region}
                  onChange={(e) => chooseRegion(e.target.value)}
                  className="control mt-1 w-full bg-white"
                >
                  {regions.map((r) => <option key={r}>{r}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="flex justify-between text-xs font-black text-white/70 uppercase tracking-wide">
                  Radius <strong className="text-white">{radius} km</strong>
                </span>
                <input
                  type="range" min={1} max={20} value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="mt-3 w-full accent-white"
                />
              </label>
              <label className="block">
                <span className="text-xs font-black text-white/70 uppercase tracking-wide">Type</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as FoodCategory | "all")}
                  className="control mt-1 w-full bg-white"
                >
                  <option value="all">All types</option>
                  {FOOD_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                  ))}
                </select>
              </label>
            </div>
            {notice && (
              <p className="mt-2 rounded bg-white/20 px-2 py-1 text-xs font-bold text-white">{notice}</p>
            )}
          </div>
        )}
      </header>

      <main className="mx-auto max-w-2xl px-4 py-5">
        {/* Status bar */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-bold text-black/50">
            {loading
              ? "Finding places..."
              : `${filtered.length} place${filtered.length !== 1 ? "s" : ""} within ${radius} km`}
          </p>
          <Link
            href="/food/list"
            className="flex items-center gap-1.5 rounded-md bg-[#ff6b35] px-3 py-1.5 text-xs font-black text-white shadow-[2px_2px_0_#2f2417]"
          >
            <Plus className="h-3 w-3" />
            List your place
          </Link>
        </div>

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="rounded-xl border-2 border-[#2f2417]/10 bg-white p-10 text-center">
            <p className="text-4xl mb-3">🍜</p>
            <p className="text-xl font-black">No food spots found nearby</p>
            <p className="mt-1 text-sm font-bold text-black/50">
              Try increasing the radius, or{" "}
              <Link href="/food/list" className="text-[#ff6b35] underline">list your place</Link> to be first.
            </p>
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

            return (
              <article
                key={venue.id}
                className="rounded-xl border-2 border-[#2f2417]/10 bg-white shadow-sm overflow-hidden"
              >
                <button
                  className="w-full p-4 text-left"
                  onClick={() => expandVenue(venue)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-black text-lg leading-tight">{venue.name}</h2>
                        {venue.dealCount > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#ff6b35] px-2 py-0.5 text-xs font-black text-white">
                            <Tag className="h-3 w-3" />
                            {venue.dealCount} deal{venue.dealCount !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm font-bold text-black/50">
                        {catInfo?.emoji} {catInfo?.label} · {venue.suburb || venue.city}
                        {venue.distanceKm != null ? ` · ${venue.distanceKm} km` : ""}
                      </p>
                      {venue.description && (
                        <p className="mt-1 text-sm text-black/60 line-clamp-1">{venue.description}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {venue.cheapestPrice != null ? (
                        <div className="text-right">
                          <p className="text-xs font-bold text-black/40">from</p>
                          <p className="text-2xl font-black text-[#245c3b]">{money(venue.cheapestPrice)}</p>
                        </div>
                      ) : (
                        <p className="rounded bg-black/5 px-2 py-1 text-xs font-black text-black/40">no menu yet</p>
                      )}
                      {expanded ? <ChevronUp className="h-4 w-4 text-black/30" /> : <ChevronDown className="h-4 w-4 text-black/30" />}
                    </div>
                  </div>
                </button>

                {/* Expanded menu */}
                {expanded && (
                  <div className="border-t border-[#2f2417]/10 bg-[#fffaf0] px-4 pb-4">
                    {items.length === 0 ? (
                      <p className="pt-4 text-sm font-bold text-black/40 text-center">No menu items yet.</p>
                    ) : (
                      <div className="pt-3 grid gap-2">
                        {deals.length > 0 && (
                          <div className="mb-1">
                            <p className="text-xs font-black text-[#ff6b35] uppercase tracking-wide mb-1.5">🔥 Deals</p>
                            {deals.map((item) => (
                              <div key={item.id} className="flex items-center justify-between rounded-md bg-[#fff3ee] border border-[#ff6b35]/20 px-3 py-2 mb-1.5">
                                <div>
                                  <p className="font-black text-sm">{item.name}</p>
                                  {item.dealNote && <p className="text-xs text-[#ff6b35] font-bold">{item.dealNote}</p>}
                                </div>
                                <p className="font-black text-[#245c3b]">{money(item.price)}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        <p className="text-xs font-black text-black/40 uppercase tracking-wide mb-1">Menu</p>
                        {availableItems.filter((i) => !deals.includes(i)).map((item) => (
                          <div key={item.id} className="flex items-center justify-between px-1 py-1.5 border-b border-black/5 last:border-0">
                            <div>
                              <p className="font-bold text-sm">{item.name}</p>
                              {item.description && <p className="text-xs text-black/45">{item.description}</p>}
                            </div>
                            <p className="font-black text-sm text-[#245c3b] ml-4">{money(item.price)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 flex gap-2 flex-wrap">
                      {venue.phone && (
                        <a href={`tel:${venue.phone}`} className="text-xs font-bold text-[#245c3b] underline">
                          📞 {venue.phone}
                        </a>
                      )}
                      {venue.website && (
                        <a href={venue.website} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-[#245c3b] underline">
                          🌐 Website
                        </a>
                      )}
                      {venue.address && (
                        <span className="text-xs text-black/40 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />{venue.address}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
