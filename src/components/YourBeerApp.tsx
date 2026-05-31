"use client";

import {
  Beer,
  Bell,
  Building2,
  LocateFixed,
  MapPinned,
  Menu,
  Search,
  SlidersHorizontal,
  Store,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Listing, ListingType, money, regionCentres, regions, styles, type Venue } from "@/lib/data";

type Tab = ListingType;
type SortMode = "price" | "distance" | "fresh";
type Panel = "filters" | "post" | "menu" | null;
type MenuAction = Tab | "map" | "post";

const tabs: Array<{ label: string; type: Tab; icon: React.ReactNode }> = [
  { label: "Bottle shops", type: "store", icon: <Store className="h-4 w-4" /> },
  { label: "Pubs", type: "bar", icon: <Beer className="h-4 w-4" /> },
  { label: "Local makers", type: "maker", icon: <Building2 className="h-4 w-4" /> },
];

export default function YourBeerApp() {
  const [tab, setTab] = useState<Tab>("store");
  const [panel, setPanel] = useState<Panel>(null);
  const [region, setRegion] = useState("Auckland");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(regionCentres.Auckland);
  const [radius, setRadius] = useState(5);
  const [style, setStyle] = useState("all");
  const [sort, setSort] = useState<SortMode>("distance");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Listing[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [askedForLocation, setAskedForLocation] = useState(false);

  useEffect(() => {
    if (askedForLocation) return;
    setAskedForLocation(true);
    locate();
  }, [askedForLocation]);

  useEffect(() => {
    if (!coords) {
      setResults([]);
      setVenues([]);
      setLoading(false);
      return;
    }

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

  const searchedResults = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return results;

    return results.filter((listing) =>
      [listing.product, listing.venue, listing.suburb, listing.special, listing.style]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search)),
    );
  }, [query, results]);

  const sorted = useMemo(() => {
    return [...searchedResults].sort((a, b) => {
      if (sort === "distance") return (a.distanceKm ?? 99) - (b.distanceKm ?? 99);
      if (sort === "fresh") return a.updatedMinutesAgo - b.updatedMinutesAgo;
      return a.price - b.price;
    });
  }, [searchedResults, sort]);

  const nearbyPlaces = useMemo(() => {
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
    const search = query.trim().toLowerCase();
    const unpriced = venues
      .filter((venue) => !pricedNames.has(`${venue.name}-${venue.suburb}`.toLowerCase()))
      .filter((venue) => {
        if (!search) return true;
        return [venue.name, venue.suburb, venue.type].some((value) => String(value).toLowerCase().includes(search));
      })
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
  }, [query, sorted, venues]);

  const best = sorted[0];
  const activeListing = sorted.find((listing) => listing.id === activeId) ?? best;
  const activePlace = nearbyPlaces.find((place) => place.id === activeId) ?? nearbyPlaces[0];

  function chooseRegion(nextRegion: string) {
    setRegion(nextRegion);
    setCoords(regionCentres[nextRegion] ?? regionCentres.Wellington);
  }

  function locate() {
    if (!navigator.geolocation) {
      setCoords(regionCentres.Wellington);
      setRegion("Wellington");
      setNotice("Location unavailable. Showing Wellington.");
      return;
    }

    setNotice("Finding you...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setRegion("Near me");
        setTab("store");
        setSort("distance");
        setNotice("Showing the nearest bottle shops first.");
      },
      () => {
        setCoords(regionCentres.Wellington);
        setRegion("Wellington");
        setNotice("Location blocked. Showing Wellington.");
      },
      { enableHighAccuracy: true, timeout: 6000 },
    );
  }

  function chooseMenuAction(action: MenuAction) {
    if (action === "map") {
      window.location.href = "/map";
      return;
    }
    if (action === "post") {
      setPanel(action);
      return;
    }
    setTab(action);
    if (action === "store") setSort("distance");
    setPanel(null);
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
    const listingRegion = String(form.get("region") ?? region);
    const fallback = regionCentres[listingRegion] ?? coords ?? regionCentres.Wellington;
    const lat = Number(form.get("lat") || fallback.lat);
    const lng = Number(form.get("lng") || fallback.lng);
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
        region: listingRegion,
        lat,
        lng,
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
    <div className="grid h-dvh grid-rows-[auto_1fr] overflow-hidden bg-[#f7efe0] text-[#1f1b16]">
      <div className="border-b border-[#2f2417]/10 bg-[#f2c35d] shadow-sm">
        <header className="hidden min-h-[86px] items-center justify-between px-5 md:flex">
        <div className="flex items-center gap-3 min-w-0">
          <a href="/" className="flex items-center gap-1.5 rounded-md border-2 border-[#2f2417] bg-[#fff7df] px-3 py-1.5 text-sm font-black shadow-[3px_3px_0_#2f2417] text-[#245c3b]" title="Switch to mealspy">
            🍜 <span>mealspy</span>
          </a>
          <a href="#top" className="flex min-w-0 items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md border-2 border-[#2f2417] bg-[#fff7df] text-3xl shadow-[4px_4px_0_#2f2417]">
              🍺
            </span>
            <span className="min-w-0">
              <span className="block text-2xl font-black leading-none tracking-normal sm:text-3xl">yourbeer</span>
            </span>
          </a>
        </div>
        <button
          type="button"
          onClick={() => setPanel("menu")}
          className="grid h-11 w-11 place-items-center rounded-md border-2 border-[#2f2417] bg-[#fff7df] shadow-[3px_3px_0_#2f2417]"
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

        <div className="grid grid-cols-[1fr_auto_auto] gap-2 bg-[#fff8e8] p-2 md:grid-cols-[1fr_auto] md:px-5">
          <label className="relative block min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search beer, store, or suburb"
              className="h-12 w-full rounded-md border-2 border-[#2f2417]/10 bg-white pl-10 pr-3 text-base font-bold outline-none ring-[#245c3b] transition placeholder:text-black/35 focus:ring-2"
            />
          </label>
          <button
            type="button"
            className="grid h-12 w-12 place-items-center rounded-md border-2 border-[#2f2417]/10 bg-white text-[#245c3b]"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setPanel("menu")}
            className="grid h-12 w-12 place-items-center rounded-md border-2 border-[#2f2417]/10 bg-white text-[#245c3b] md:hidden"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      <main id="top" className="grid min-h-0 grid-rows-[auto_1fr] gap-2 overflow-hidden p-2 lg:grid-cols-[320px_1fr] lg:grid-rows-1 lg:p-4">
        <aside className="hidden rounded-md border-2 border-[#2f2417]/10 bg-[#fffaf0] p-4 shadow-sm lg:block">
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

        <section className="min-h-0 overflow-hidden rounded-md border-2 border-[#2f2417]/10 bg-[#fffaf0] shadow-sm">
          <div className="flex items-center justify-between border-b border-[#2f2417]/10 bg-white/55 px-3 py-2">
            <div>
              <h1 className="text-lg font-black">{tabs.find((item) => item.type === tab)?.label}</h1>
              <p className="text-xs font-bold text-black/45">
                {loading ? "Loading" : `${nearbyPlaces.length} nearby`} {best ? `· nearest ${(best.distanceKm ?? 0).toFixed(1)} km` : ""}
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

          <div className="h-[calc(100%-57px)] min-h-0 overflow-auto p-2">
            {!coords ? (
              <div className="mb-2 grid min-h-[220px] place-items-center rounded-lg bg-[#e8ecd8] p-6 text-center">
                <div>
                  <p className="text-2xl font-black">Find nearby names</p>
                  <p className="mt-2 text-sm font-bold text-black/55">Tap Near me or choose a city to show real stores and pubs.</p>
                  <button onClick={locate} className="button mt-4 bg-[#245c3b] text-white">
                    <LocateFixed className="h-4 w-4" />
                    Near me
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-2 grid gap-2 rounded-lg bg-[#edf7ef] p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <p className="text-sm font-black text-[#245c3b]">Nearby venue names</p>
                  <p className="text-xs font-bold text-black/55">
                    {loading ? "Checking prices and venue data" : `${nearbyPlaces.length} places within ${radius} km`}
                  </p>
                </div>
                <a href="/map" className="button border-2 border-[#245c3b] bg-white text-[#245c3b] shadow-[3px_3px_0_#245c3b]">
                  <MapPinned className="h-4 w-4" />
                  Map
                </a>
              </div>
            )}

              <div className="grid gap-2">
                {sorted.map((listing) => (
                  <article
                    key={listing.id}
                    className={`rounded-md border bg-white p-3 shadow-sm ${
                      activeListing?.id === listing.id ? "border-[#245c3b]" : "border-[#2f2417]/10"
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
                {nearbyPlaces.filter((place) => !place.hasPrice).map((place) => (
                  <article
                    key={place.id}
                    className={`rounded-md border bg-white p-3 shadow-sm ${
                      activePlace?.id === place.id ? "border-[#245c3b]" : "border-[#2f2417]/10"
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
                {coords && !loading && nearbyPlaces.length === 0 && (
                  <div className="rounded-lg border border-black/10 bg-white p-6 text-center">
                    <p className="text-lg font-black">No places found nearby</p>
                    <p className="mt-1 text-sm font-bold text-black/50">Try increasing the radius or choosing Auckland.</p>
                  </div>
                )}
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
                {panel === "filters" ? "Search" : panel === "post" ? "Post" : "Menu"}
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
                region={region}
              />
            )}
            {panel === "menu" && <DirectoryMenu activeTab={tab} chooseMenuAction={chooseMenuAction} />}
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
  region,
}: {
  submitApplication: (event: FormEvent<HTMLFormElement>) => void;
  submitListing: (event: FormEvent<HTMLFormElement>) => void;
  region: string;
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
          <input name="special" placeholder="Special" className="control" />
          <fieldset className="grid gap-3 rounded-md border border-black/10 bg-[#fbf6ea] p-3">
            <legend className="px-1 text-sm font-black text-black/60">Location</legend>
            <input name="suburb" required placeholder="Suburb" className="control" />
            <select name="region" defaultValue={regions.includes(region) ? region : "Wellington"} className="control">
              {regions.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input name="lat" inputMode="decimal" placeholder="Lat optional" className="control min-w-0" />
              <input name="lng" inputMode="decimal" placeholder="Lng optional" className="control min-w-0" />
            </div>
          </fieldset>
          <button className="button bg-[#245c3b] text-white">Save price</button>
        </form>
      </section>
    </div>
  );
}

function DirectoryMenu({
  activeTab,
  chooseMenuAction,
}: {
  activeTab: Tab;
  chooseMenuAction: (action: MenuAction) => void;
}) {
  return (
    <div className="grid gap-2">
      {tabs.map((item) => (
        <button
          key={item.type}
          type="button"
          onClick={() => chooseMenuAction(item.type)}
          className={`flex h-12 items-center gap-3 rounded-md border px-3 text-left text-sm font-black ${
            activeTab === item.type
              ? "border-[#245c3b] bg-[#245c3b] text-white"
              : "border-black/10 bg-white text-[#1f1b16]"
          }`}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
      <button
        type="button"
        onClick={() => chooseMenuAction("map")}
        className="flex h-12 items-center gap-3 rounded-md border border-black/10 bg-white px-3 text-left text-sm font-black text-[#1f1b16]"
      >
        <MapPinned className="h-4 w-4" />
        Map
      </button>
<button
        type="button"
        onClick={() => chooseMenuAction("post")}
        className="mt-2 flex h-12 items-center justify-center rounded-md bg-[#245c3b] px-3 text-sm font-black text-white"
      >
        Post a price
      </button>
      <a
        href="/"
        className="mt-1 flex h-12 items-center justify-center gap-2 rounded-md border-2 border-[#2f2417] bg-[#fff7df] px-3 text-sm font-black text-[#245c3b]"
      >
        🍜 Switch to mealspy
      </a>
    </div>
  );
}
