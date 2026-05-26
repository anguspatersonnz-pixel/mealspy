"use client";

import { Beer, Building2, Store } from "lucide-react";
import { ListingType, money } from "@/lib/data";

export type MapPlace = {
  id: string;
  type: ListingType;
  venue: string;
  product?: string;
  price?: number;
  unit?: string;
  lat: number;
  lng: number;
  suburb: string;
  distanceKm?: number;
  hasPrice: boolean;
};

type Props = {
  listings: MapPlace[];
  centre: { lat: number; lng: number };
  activeId: string | null;
  onActive: (id: string) => void;
};

const iconByType: Record<ListingType, React.ReactNode> = {
  store: <Store className="h-3.5 w-3.5" />,
  bar: <Beer className="h-3.5 w-3.5" />,
  maker: <Building2 className="h-3.5 w-3.5" />,
};

export default function BeerMap({ listings, centre, activeId, onActive }: Props) {
  const nearest = listings.slice(0, 10);

  function position(listing: MapPlace) {
    const latSpan = 0.075;
    const lngSpan = 0.095;
    const x = 50 + ((listing.lng - centre.lng) / lngSpan) * 50;
    const y = 50 - ((listing.lat - centre.lat) / latSpan) * 50;

    return {
      left: `${Math.max(6, Math.min(94, x))}%`,
      top: `${Math.max(8, Math.min(92, y))}%`,
    };
  }

  return (
    <section className="flex h-full flex-col bg-white p-2">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xl font-black">Beer map</h2>
        <span className="text-xs font-bold text-black/45">nearest first</span>
      </div>
      <div className="grid min-h-0 flex-1 gap-2 lg:grid-cols-[1fr_190px]">
        <div className="relative min-h-[190px] overflow-hidden rounded-lg border border-black/10 bg-[#e8ecd8]">
          <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(31,27,22,.09)_1px,transparent_1px),linear-gradient(90deg,rgba(31,27,22,.09)_1px,transparent_1px)] [background-size:34px_34px]" />
          <div className="absolute left-1/2 top-1/2 z-10 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-white bg-[#245c3b] text-xs font-black text-white shadow">
            you
          </div>
          {nearest.map((listing) => (
            <button
              key={listing.id}
              type="button"
              onClick={() => onActive(listing.id)}
              className={`absolute z-20 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black shadow ${
                activeId === listing.id ? "bg-[#1f1b16] text-white" : "bg-white text-[#245c3b]"
              }`}
              style={position(listing)}
              aria-label={`${listing.venue} ${listing.price != null ? money(listing.price) : "No price yet"}`}
            >
              {iconByType[listing.type]}
              {listing.price != null ? money(listing.price) : "new"}
            </button>
          ))}
        </div>
        <div className="hidden gap-2 overflow-auto lg:grid">
          {nearest.map((listing) => (
            <button
              key={listing.id}
              type="button"
              onClick={() => onActive(listing.id)}
              className={`rounded border p-3 text-left ${
                activeId === listing.id ? "border-[#245c3b] bg-[#edf7ef]" : "border-black/10 bg-white"
              }`}
            >
              <p className="font-black">{listing.venue}</p>
              <p className="text-sm text-black/55">{listing.product ?? listing.suburb}</p>
              <p className="mt-1 text-sm font-black text-[#245c3b]">
                {listing.price != null ? money(listing.price) : "No price yet"} · {(listing.distanceKm ?? 0).toFixed(1)} km
              </p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
