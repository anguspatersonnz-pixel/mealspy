"use client";

import { Beer, LocateFixed, Store } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ListingType, regionCentres, regions, type Venue, type VenueType } from "@/lib/data";
import BeerMapShell from "./BeerMapShell";
import type { MapPlace } from "./BeerMap";

type VenueFilter = VenueType | "all";

const filters: Array<{ label: string; type: VenueFilter }> = [
  { label: "All", type: "all" },
  { label: "Stores", type: "store" },
  { label: "Pubs", type: "bar" },
  { label: "Makers", type: "maker" },
];

export default function MapPage() {
  const [region, setRegion] = useState("Auckland");
  const [coords, setCoords] = useState(regionCentres.Auckland);
  const [radius, setRadius] = useState(10);
  const [type, setType] = useState<VenueFilter>("all");
  const [venues, setVenues] = useState<Venue[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({
      region,
      lat: String(coords.lat),
      lng: String(coords.lng),
      radiusKm: String(radius),
      type,
    });

    setLoading(true);
    fetch(`/api/venues?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setVenues(Array.isArray(data.venues) ? data.venues : []))
      .catch(() => setVenues([]))
      .finally(() => setLoading(false));
  }, [coords, radius, region, type]);

  const places: MapPlace[] = useMemo(
    () =>
      venues.map((venue) => ({
        id: venue.id,
        type: venue.type as ListingType,
        venue: venue.name,
        lat: venue.lat,
        lng: venue.lng,
        suburb: venue.suburb,
        distanceKm: venue.distanceKm,
        hasPrice: false,
      })),
    [venues],
  );

  function chooseRegion(nextRegion: string) {
    setRegion(nextRegion);
    setCoords(regionCentres[nextRegion] ?? regionCentres.Auckland);
    setNotice("");
  }

  function locate() {
    if (!navigator.geolocation) {
      setNotice("Location unavailable. Showing Auckland.");
      chooseRegion("Auckland");
      return;
    }

    setNotice("Finding you...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setRegion("Near me");
        setNotice("Showing venues near you.");
      },
      () => {
        setNotice("Location blocked. Showing Auckland.");
        chooseRegion("Auckland");
      },
      { enableHighAccuracy: true, timeout: 6000 },
    );
  }

  return (
    <div className="grid h-dvh grid-rows-[auto_1fr] overflow-hidden bg-[#fbf6ea] text-[#1f1b16]">
      <header className="flex h-14 items-center justify-between border-b border-black/10 bg-[#fbf6ea] px-3">
        <a href="/" className="flex items-center gap-2 text-lg font-black">
          <span className="grid h-8 w-8 place-items-center rounded bg-[#245c3b] text-white">
            <Beer className="h-4 w-4" />
          </span>
          yourbeer map
        </a>
        <a href="/" className="button bg-white text-[#245c3b] ring-1 ring-black/10">
          <Store className="h-4 w-4" />
          List
        </a>
      </header>

      <main className="grid min-h-0 gap-2 p-2 lg:grid-cols-[320px_1fr] lg:p-4">
        <aside className="rounded-lg border border-black/10 bg-white p-3 shadow-sm">
          <div className="grid gap-3">
            <label className="block">
              <span className="text-sm font-bold text-black/55">City</span>
              <select value={region} onChange={(event) => chooseRegion(event.target.value)} className="control mt-1 w-full">
                {regions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <button onClick={locate} className="button bg-[#245c3b] text-white">
              <LocateFixed className="h-4 w-4" />
              Near me
            </button>
            <div className="grid grid-cols-2 gap-1">
              {filters.map((filter) => (
                <button
                  key={filter.type}
                  type="button"
                  onClick={() => setType(filter.type)}
                  className={`rounded-md px-3 py-2 text-sm font-black ${
                    type === filter.type ? "bg-[#245c3b] text-white" : "bg-black/5 text-black/60"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <label className="block">
              <span className="flex justify-between text-sm font-bold text-black/55">
                Radius <strong>{radius} km</strong>
              </span>
              <input
                type="range"
                min={1}
                max={30}
                value={radius}
                onChange={(event) => setRadius(Number(event.target.value))}
                className="mt-2 w-full accent-[#245c3b]"
              />
            </label>
            <p className="rounded bg-[#edf7ef] p-2 text-sm font-bold text-[#245c3b]">
              {loading ? "Loading venues" : `${venues.length} map locations`}
            </p>
            {notice && <p className="text-sm font-bold text-black/55">{notice}</p>}
          </div>
        </aside>

        <section className="min-h-0 overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
          <BeerMapShell listings={places} centre={coords} activeId={activeId} onActive={setActiveId} />
        </section>
      </main>
    </div>
  );
}
