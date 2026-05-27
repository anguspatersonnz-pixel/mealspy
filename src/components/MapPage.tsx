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
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [radius, setRadius] = useState(10);
  const [type, setType] = useState<VenueFilter>("all");
  const [venues, setVenues] = useState<Venue[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [askedForLocation, setAskedForLocation] = useState(false);

  useEffect(() => {
    if (askedForLocation) return;
    setAskedForLocation(true);
    locate();
  }, [askedForLocation]);

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
    setAccuracy(null);
    setNotice("");
  }

  function locate() {
    if (!navigator.geolocation) {
      setRegion("Auckland");
      setCoords(regionCentres.Auckland);
      setAccuracy(null);
      setNotice("Location unavailable. Showing Auckland.");
      return;
    }

    setNotice("Finding you...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setAccuracy(position.coords.accuracy);
        setRegion("Near me");
        setNotice(`Using browser location within about ${formatAccuracy(position.coords.accuracy)}.`);
      },
      () => {
        setRegion("Auckland");
        setCoords(regionCentres.Auckland);
        setAccuracy(null);
        setNotice("Location blocked. Showing Auckland.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }

  return (
    <div className="grid h-dvh grid-rows-[auto_1fr] overflow-hidden bg-[#f7efe0] text-[#1f1b16]">
      <header className="flex min-h-[92px] items-center justify-between border-b border-[#2f2417]/15 bg-[#f2c35d] px-3 shadow-sm sm:px-5">
        <a href="/" className="flex min-w-0 items-center gap-3">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-md border-2 border-[#2f2417] bg-[#fff7df] text-4xl shadow-[4px_4px_0_#2f2417]">
            🍺
          </span>
          <span className="min-w-0">
            <span className="block text-2xl font-black leading-none tracking-normal sm:text-3xl">yourbeer map</span>
            <span className="mt-1 block text-xs font-black uppercase text-[#5b3519] sm:text-sm">
              Tap a spot, check the name, go get it
            </span>
          </span>
        </a>
        <a href="/" className="button border-2 border-[#2f2417] bg-[#fff7df] text-[#245c3b] shadow-[3px_3px_0_#2f2417]">
          <Store className="h-4 w-4" />
          List
        </a>
      </header>

      <main className="grid min-h-0 gap-2 p-2 lg:grid-cols-[320px_1fr] lg:p-4">
        <aside className="rounded-md border-2 border-[#2f2417]/10 bg-[#fffaf0] p-3 shadow-sm">
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
            {accuracy != null && (
              <p className="rounded bg-black/5 p-2 text-sm font-bold text-black/60">
                Accuracy: about {formatAccuracy(accuracy)}
              </p>
            )}
            {notice && <p className="text-sm font-bold text-black/55">{notice}</p>}
          </div>
        </aside>

        <section className="min-h-0 overflow-hidden rounded-md border-2 border-[#2f2417]/10 bg-white shadow-sm">
          <BeerMapShell listings={places} centre={coords} activeId={activeId} onActive={setActiveId} />
        </section>
      </main>
    </div>
  );
}

function formatAccuracy(metres: number) {
  if (metres >= 1000) return `${(metres / 1000).toFixed(1)} km`;
  return `${Math.round(metres)} m`;
}
