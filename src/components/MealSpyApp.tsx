"use client";

import { Beer, Bell, ChevronDown, ChevronUp, Heart, LocateFixed, Map, MapPin, Navigation, Pencil, Plus, Search, SlidersHorizontal, Sparkles, Tag, TrendingDown, User, WalletCards, X } from "lucide-react"; // Sparkles kept for sort button
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { FOOD_CATEGORIES, isOpenNow, money, regionCentres, regions } from "@/lib/data";
import type { FoodCategory, FoodItem, FoodVenue } from "@/lib/data";

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
  const [radius, setRadius] = useState(15);
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
  const [locationAsked, setLocationAsked] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-locate only if permission was previously granted (no prompt needed)
    if (navigator.permissions) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        if (result.state === "granted") locate();
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    try {
      const storedProfile = window.localStorage.getItem(profileStorageKey);
      const storedSaved = window.localStorage.getItem(savedStorageKey);

      if (storedProfile) {
        const parsed = JSON.parse(storedProfile) as AccountProfile;
        setProfile(parsed);
        if (parsed.maxLunchPrice) setPriceCap(parsed.maxLunchPrice);
        if (parsed.homeCity && regions.includes(parsed.homeCity)) chooseRegion(parsed.homeCity);
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
    setLocationAsked(true);
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

  // Show full-screen location request on first visit before anything else
  if (!locationAsked && !coords) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-[#faf9f7] px-6 text-center">
        <span className="text-6xl">🍜</span>
        <div>
          <h1 className="text-2xl font-bold text-[#1a1714]">mealspy</h1>
          <p className="mt-2 text-sm text-[#6b6560]">Find cheap food and deals near you</p>
        </div>
        <div className="w-full max-w-xs space-y-3">
          <button
            onClick={locate}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3"
          >
            <LocateFixed className="h-4 w-4" />
            Use my location
          </button>
          <button
            onClick={() => { setLocationAsked(true); chooseRegion("Auckland"); }}
            className="btn-ghost w-full py-3"
          >
            Pick a city instead
          </button>
        </div>
        <p className="text-xs text-[#a09c98]">Your location is only used to find nearby places — never stored.</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-[#ece8e3] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4">
          {/* Top bar */}
          <div className="flex items-center justify-between gap-3 py-3.5">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl leading-none">🍜</span>
              <div>
                <span className="block text-[17px] font-bold leading-none tracking-tight text-[#1a1714]">mealspy</span>
                <span className="block text-[11px] font-medium text-[#a09c98] leading-none mt-0.5">
                  {firstName ? `built for ${firstName}` : "cheap food near you"}
                </span>
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
                className="flex items-center gap-1.5 rounded-lg border border-[#ece8e3] bg-white px-3 py-2 text-xs font-semibold text-[#6b6560] transition hover:border-[#1a6b3c] hover:text-[#1a6b3c]"
              >
                <Beer className="h-3.5 w-3.5" />
                <span>yourbeer</span>
              </Link>
              <Link
                href="/account"
                className="flex items-center gap-1.5 rounded-lg border border-[#ece8e3] bg-white px-3 py-2 text-xs font-semibold text-[#6b6560] transition hover:border-[#e8472a] hover:text-[#e8472a]"
                title="Account"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Account</span>
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
              <div className="grid gap-3 sm:grid-cols-4">
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
                  <span className="label">Budget</span>
                  <select value={priceCap} onChange={(e) => setPriceCap(e.target.value)} className="control mt-1.5">
                    <option value="all">Any price</option>
                    <option value="10">Under $10</option>
                    <option value="15">Under $15</option>
                    <option value="20">Under $20</option>
                    <option value="25">Under $25</option>
                  </select>
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
      <main className="mx-auto grid max-w-6xl gap-5 px-4 py-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-4 lg:sticky lg:top-40 lg:self-start">
        <section className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-[#ece8e3] bg-white px-3 py-3">
            <TrendingDown className="mb-1 h-4 w-4 text-[#1a6b3c]" />
            <p className="text-lg font-bold leading-none text-[#1a1714]">{cheapestVenue?.cheapestPrice != null ? money(cheapestVenue.cheapestPrice) : "--"}</p>
            <p className="mt-1 text-[11px] font-medium text-[#a09c98]">cheapest</p>
          </div>
          <div className="rounded-xl border border-[#ece8e3] bg-white px-3 py-3">
            <Tag className="mb-1 h-4 w-4 text-[#e8472a]" />
            <p className="text-lg font-bold leading-none text-[#1a1714]">{dealCount}</p>
            <p className="mt-1 text-[11px] font-medium text-[#a09c98]">deal spots</p>
          </div>
          <div className="rounded-xl border border-[#ece8e3] bg-white px-3 py-3">
            <Heart className="mb-1 h-4 w-4 text-[#b83280]" />
            <p className="text-lg font-bold leading-none text-[#1a1714]">{savedVisibleCount}</p>
            <p className="mt-1 text-[11px] font-medium text-[#a09c98]">saved here</p>
          </div>
        </section>

        <section className="rounded-2xl border border-[#d7ece0] bg-[#f4fbf7] px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[#173f2a]">{firstName ? `${firstName}'s picks` : "Make it yours"}</p>
              <p className="mt-0.5 text-xs leading-5 text-[#3c6a4f]">
                {profile
                  ? `${profile.favouriteFood || "Food"} around ${profile.homeCity || region}, with a ${priceCap === "all" ? "flexible" : `$${priceCap}`} budget.`
                  : "Save your city, budget, food tastes, and alerts so mealspy opens tuned to you."}
              </p>
            </div>
            <Link href="/account" className="flex h-9 flex-shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-semibold text-[#1a6b3c] shadow-sm transition hover:bg-[#edf8f1]">
              <User className="h-3.5 w-3.5" />
              {profile ? "Edit" : "Set up"}
            </Link>
          </div>
        </section>

        {/* Status + CTA */}
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#ece8e3] bg-white px-4 py-3">
          <p className="text-sm text-[#6b6560]">
            {loading ? (
              <span className="animate-pulse">Finding places…</span>
            ) : (
              <>{filtered.length} place{filtered.length !== 1 ? "s" : ""} within {radius} km</>
            )}
          </p>
          <div className="flex items-center gap-2">
            <Link href="/map" className="flex items-center gap-1.5 rounded-lg border border-[#ece8e3] bg-white px-3 py-2 text-xs font-semibold text-[#6b6560] transition hover:border-[#1a6b3c] hover:text-[#1a6b3c]">
              <Map className="h-3.5 w-3.5" />
              Map
            </Link>
            <Link href="/list" className="flex items-center gap-1.5 rounded-lg bg-[#e8472a] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#c73d22]">
              <Plus className="h-3.5 w-3.5" />
              List
            </Link>
            <Link href="/food/manage" className="flex items-center gap-1.5 rounded-lg border border-[#ece8e3] bg-white px-3 py-2 text-xs font-semibold text-[#6b6560] transition hover:border-[#e8472a] hover:text-[#e8472a]">
              <Pencil className="h-3.5 w-3.5" />
              Manage
            </Link>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide lg:grid lg:grid-cols-2 lg:overflow-visible">
          {([
            ["smart", "Best match", Sparkles],
            ["deals", "Deals", Tag],
            ["price", "Cheapest", WalletCards],
            ["nearby", "Nearest", Navigation],
          ] as const).map(([mode, label, Icon]) => (
            <button
              key={mode}
              onClick={() => setSortMode(mode)}
              className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${sortMode === mode ? "bg-[#1a1714] text-white" : "bg-white text-[#6b6560] hover:bg-[#ece8e3]"}`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
        </aside>

        <section className="min-w-0">

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
        {!loading && coords !== null && filtered.length === 0 && (
          <div className="rounded-2xl border border-[#ece8e3] bg-white px-6 py-12 text-center">
            <p className="text-4xl mb-4">🍽️</p>
            <p className="text-lg font-semibold text-[#1a1714]">Nothing within {radius} km</p>
            <p className="mt-1.5 text-sm text-[#6b6560] max-w-xs mx-auto">
              Try a wider radius or be the first to list a place here — it&apos;s free.
            </p>
            <div className="mt-5 flex flex-col items-center gap-2">
              {radius < 30 && (
                <button onClick={() => setRadius(Math.min(radius + 10, 30))} className="btn-primary mx-auto">
                  Expand to {Math.min(radius + 10, 30)} km
                </button>
              )}
              <Link href="/list" className="btn-ghost mx-auto">List a place</Link>
            </div>
          </div>
        )}

        {/* Venue cards */}
        <div className="grid gap-3 xl:grid-cols-2">
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
        </section>
      </main>
    </div>
  );
}
