"use client";

import { Bell, ChevronDown, ChevronUp, Heart, LocateFixed, MapPin, Navigation, Search, SlidersHorizontal, Tag, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { FOOD_CATEGORIES, isOpenNow, money, regionCentres, regions } from "@/lib/data";
import type { FoodCategory, FoodItem, FoodVenue } from "@/lib/data";

type IntroPhase = "orbit" | "money" | "done";

function NoodleIntro() {
  const [phase, setPhase] = useState<IntroPhase>("orbit");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("money"), 1900);
    const t2 = setTimeout(() => setPhase("done"),  3200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="flex flex-col items-center">
      {/* Bowl + orbit anchor */}
      <div className="relative flex items-center justify-center" style={{ paddingTop: "1.5rem" }}>
        {/* Steam wisps */}
        <div className="absolute top-0 flex gap-3">
          <span className="steam-1 inline-block h-5 w-1.5 rounded-full bg-[#e8472a]/20 blur-[2px]" />
          <span className="steam-2 inline-block h-6 w-1.5 rounded-full bg-[#e8472a]/25 blur-[2px]" />
          <span className="steam-3 inline-block h-5 w-1.5 rounded-full bg-[#e8472a]/20 blur-[2px]" />
        </div>

        <span
          className="inline-block select-none text-7xl"
          style={{ animation: "bowl-pop-in 0.55s cubic-bezier(0.34,1.56,0.64,1) both, bowl-float 2.8s ease-in-out 0.55s infinite" }}
        >
          🍜
        </span>

        {/* Orbiting "mealspy" */}
        {phase === "orbit" && (
          <span
            className="pointer-events-none absolute whitespace-nowrap text-xl font-black text-[#1a1714]"
            style={{ top: "50%", left: "50%", animation: "mealspy-orbit 1.9s ease-in-out forwards" }}
          >
            mealspy
          </span>
        )}

        {/* 💰 arcs from orbit end down to title */}
        {phase === "money" && (
          <span
            className="pointer-events-none absolute select-none text-3xl"
            style={{ top: "50%", left: "50%", animation: "money-land 1.3s ease-in-out forwards" }}
          >
            💰
          </span>
        )}
      </div>

      {/* Title — appears after animation */}
      <h1
        className="mt-2 text-3xl font-black text-[#1a1714]"
        style={{
          opacity: phase === "done" ? undefined : 0,
          animation: phase === "done" ? "title-arrive 0.45s cubic-bezier(0.34,1.56,0.64,1) both" : "none",
        }}
      >
        mealspy
      </h1>
    </div>
  );
}

type VenueWithMeta = FoodVenue & { cheapestPrice: number | null; dealCount: number };
type SortMode = "smart" | "deals" | "price" | "nearby";
type AccountProfile = {
  name?: string;
  homeCity?: string;
  favouriteFood?: string;
  dietaryNeeds?: string;
  maxLunchPrice?: string;
  dealAlerts?: boolean;
};

const profileStorageKey = "mealspy.accountProfile";
const savedStorageKey = "mealspy.savedVenues";

export default function MealSpyApp() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [region, setRegion] = useState("Auckland");
  const [category, setCategory] = useState<FoodCategory | "all">("all");
  const [venues, setVenues] = useState<VenueWithMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [itemsByVenue, setItemsByVenue] = useState<Record<string, FoodItem[]>>({});
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("smart");
  const [priceCap, setPriceCap] = useState("all");
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [savedVenueIds, setSavedVenueIds] = useState<string[]>([]);
  const [splashDone, setSplashDone] = useState(false);
  const [showCheapest, setShowCheapest] = useState(false);
  const [showDeals, setShowDeals] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const storedProfile = window.localStorage.getItem(profileStorageKey);
      const storedSaved = window.localStorage.getItem(savedStorageKey);

      if (storedProfile) {
        const parsed = JSON.parse(storedProfile) as AccountProfile;
        setProfile(parsed);
        if (parsed.maxLunchPrice) setPriceCap(parsed.maxLunchPrice);
      }

      if (storedSaved) {
        const parsedSaved = JSON.parse(storedSaved);
        setSavedVenueIds(Array.isArray(parsedSaved) ? parsedSaved.filter((id) => typeof id === "string") : []);
      }
    } catch {
      window.localStorage.removeItem(savedStorageKey);
    }
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
  }, [coords, category, region]);

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

  function toggleSaved(venueId: string) {
    setSavedVenueIds((current) => {
      const next = current.includes(venueId)
        ? current.filter((id) => id !== venueId)
        : [...current, venueId];
      window.localStorage.setItem(savedStorageKey, JSON.stringify(next));
      return next;
    });
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const maxPrice = priceCap === "all" ? null : Number(priceCap);
    const searched = !q
      ? venues
      : venues.filter((v) =>
          [v.name, v.suburb, v.city, v.category, v.description].some((f) => f?.toLowerCase().includes(q))
        );
    const budgeted = maxPrice == null
      ? searched
      : searched.filter((v) => v.cheapestPrice == null || v.cheapestPrice <= maxPrice);

    return [...budgeted].sort((a, b) => {
      if (sortMode === "deals") return b.dealCount - a.dealCount;
      if (sortMode === "price") return (a.cheapestPrice ?? 9999) - (b.cheapestPrice ?? 9999);
      if (sortMode === "nearby") return (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999);

      const aSaved = savedVenueIds.includes(a.id) ? 3 : 0;
      const bSaved = savedVenueIds.includes(b.id) ? 3 : 0;
      const aScore = aSaved + a.dealCount * 2 - (a.cheapestPrice ?? 30) / 20 - (a.distanceKm ?? 5) / 10;
      const bScore = bSaved + b.dealCount * 2 - (b.cheapestPrice ?? 30) / 20 - (b.distanceKm ?? 5) / 10;
      return bScore - aScore;
    });
  }, [venues, query, priceCap, sortMode, savedVenueIds]);

  const now = new Date();
  const hasDeals = filtered.some((v) => v.dealCount > 0);
  const dealCount = filtered.filter((v) => v.dealCount > 0).length;
  const cheapestVenue = filtered.reduce<VenueWithMeta | null>((best, venue) => {
    if (venue.cheapestPrice == null) return best;
    if (!best || best.cheapestPrice == null || venue.cheapestPrice < best.cheapestPrice) return venue;
    return best;
  }, null);
  const topDeal = filtered.find((venue) => venue.dealCount > 0);
  const savedVisibleCount = filtered.filter((venue) => savedVenueIds.includes(venue.id)).length;
  const firstName = profile?.name?.trim().split(" ")[0];

  // Location splash — always shown on load
  if (!splashDone) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-white px-6 text-center">
        <NoodleIntro />
        <p className="text-sm text-[#a09c98]">Cheap food and deals near you</p>
        <div className="w-full max-w-xs space-y-2.5">
          <button onClick={() => { setSplashDone(true); locate(); }} className="w-full rounded-2xl bg-[#e8472a] py-3.5 text-sm font-bold text-white flex items-center justify-center gap-2">
            <LocateFixed className="h-4 w-4" /> Use my location
          </button>
          <button onClick={() => { setSplashDone(true); chooseRegion("Auckland"); }} className="w-full rounded-2xl border border-[#ece8e3] py-3.5 text-sm font-semibold text-[#6b6560]">
            Pick a city instead
          </button>
        </div>
        <p className="text-xs text-[#c0bbb7]">Location never stored or shared</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#f5f5f5] pb-20">

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#ece8e3]">
        <div className="mx-auto w-full max-w-4xl px-4">
          {/* Top bar — centred logo */}
          <div className="relative flex h-14 items-center justify-center">
            <button onClick={locate} disabled={locating} className="absolute left-0 flex items-center gap-1 text-xs font-semibold text-[#6b6560] disabled:opacity-50">
              <LocateFixed className={`h-4 w-4 ${locating ? "animate-pulse text-[#e8472a]" : ""}`} />
              <span className="max-w-[90px] truncate">{locating ? "Locating…" : region === "Near me" ? "Near me" : region}</span>
            </button>
            <span className="text-lg font-black tracking-tight text-[#1a1714]">🍜 mealspy</span>
            <div className="absolute right-0 flex items-center gap-2">
              <Link href="/drinks" className="rounded-lg border border-[#ece8e3] px-2.5 py-1 text-xs font-bold text-[#245c3b]">🍺 yourbeer</Link>
              <button onClick={() => setShowFilters((v) => !v)} className={`rounded-xl border p-2 ${showFilters ? "border-[#e8472a] bg-[#fff4f2] text-[#e8472a]" : "border-[#ece8e3] text-[#6b6560]"}`}>
                <SlidersHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="pb-2.5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#c0bbb7]" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search a place or suburb…"
                className="h-10 w-full rounded-xl bg-[#f5f5f5] pl-9 pr-8 text-sm text-[#1a1714] outline-none placeholder:text-[#c0bbb7] focus:bg-white focus:ring-2 focus:ring-[#e8472a]/20 transition"
              />
              {query && <button onClick={() => setQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#c0bbb7]"><X className="h-4 w-4" /></button>}
            </div>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="border-t border-[#ece8e3] -mx-4 px-4 py-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <label className="block">
                <span className="text-xs font-semibold text-[#a09c98]">City</span>
                <select value={region} onChange={(e) => chooseRegion(e.target.value)} className="control mt-1 w-full text-sm">{regions.map((r) => <option key={r}>{r}</option>)}</select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-[#a09c98]">Budget</span>
                <select value={priceCap} onChange={(e) => setPriceCap(e.target.value)} className="control mt-1 w-full text-sm">
                  <option value="all">Any price</option>
                  <option value="10">Under $10</option>
                  <option value="15">Under $15</option>
                  <option value="20">Under $20</option>
                  <option value="25">Under $25</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-[#a09c98]">Sort</span>
                <select value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)} className="control mt-1 w-full text-sm">
                  <option value="smart">Best match</option>
                  <option value="deals">Deals first</option>
                  <option value="price">Cheapest first</option>
                  <option value="nearby">Nearest first</option>
                </select>
              </label>
            </div>
          )}

          {/* Category chips */}
          <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-2.5 pt-0 scrollbar-hide">
            <button onClick={() => setCategory("all")} className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold ${category === "all" ? "bg-[#e8472a] text-white" : "bg-[#f5f5f5] text-[#6b6560]"}`}>All</button>
            {FOOD_CATEGORIES.map((c) => (
              <button key={c.value} onClick={() => setCategory(c.value)} className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold ${category === c.value ? "bg-[#e8472a] text-white" : "bg-[#f5f5f5] text-[#6b6560]"}`}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── List ── */}
      <main className="flex-1 px-3 py-3 space-y-2.5 mx-auto w-full max-w-4xl">

        {/* ── Cheapest near you ── */}
        <div className="rounded-2xl border border-[#ece8e3] bg-white overflow-hidden">
          <button
            onClick={() => setShowCheapest((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">💸</span>
              <span className="text-sm font-semibold text-[#1a1714]">Cheapest near you</span>
            </div>
            <ChevronDown className={`h-4 w-4 text-[#a09c98] transition-transform ${showCheapest ? "rotate-180" : ""}`} />
          </button>
          {showCheapest && (
            <div className="border-t border-[#ece8e3] px-4 py-5 text-center">
              <p className="text-2xl mb-2">🍽️</p>
              <p className="text-sm font-semibold text-[#1a1714]">Coming soon</p>
              <p className="mt-1 text-xs text-[#a09c98]">We&apos;ll surface the best value spots near you once venues add their menus.</p>
            </div>
          )}
        </div>

        {/* ── Deals ── */}
        <div className="rounded-2xl border border-[#ece8e3] bg-white overflow-hidden">
          <button
            onClick={() => setShowDeals((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">🔥</span>
              <span className="text-sm font-semibold text-[#1a1714]">Deals</span>
            </div>
            <ChevronDown className={`h-4 w-4 text-[#a09c98] transition-transform ${showDeals ? "rotate-180" : ""}`} />
          </button>
          {showDeals && (
            <div className="border-t border-[#ece8e3] px-4 py-5 text-center">
              <p className="text-2xl mb-2">🏷️</p>
              <p className="text-sm font-semibold text-[#1a1714]">No deals right now</p>
              <p className="mt-1 text-xs text-[#a09c98]">Deals from local venues will appear here when they go live.</p>
            </div>
          )}
        </div>

        {/* Status row */}
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-[#a09c98]">
            {loading ? "Finding places…" : `${filtered.length} place${filtered.length !== 1 ? "s" : ""} near you`}
          </p>
          {hasDeals && !loading && (
            <span className="text-xs font-semibold text-[#e8472a]">🔥 {dealCount} deal spot{dealCount !== 1 ? "s" : ""}</span>
          )}
        </div>

        {/* Empty state */}
        {!loading && coords !== null && filtered.length === 0 && (
          <div className="rounded-2xl bg-white px-6 py-12 text-center shadow-sm">
            <p className="text-4xl mb-3">🍽️</p>
            <p className="font-semibold text-[#1a1714]">No places found yet</p>
            <p className="mt-1 text-sm text-[#a09c98]">Be the first to list a place — it&apos;s free.</p>
            <div className="mt-4 flex flex-col items-center gap-2">
              <Link href="/list" className="text-sm font-semibold text-[#e8472a] underline">List a place</Link>
            </div>
          </div>
        )}

        {/* Venue cards */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((venue) => {
            const catInfo = FOOD_CATEGORIES.find((c) => c.value === venue.category);
            const expanded = expandedId === venue.id;
            const items = itemsByVenue[venue.id] ?? [];
            const availableItems = items.filter((i) => i.isAvailable);
            const deals = availableItems.filter(
              (i) => i.isDeal && (!i.dealExpires || new Date(i.dealExpires) > now)
            );
            const regularItems = availableItems.filter((i) => !deals.includes(i));

            const openStatus = isOpenNow(venue.openingHours ?? null);

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
                        {openStatus === true && (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700">Open</span>
                        )}
                        {openStatus === false && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500">Closed</span>
                        )}
                        {venue.menuStatus === "pending" && (
                          <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[11px] font-semibold text-yellow-700">Menu coming soon</span>
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

                <div className="flex items-center gap-2 border-t border-[#f3efeb] px-4 py-2">
                  <button
                    onClick={() => toggleSaved(venue.id)}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${savedVenueIds.includes(venue.id) ? "bg-[#fff0f7] text-[#b83280]" : "bg-[#faf9f7] text-[#6b6560] hover:text-[#b83280]"}`}
                  >
                    <Heart className={`h-3.5 w-3.5 ${savedVenueIds.includes(venue.id) ? "fill-current" : ""}`} />
                    {savedVenueIds.includes(venue.id) ? "Saved" : "Save"}
                  </button>
                  {venue.address && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue.name} ${venue.address} ${venue.city}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg bg-[#faf9f7] px-2.5 py-1.5 text-xs font-semibold text-[#6b6560] transition hover:text-[#1a6b3c]"
                    >
                      <Navigation className="h-3.5 w-3.5" />
                      Directions
                    </a>
                  )}
                  {profile?.dealAlerts && venue.dealCount > 0 && (
                    <span className="ml-auto flex items-center gap-1 rounded-full bg-[#fff4f2] px-2 py-1 text-[11px] font-semibold text-[#e8472a]">
                      <Bell className="h-3 w-3" />
                      Matches alerts
                    </span>
                  )}
                </div>

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
          <div className="mt-8 rounded-2xl border border-[#ece8e3] bg-white px-5 py-4 text-center">
            <p className="text-sm font-semibold text-[#1a1714]">Built for quick food decisions</p>
            <p className="mt-1 text-xs leading-5 text-[#a09c98]">
              Prices are listed directly by venues. Save favourites, compare deals, check directions, then decide before you go.
            </p>
          </div>
        )}
      </main>

      {/* ── Bottom navigation ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center border-t border-[#ece8e3] bg-white">
        <button className="flex flex-1 flex-col items-center gap-0.5 text-[#e8472a]">
          <span className="text-xl leading-none">🍽️</span>
          <span className="text-[10px] font-semibold">Nearby</span>
        </button>
        <Link href="/food/map" className="flex flex-1 flex-col items-center gap-0.5 text-[#a09c98]">
          <span className="text-xl leading-none">🗺️</span>
          <span className="text-[10px] font-semibold">Map</span>
        </Link>
        <button
          onClick={() => setSortMode("smart")}
          className="flex flex-1 flex-col items-center gap-0.5 text-[#a09c98]"
        >
          <span className="text-xl leading-none">❤️</span>
          <span className="text-[10px] font-semibold">Saved</span>
        </button>
        <Link href="/list" className="flex flex-1 flex-col items-center gap-0.5 text-[#a09c98]">
          <span className="text-xl leading-none">➕</span>
          <span className="text-[10px] font-semibold">List</span>
        </Link>
      </nav>
    </div>
  );
}
