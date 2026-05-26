"use client";

import {
  Beer,
  Building2,
  LocateFixed,
  Menu,
  SlidersHorizontal,
  Store,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Listing, ListingType, money, regionCentres, regions, styles, type Venue } from "@/lib/data";
import BeerMap, { type MapPlace } from "./BeerMap";

type Tab = ListingType;
type SortMode = "price" | "distance" | "fresh";
type Panel = "filters" | "post" | "data" | null;

const tabs: Array<{ label: string; type: Tab; icon: React.ReactNode }> = [
  { label: "Bottle shops", type: "store", icon: <Store className="h-4 w-4" /> },
  { label: "Pubs", type: "bar", icon: <Beer className="h-4 w-4" /> },
  { label: "Local makers", type: "maker", icon: <Building2 className="h-4 w-4" /> },
];

export default function YourBeerApp() {
  const [tab, setTab] = useState<Tab>("store");
  const [panel, setPanel] = useState<Panel>(null);
  const [region, setRegion] = useState("Wellington");
  const [coords, setCoords] = useState(regionCentres.Wellington);
  const [radius, setRadius] = useState(5);
  const [style, setStyle] = useState("all");
  const [sort, setSort] = useState<SortMode>("price");
  const [results, setResults] = useState<Listing[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
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

    fetch(`/api/venues?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setVenues(Array.isArray(data.venues) ? data.venues : []))
      .catch(() => setVenues([]));
  }, [coords, radius, region, style, tab]);

  const sorted = useMemo(() => {
    return [...results].sort((a, b) => {
      if (sort === "distance") return (a.distanceKm ?? 99) - (b.distanceKm ?? 99);
      if (sort === "fresh") return a.updatedMinutesAgo - b.updatedMinutesAgo;
      return a.price - b.price;
    });
  }, [results, sort]);

  const best = sorted[0];
  const mapPlaces: MapPlace[] = useMemo(() => {
    const priced = sorted.map((listing) => ({
      id: listing.id,
      type: listing.type,
      venue: listing.venue,
      product: listing.product,
      price: listing.price,
      unit: listing.unit,
      lat: listing.lat,
      lng: listing.lng,
      suburb: listing.suburb,
      distanceKm: listing.distanceKm,
      hasPrice: true,
    }));

    const pricedNames = new Set(priced.map((listing) => `${listing.venue}-${listing.suburb}`.toLowerCase()));
    const unpriced = venues
      .filter((venue) => !pricedNames.has(`${venue.name}-${venue.suburb}`.toLowerCase()))
      .map((venue) => ({
        id: venue.id,
        type: venue.type,
        venue: venue.name,
        lat: venue.lat,
        lng: venue.lng,
        suburb: venue.suburb,
        distanceKm: venue.distanceKm,
        hasPrice: false,
      }));

    return [...priced, ...unpriced];
  }, [sorted, venues]);

  const activeListing = sorted.find((listing) => listing.id === activeId) ?? best;
  const activePlace = mapPlaces.find((place) => place.id === activeId) ?? mapPlaces[0];

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
    <div className="h-dvh overflow-hidden bg-[#fbf6ea] text-[#1f1b16]">
      <header className="flex h-14 items-center justify-between border-b border-black/10 bg-[#fbf6ea] px-3">
        <a href="#top" className="flex items-center gap-2 text-lg font-black">
          <span className="grid h-8 w-8 place-items-center rounded bg-[#245c3b] text-white">
            <Beer className="h-4 w-4" />
          </span>
          yourbeer
        </a>
        <button
          type="button"
          onClick={() => setPanel("data")}
          className="grid h-9 w-9 place-items-center rounded bg-white shadow-sm"
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      <nav className="grid h-[52px] grid-cols-3 gap-1 border-b border-black/10 bg-[#fbf6ea] p-1">
        {tabs.map((item) => (
          <button
            key={item.type}
            onClick={() => setTab(item.type)}
            className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-sm font-black ${
              tab === item.type ? "bg-[#245c3b] text-white" : "bg-white text-black/60"
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <main id="top" className="grid h-[calc(100dvh-108px)] grid-rows-[auto_1fr] gap-2 overflow-hidden p-2 lg:grid-cols-[320px_1fr] lg:grid-rows-1 lg:p-4">
        <aside className="hidden rounded-lg border border-black/10 bg-white p-4 shadow-sm lg:block">
          <Controls
            region={region}
            chooseRegion={chooseRegion}
            locate={locate}
            radius={radius}
            setRadius={setRadius}
            style={style}
            setStyle={setStyle}
            sort={sort}
            setSort={setSort}
            notice={notice}
          />
        </aside>

        <section className="min-h-0 overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-black/10 px-3 py-2">
            <div>
              <h1 className="text-lg font-black">{tabs.find((item) => item.type === tab)?.label}</h1>
              <p className="text-xs font-bold text-black/45">
                {loading ? "Loading" : `${mapPlaces.length} nearby`} {best ? `· from ${money(best.price)}` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setPanel("filters")} className="button bg-white text-[#245c3b] ring-1 ring-black/10 lg:hidden">
                <SlidersHorizontal className="h-4 w-4" />
              </button>
              <button onClick={() => setPanel("post")} className="button bg-[#245c3b] text-white">
                Post
              </button>
            </div>
          </div>

          <div className="grid h-[calc(100%-57px)] min-h-0 grid-rows-[44%_56%] lg:grid-cols-[1fr_360px] lg:grid-rows-1">
            <div className="min-h-0 border-b border-black/10 lg:border-b-0 lg:border-r">
              <BeerMap listings={mapPlaces} centre={coords} activeId={activePlace?.id ?? null} onActive={setActiveId} />
            </div>
            <div className="min-h-0 overflow-auto p-2">
              <div className="grid gap-2">
                {sorted.map((listing) => (
                  <article
                    key={listing.id}
                    className={`rounded-lg border bg-white p-3 shadow-sm ${
                      activeListing?.id === listing.id ? "border-[#245c3b]" : "border-black/10"
                    }`}
                    onMouseEnter={() => setActiveId(listing.id)}
                    onClick={() => setActiveId(listing.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-black leading-tight">{listing.product}</h2>
                        <p className="mt-1 text-sm font-bold text-black/55">
                          {listing.venue} · {(listing.distanceKm ?? 0).toFixed(1)} km
                        </p>
                        <p className="mt-1 text-sm text-black/55">{listing.special}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-[#245c3b]">{money(listing.price)}</p>
                        <p className="text-xs font-bold text-black/45">{listing.unit}</p>
                      </div>
                    </div>
                  </article>
                ))}
                {mapPlaces.filter((place) => !place.hasPrice).map((place) => (
                  <article
                    key={place.id}
                    className={`rounded-lg border bg-white p-3 shadow-sm ${
                      activePlace?.id === place.id ? "border-[#245c3b]" : "border-black/10"
                    }`}
                    onMouseEnter={() => setActiveId(place.id)}
                    onClick={() => setActiveId(place.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-black leading-tight">{place.venue}</h2>
                        <p className="mt-1 text-sm font-bold text-black/55">
                          {place.suburb} · {(place.distanceKm ?? 0).toFixed(1)} km
                        </p>
                        <p className="mt-1 text-sm text-black/55">No price yet</p>
                      </div>
                      <p className="rounded bg-black/5 px-2 py-1 text-xs font-black text-black/55">venue</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {panel && (
        <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setPanel(null)}>
          <div
            className="absolute bottom-0 left-0 right-0 max-h-[88dvh] overflow-auto rounded-t-2xl bg-[#fbf6ea] p-4 shadow-2xl lg:left-auto lg:top-0 lg:h-full lg:w-[420px] lg:max-h-none lg:rounded-l-2xl lg:rounded-tr-none"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-black">
                {panel === "filters" ? "Search" : panel === "post" ? "Post" : "Data"}
              </h2>
              <button onClick={() => setPanel(null)} className="grid h-9 w-9 place-items-center rounded bg-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {panel === "filters" && (
              <Controls
                region={region}
                chooseRegion={chooseRegion}
                locate={locate}
                radius={radius}
                setRadius={setRadius}
                style={style}
                setStyle={setStyle}
                sort={sort}
                setSort={setSort}
                notice={notice}
              />
            )}
            {panel === "post" && (
              <Forms
                submitApplication={submitApplication}
                submitListing={submitListing}
              />
            )}
            {panel === "data" && <DataPlan />}
          </div>
        </div>
      )}
    </div>
  );
}

function Controls({
  region,
  chooseRegion,
  locate,
  radius,
  setRadius,
  style,
  setStyle,
  sort,
  setSort,
  notice,
}: {
  region: string;
  chooseRegion: (region: string) => void;
  locate: () => void;
  radius: number;
  setRadius: (radius: number) => void;
  style: string;
  setStyle: (style: string) => void;
  sort: SortMode;
  setSort: (sort: SortMode) => void;
  notice: string;
}) {
  return (
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
  );
}

function Forms({
  submitApplication,
  submitListing,
}: {
  submitApplication: (event: FormEvent<HTMLFormElement>) => void;
  submitListing: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="grid gap-4">
      <section className="rounded-lg border border-black/10 bg-white p-4">
        <h3 className="font-black">Apply</h3>
        <form onSubmit={submitApplication} className="mt-3 grid gap-3">
          <select name="applicationType" className="control">
            <option value="venue">Pub or bottle shop</option>
            <option value="maker">Local maker</option>
          </select>
          <input name="businessName" required placeholder="Business name" className="control" />
          <input name="contactEmail" required type="email" placeholder="Email" className="control" />
          <input name="licence" required placeholder="Licence details" className="control" />
          <button className="button bg-[#245c3b] text-white">Send</button>
        </form>
      </section>

      <section className="rounded-lg border border-black/10 bg-white p-4">
        <h3 className="font-black">Post price</h3>
        <form onSubmit={submitListing} className="mt-3 grid gap-3">
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
          <button className="button bg-[#245c3b] text-white">Save price</button>
        </form>
      </section>
    </div>
  );
}

function DataPlan() {
  return (
    <div className="space-y-3">
      {[
        ["Week 1", "Manually add 20 common products in Wellington and Auckland."],
        ["Venues", "Ask pubs to post one nightly special. Give them the Post panel link."],
        ["Makers", "Get 10 local breweries/cideries to apply and list direct packs."],
        ["Shoppers", "Add receipt/photo upload next, then confirmations."],
      ].map(([title, text]) => (
        <div key={title} className="rounded-lg border border-black/10 bg-white p-4">
          <h3 className="font-black">{title}</h3>
          <p className="mt-1 text-sm text-black/60">{text}</p>
        </div>
      ))}
      <div className="rounded-lg border border-black/10 bg-white p-4">
        <h3 className="font-black">Bulk import fields</h3>
        <p className="mt-1 text-sm text-black/60">
          type, venue, product, style, price, unit, suburb, region, lat, lng, special
        </p>
      </div>
    </div>
  );
}
