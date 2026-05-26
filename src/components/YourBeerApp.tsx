"use client";

import { Beer, Building2, LocateFixed, MapPin, Store } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Listing, ListingType, money, regionCentres, regions, styles } from "@/lib/data";
import BeerMap from "./BeerMap";

type Tab = ListingType;
type SortMode = "price" | "distance" | "fresh";

const tabs: Array<{ label: string; type: Tab; icon: React.ReactNode }> = [
  { label: "Bottle shops", type: "store", icon: <Store className="h-4 w-4" /> },
  { label: "Pubs", type: "bar", icon: <Beer className="h-4 w-4" /> },
  { label: "Local makers", type: "maker", icon: <Building2 className="h-4 w-4" /> },
];

export default function YourBeerApp() {
  const [tab, setTab] = useState<Tab>("store");
  const [region, setRegion] = useState("Wellington");
  const [coords, setCoords] = useState(regionCentres.Wellington);
  const [radius, setRadius] = useState(5);
  const [style, setStyle] = useState("all");
  const [sort, setSort] = useState<SortMode>("price");
  const [results, setResults] = useState<Listing[]>([]);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({
      region,
      lat: String(coords.lat),
      lng: String(coords.lng),
      radiusKm: String(radius),
      type: tab,
      style,
      openTonight: "true",
    });

    setLoading(true);
    fetch(`/api/nearby?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setResults(Array.isArray(data.listings) ? data.listings : []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [coords, radius, region, style, tab]);

  const sorted = useMemo(() => {
    return [...results].sort((a, b) => {
      if (sort === "distance") return (a.distanceKm ?? 99) - (b.distanceKm ?? 99);
      if (sort === "fresh") return a.updatedMinutesAgo - b.updatedMinutesAgo;
      return a.price - b.price;
    });
  }, [results, sort]);

  const best = sorted[0];
  const activeListing = sorted.find((listing) => listing.id === activeId) ?? best;

  function chooseRegion(nextRegion: string) {
    setRegion(nextRegion);
    setCoords(regionCentres[nextRegion] ?? regionCentres.Wellington);
  }

  function locate() {
    if (!navigator.geolocation) {
      setNotice("Location unavailable.");
      return;
    }
    setNotice("Finding you...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setNotice("Using your location.");
      },
      () => setNotice("Could not use location."),
      { enableHighAccuracy: true, timeout: 6000 },
    );
  }

  async function submitApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: form.get("applicationType"),
        businessName: form.get("businessName"),
        contactEmail: form.get("contactEmail"),
        licence: form.get("licence"),
        region,
      }),
    });
    const data = await response.json();
    setNotice(response.ok ? "Application received." : data.error);
    if (response.ok) event.currentTarget.reset();
  }

  async function submitListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: form.get("type"),
        venue: form.get("venue"),
        product: form.get("product"),
        style: form.get("style"),
        price: form.get("price"),
        unit: form.get("unit"),
        suburb: form.get("suburb"),
        special: form.get("special"),
        region,
        lat: coords.lat,
        lng: coords.lng,
        openTonight: true,
      }),
    });
    const data = await response.json();
    setNotice(response.ok ? "Price saved." : data.error);
    if (response.ok) {
      event.currentTarget.reset();
      setResults((current) => [data.listing, ...current]);
      setActiveId(data.listing.id);
    }
  }

  return (
    <div className="min-h-screen bg-[#fbf6ea] text-[#1f1b16]">
      <header className="sticky top-0 z-30 border-b border-black/10 bg-[#fbf6ea]/95 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <a href="#top" className="flex items-center gap-2 text-lg font-black">
            <span className="grid h-8 w-8 place-items-center rounded bg-[#245c3b] text-white">
              <Beer className="h-4 w-4" />
            </span>
            yourbeer
          </a>
          <div className="flex gap-1 rounded-lg bg-white p-1 shadow-sm">
            {tabs.map((item) => (
              <button
                key={item.type}
                onClick={() => setTab(item.type)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-bold ${
                  tab === item.type ? "bg-[#245c3b] text-white" : "text-black/60 hover:bg-black/5"
                }`}
              >
                {item.icon}
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main id="top" className="mx-auto max-w-6xl px-4 py-6">
        <section className="grid gap-4 md:grid-cols-[1fr_320px]">
          <div className="rounded-lg bg-[#1f1b16] p-6 text-white md:p-10">
            <p className="text-sm font-bold text-white/55">R18 price search</p>
            <h1 className="mt-3 max-w-2xl text-4xl font-black leading-none sm:text-6xl">
              Cheapest drinks near you.
            </h1>
            <p className="mt-4 max-w-xl text-white/65">
              Bottle shops, pubs, and local makers. Simple prices. Nearby first.
            </p>
          </div>

          <aside className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
            <p className="text-sm font-black uppercase text-black/45">Best now</p>
            {best ? (
              <div className="mt-3">
                <h2 className="text-xl font-black">{best.product}</h2>
                <p className="mt-1 text-sm font-bold text-black/55">{best.venue}</p>
                <p className="mt-4 text-4xl font-black text-[#245c3b]">{money(best.price)}</p>
                <p className="text-sm font-bold text-black/45">{best.unit}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-black/50">{loading ? "Loading..." : "No matches."}</p>
            )}
          </aside>
        </section>

        <section className="mt-4 grid gap-4 md:grid-cols-[260px_1fr]">
          <aside className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
            <div className="space-y-3">
              <label className="block">
                <span className="text-sm font-bold text-black/55">City</span>
                <select value={region} onChange={(event) => chooseRegion(event.target.value)} className="control mt-1 w-full">
                  {regions.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <button onClick={locate} className="button w-full bg-[#245c3b] text-white">
                <LocateFixed className="h-4 w-4" />
                Near me
              </button>
              <label className="block">
                <span className="flex justify-between text-sm font-bold text-black/55">
                  Radius <strong>{radius} km</strong>
                </span>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={radius}
                  onChange={(event) => setRadius(Number(event.target.value))}
                  className="mt-2 w-full accent-[#245c3b]"
                />
              </label>
              <select value={style} onChange={(event) => setStyle(event.target.value)} className="control w-full">
                <option value="all">Any style</option>
                {styles.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)} className="control w-full">
                <option value="price">Cheapest</option>
                <option value="distance">Nearest</option>
                <option value="fresh">Newest</option>
              </select>
              {notice && <p className="rounded bg-[#edf7ef] p-2 text-sm font-bold text-[#245c3b]">{notice}</p>}
            </div>
          </aside>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-2xl font-black">{tabs.find((item) => item.type === tab)?.label}</h2>
              <span className="text-sm font-bold text-black/45">{sorted.length} found</span>
            </div>
            <div className="mb-3">
              <BeerMap listings={sorted} centre={coords} activeId={activeListing?.id ?? null} onActive={setActiveId} />
            </div>
            <div className="grid gap-2">
              {sorted.map((listing) => (
                <article
                  key={listing.id}
                  className={`grid gap-3 rounded-lg border bg-white p-4 shadow-sm sm:grid-cols-[1fr_auto] ${
                    activeListing?.id === listing.id ? "border-[#245c3b]" : "border-black/10"
                  }`}
                  onMouseEnter={() => setActiveId(listing.id)}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black">{listing.product}</h3>
                      {listing.verified && <span className="rounded bg-[#edf7ef] px-2 py-0.5 text-xs font-black text-[#245c3b]">checked</span>}
                    </div>
                    <p className="mt-1 text-sm font-bold text-black/55">
                      {listing.venue} · {listing.suburb} · {(listing.distanceKm ?? 0).toFixed(1)} km
                    </p>
                    <p className="mt-2 text-sm text-black/60">{listing.special}</p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-3xl font-black text-[#245c3b]">{money(listing.price)}</p>
                    <p className="text-sm font-bold text-black/45">{listing.unit}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-black">Apply</h2>
            <p className="mt-1 text-sm text-black/55">For pubs, bottle shops, and local makers.</p>
            <form onSubmit={submitApplication} className="mt-4 grid gap-3">
              <select name="applicationType" className="control">
                <option value="venue">Pub or bottle shop</option>
                <option value="maker">Local maker</option>
              </select>
              <input name="businessName" required placeholder="Business name" className="control" />
              <input name="contactEmail" required type="email" placeholder="Email" className="control" />
              <input name="licence" required placeholder="Licence details" className="control" />
              <button className="button bg-[#245c3b] text-white">Send</button>
            </form>
          </div>

          <div className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-black">Post price</h2>
            <p className="mt-1 text-sm text-black/55">For approved sellers.</p>
            <form onSubmit={submitListing} className="mt-4 grid gap-3 sm:grid-cols-2">
              <input name="venue" required placeholder="Venue" className="control" />
              <select name="type" className="control">
                <option value="store">Bottle shop</option>
                <option value="bar">Pub</option>
                <option value="maker">Local maker</option>
              </select>
              <input name="product" required placeholder="Product" className="control" />
              <select name="style" className="control">
                {styles.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              <input name="price" required min="0" step="0.1" type="number" placeholder="Price" className="control" />
              <input name="unit" required placeholder="Unit" className="control" />
              <input name="suburb" required placeholder="Suburb" className="control" />
              <input name="special" placeholder="Special" className="control" />
              <button className="button bg-[#245c3b] text-white sm:col-span-2">Save price</button>
            </form>
          </div>
        </section>

        <section className="mt-8 rounded-lg border border-black/10 bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-black">Getting data</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Seller posts", "Give shops and pubs a 30-second price form."],
              ["Receipts", "Let users upload photos for checking."],
              ["Weekly checks", "Start with 20 common products per city."],
              ["Maker drops", "Local makers post their own packs."],
            ].map(([title, text]) => (
              <div key={title} className="rounded border border-black/10 p-3">
                <h3 className="font-black">{title}</h3>
                <p className="mt-1 text-sm text-black/55">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-8 text-sm font-bold text-black/45">
        R18. No checkout yet.
      </footer>
    </div>
  );
}
