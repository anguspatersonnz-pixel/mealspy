"use client";

import {
  Beer,
  Building2,
  LocateFixed,
  MapPinned,
  Navigation,
  Search,
  SlidersHorizontal,
  Store,
  X,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Listing, ListingType, money, regionCentres, regions, styles, type Venue } from "@/lib/data";

type Tab = ListingType;
type SortMode = "price" | "distance" | "fresh";

const tabs: Array<{ label: string; type: Tab; emoji: string }> = [
  { label: "Bottle shops", type: "store", emoji: "🏪" },
  { label: "Pubs", type: "bar", emoji: "🍺" },
  { label: "Makers", type: "maker", emoji: "🏭" },
];

export default function YourBeerApp() {
  const [tab, setTab] = useState<Tab>("store");
  const [region, setRegion] = useState("Auckland");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState(5);
  const [style, setStyle] = useState("all");
  const [sort, setSort] = useState<SortMode>("distance");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Listing[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationAsked, setLocationAsked] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showPost, setShowPost] = useState(false);
  const [postNotice, setPostNotice] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: "geolocation" }).then((r) => {
        if (r.state === "granted") locate();
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!coords) return;
    setLoading(true);
    const params = new URLSearchParams({
      region, lat: String(coords.lat), lng: String(coords.lng),
      radiusKm: String(radius), type: tab, style, openTonight: "true",
    });
    Promise.all([
      fetch(`/api/nearby?${params}`).then((r) => r.json()).catch(() => ({ listings: [] })),
      fetch(`/api/venues?${params}`).then((r) => r.json()).catch(() => ({ venues: [] })),
    ]).then(([listData, venueData]) => {
      setResults(Array.isArray(listData.listings) ? listData.listings : []);
      setVenues(Array.isArray(venueData.venues) ? venueData.venues : []);
    }).finally(() => setLoading(false));
  }, [coords, radius, region, style, tab]);

  function locate() {
    setLocationAsked(true);
    if (!navigator.geolocation) { chooseRegion("Auckland"); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setRegion("Near me"); setLocating(false); },
      () => { chooseRegion("Auckland"); setLocating(false); },
      { enableHighAccuracy: true, timeout: 6000 },
    );
  }

  function chooseRegion(r: string) {
    setRegion(r);
    setCoords(regionCentres[r] ?? regionCentres.Auckland);
  }

  const sorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    const searched = !q ? results : results.filter((l) =>
      [l.product, l.venue, l.suburb, l.special, l.style].some((f) => f?.toLowerCase().includes(q))
    );
    return [...searched].sort((a, b) => {
      if (sort === "distance") return (a.distanceKm ?? 99) - (b.distanceKm ?? 99);
      if (sort === "fresh") return a.updatedMinutesAgo - b.updatedMinutesAgo;
      return a.price - b.price;
    });
  }, [query, results, sort]);

  const unpricedVenues = useMemo(() => {
    const pricedNames = new Set(sorted.map((l) => `${l.venue}-${l.suburb}`.toLowerCase()));
    const q = query.trim().toLowerCase();
    return venues
      .filter((v) => !pricedNames.has(`${v.name}-${v.suburb}`.toLowerCase()))
      .filter((v) => !q || [v.name, v.suburb, v.type].some((f) => f?.toLowerCase().includes(q)));
  }, [query, sorted, venues]);

  async function submitListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const listingRegion = String(form.get("region") ?? region);
    const fallback = regionCentres[listingRegion] ?? coords ?? regionCentres.Auckland;
    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: form.get("type"), venue: form.get("venue"), product: form.get("product"),
        style: form.get("style"), price: form.get("price"), unit: form.get("unit"),
        suburb: form.get("suburb"), special: form.get("special"), region: listingRegion,
        lat: Number(form.get("lat") || fallback.lat), lng: Number(form.get("lng") || fallback.lng),
        openTonight: true,
      }),
    });
    const data = await res.json();
    setPostNotice(res.ok ? "Price saved!" : data.error);
    if (res.ok) { event.currentTarget.reset(); setResults((c) => [data.listing, ...c]); }
  }

  // Location splash
  if (!locationAsked && !coords) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-white px-6 text-center">
        <span className="text-6xl">🍺</span>
        <div>
          <h1 className="text-3xl font-black text-[#1a1714]">yourbeer</h1>
          <p className="mt-2 text-sm text-[#a09c98]">Cheap beer and deals near you</p>
        </div>
        <div className="w-full max-w-xs space-y-2.5">
          <button onClick={locate} className="w-full rounded-2xl bg-[#245c3b] py-3.5 text-sm font-bold text-white flex items-center justify-center gap-2">
            <LocateFixed className="h-4 w-4" /> Use my location
          </button>
          <button onClick={() => { setLocationAsked(true); chooseRegion("Auckland"); }} className="w-full rounded-2xl border border-[#ece8e3] py-3.5 text-sm font-semibold text-[#6b6560]">
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
        <div className="relative flex h-14 items-center justify-center px-4">
          <button onClick={locate} disabled={locating} className="absolute left-4 flex items-center gap-1 text-xs font-semibold text-[#6b6560] disabled:opacity-50">
            <LocateFixed className={`h-4 w-4 ${locating ? "animate-pulse text-[#245c3b]" : ""}`} />
            <span className="max-w-[90px] truncate">{locating ? "Locating…" : region === "Near me" ? "Near me" : region}</span>
          </button>
          <span className="text-lg font-black tracking-tight text-[#1a1714]">🍺 yourbeer</span>
          <div className="absolute right-4 flex items-center gap-2">
            <Link href="/" className="rounded-lg border border-[#ece8e3] px-2.5 py-1 text-xs font-bold text-[#e8472a]">🍜 mealspy</Link>
            <button onClick={() => setShowFilters((v) => !v)} className={`rounded-xl border p-2 ${showFilters ? "border-[#245c3b] bg-[#f0faf4] text-[#245c3b]" : "border-[#ece8e3] text-[#6b6560]"}`}>
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-2.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#c0bbb7]" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search beer, store, or suburb…"
              className="h-10 w-full rounded-xl bg-[#f5f5f5] pl-9 pr-8 text-sm text-[#1a1714] outline-none placeholder:text-[#c0bbb7] focus:bg-white focus:ring-2 focus:ring-[#245c3b]/20 transition"
            />
            {query && <button onClick={() => setQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#c0bbb7]"><X className="h-4 w-4" /></button>}
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="border-t border-[#ece8e3] bg-white px-4 py-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <label className="block">
              <span className="text-xs font-semibold text-[#a09c98]">City</span>
              <select value={region} onChange={(e) => chooseRegion(e.target.value)} className="control mt-1 w-full text-sm">{regions.map((r) => <option key={r}>{r}</option>)}</select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-[#a09c98]">Radius — {radius} km</span>
              <input type="range" min={1} max={20} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="mt-3 w-full accent-[#245c3b]" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-[#a09c98]">Style</span>
              <select value={style} onChange={(e) => setStyle(e.target.value)} className="control mt-1 w-full text-sm">
                <option value="all">Any style</option>
                {styles.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-[#a09c98]">Sort</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as SortMode)} className="control mt-1 w-full text-sm">
                <option value="distance">Nearest first</option>
                <option value="price">Cheapest first</option>
                <option value="fresh">Newest first</option>
              </select>
            </label>
          </div>
        )}

        {/* Tab chips */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-2.5 pt-0 scrollbar-hide">
          {tabs.map((t) => (
            <button key={t.type} onClick={() => setTab(t.type)} className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold ${tab === t.type ? "bg-[#245c3b] text-white" : "bg-[#f5f5f5] text-[#6b6560]"}`}>
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* ── List ── */}
      <main className="flex-1 px-3 py-3 space-y-2.5 max-w-2xl mx-auto w-full">

        {/* Status row */}
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-[#a09c98]">
            {loading ? "Finding places…" : `${sorted.length + unpricedVenues.length} place${sorted.length + unpricedVenues.length !== 1 ? "s" : ""} within ${radius} km`}
          </p>
          {sorted.length > 0 && !loading && (
            <span className="text-xs font-semibold text-[#245c3b]">🍺 from {money(sorted[0].price)}</span>
          )}
        </div>

        {/* Empty state */}
        {!loading && coords !== null && sorted.length === 0 && unpricedVenues.length === 0 && (
          <div className="rounded-2xl bg-white px-6 py-12 text-center shadow-sm">
            <p className="text-4xl mb-3">🍺</p>
            <p className="font-semibold text-[#1a1714]">Nothing within {radius} km</p>
            <p className="mt-1 text-sm text-[#a09c98]">Try a wider radius or post a price.</p>
            <div className="mt-4 flex flex-col items-center gap-2">
              {radius < 20 && <button onClick={() => setRadius(Math.min(radius + 5, 20))} className="rounded-2xl bg-[#245c3b] px-5 py-2.5 text-sm font-bold text-white">Expand to {Math.min(radius + 5, 20)} km</button>}
              <button onClick={() => setShowPost(true)} className="text-sm font-semibold text-[#245c3b] underline">Post a price</button>
            </div>
          </div>
        )}

        {/* Priced listings */}
        <div className="grid gap-3">
          {sorted.map((listing) => (
            <article key={listing.id} className="rounded-2xl bg-white shadow-sm overflow-hidden">
              <div className="px-4 py-4 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold text-[#1a1714] leading-snug">{listing.product}</h2>
                  <p className="mt-1 text-sm text-[#a09c98]">
                    {listing.venue}
                    {listing.distanceKm != null && <> · {listing.distanceKm.toFixed(1)} km</>}
                  </p>
                  {listing.special && <p className="mt-1 text-xs font-medium text-[#245c3b]">{listing.special}</p>}
                  <p className="mt-0.5 text-xs text-[#c0bbb7]">{listing.style} · {listing.unit}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-xl font-bold text-[#245c3b]">{money(listing.price)}</p>
                  <p className="text-[11px] text-[#a09c98]">{listing.unit}</p>
                </div>
              </div>
              {listing.suburb && (
                <div className="flex items-center gap-2 border-t border-[#f3efeb] px-4 py-2">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${listing.venue} ${listing.suburb}`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg bg-[#faf9f7] px-2.5 py-1.5 text-xs font-semibold text-[#6b6560]"
                  >
                    <Navigation className="h-3.5 w-3.5" /> Directions
                  </a>
                  <span className="text-xs text-[#c0bbb7]">{listing.suburb}</span>
                </div>
              )}
            </article>
          ))}

          {/* Venues without prices */}
          {unpricedVenues.map((venue) => (
            <article key={venue.id} className="rounded-2xl bg-white shadow-sm overflow-hidden opacity-75">
              <div className="px-4 py-4 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold text-[#1a1714]">{venue.name}</h2>
                  <p className="mt-1 text-sm text-[#a09c98]">
                    {venue.suburb}
                    {venue.distanceKm != null && <> · {venue.distanceKm.toFixed(1)} km</>}
                  </p>
                </div>
                <span className="rounded-lg bg-[#f5f5f5] px-2 py-1 text-[11px] font-medium text-[#a09c98]">no price</span>
              </div>
            </article>
          ))}
        </div>
      </main>

      {/* ── Post price sheet ── */}
      {showPost && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end" onClick={() => setShowPost(false)}>
          <div className="w-full max-h-[88dvh] overflow-auto rounded-t-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#1a1714]">Post a price</h2>
              <button onClick={() => setShowPost(false)} className="rounded-lg border border-[#ece8e3] p-1.5 text-[#6b6560]"><X className="h-4 w-4" /></button>
            </div>
            {postNotice && <p className={`mb-3 rounded-xl px-3 py-2 text-sm font-semibold ${postNotice.includes("!") ? "bg-[#f0faf4] text-[#245c3b]" : "bg-[#fff4f2] text-[#e8472a]"}`}>{postNotice}</p>}
            <form onSubmit={submitListing} className="grid gap-3">
              <input name="venue" required placeholder="Venue name" className="control" />
              <select name="type" className="control">
                <option value="store">Bottle shop</option>
                <option value="bar">Pub</option>
                <option value="maker">Local maker</option>
              </select>
              <input name="product" required placeholder="Product (e.g. Heineken 330ml)" className="control" />
              <select name="style" className="control">
                {styles.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input name="price" required min="0" step="0.1" type="number" placeholder="Price $" className="control" />
                <input name="unit" required placeholder="Unit (e.g. 6-pack)" className="control" />
              </div>
              <input name="special" placeholder="Special / note (optional)" className="control" />
              <input name="suburb" required placeholder="Suburb" className="control" />
              <select name="region" defaultValue={regions.includes(region) ? region : "Auckland"} className="control">
                {regions.map((r) => <option key={r}>{r}</option>)}
              </select>
              <button className="w-full rounded-2xl bg-[#245c3b] py-3 text-sm font-bold text-white">Save price</button>
            </form>
          </div>
        </div>
      )}

      {/* ── Bottom navigation ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center border-t border-[#ece8e3] bg-white">
        <button onClick={() => setTab("store")} className={`flex flex-1 flex-col items-center gap-0.5 ${tab === "store" && !showPost ? "text-[#245c3b]" : "text-[#a09c98]"}`}>
          <Store className="h-5 w-5" />
          <span className="text-[10px] font-semibold">Shops</span>
        </button>
        <button onClick={() => setTab("bar")} className={`flex flex-1 flex-col items-center gap-0.5 ${tab === "bar" && !showPost ? "text-[#245c3b]" : "text-[#a09c98]"}`}>
          <Beer className="h-5 w-5" />
          <span className="text-[10px] font-semibold">Pubs</span>
        </button>
        <button onClick={() => setTab("maker")} className={`flex flex-1 flex-col items-center gap-0.5 ${tab === "maker" && !showPost ? "text-[#245c3b]" : "text-[#a09c98]"}`}>
          <Building2 className="h-5 w-5" />
          <span className="text-[10px] font-semibold">Makers</span>
        </button>
        <Link href="/map" className="flex flex-1 flex-col items-center gap-0.5 text-[#a09c98]">
          <MapPinned className="h-5 w-5" />
          <span className="text-[10px] font-semibold">Map</span>
        </Link>
        <button onClick={() => setShowPost(true)} className={`flex flex-1 flex-col items-center gap-0.5 ${showPost ? "text-[#245c3b]" : "text-[#a09c98]"}`}>
          <span className="text-xl leading-none">➕</span>
          <span className="text-[10px] font-semibold">Post</span>
        </button>
        <Link href="/" className="flex flex-1 flex-col items-center gap-0.5 text-[#a09c98]">
          <span className="text-xl leading-none">🍜</span>
          <span className="text-[10px] font-semibold">mealspy</span>
        </Link>
      </nav>
    </div>
  );
}
