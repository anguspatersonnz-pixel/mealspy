"use client";

import { useEffect } from "react";
import { DivIcon } from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { money } from "@/lib/data";
import "leaflet/dist/leaflet.css";
import type { FoodVenue } from "@/lib/data";

export type FoodMapVenue = Pick<FoodVenue, "id" | "name" | "category" | "lat" | "lng" | "suburb" | "city" | "address" | "website" | "phone" | "menuStatus"> & {
  cheapestPrice: number | null;
  dealCount: number;
  distanceKm?: number;
};

type Props = {
  venues: FoodMapVenue[];
  centre: { lat: number; lng: number };
  activeId: string | null;
  onActive: (id: string) => void;
};

function markerIcon(venue: FoodMapVenue, active: boolean) {
  const label = venue.cheapestPrice != null ? money(venue.cheapestPrice) : venue.name.slice(0, 10);
  const bg = active ? "#1a1714" : venue.dealCount > 0 ? "#e8472a" : "#1a6b3c";
  const border = active ? "#fbbf24" : "#ffffff";

  return new DivIcon({
    className: "",
    html: `<div style="
      display:flex;align-items:center;justify-content:center;
      min-width:46px;height:28px;padding:0 8px;
      border-radius:999px;border:3px solid ${border};
      background:${bg};color:#ffffff;
      font-size:11px;font-weight:800;
      box-shadow:0 4px 12px rgba(0,0,0,.25);
      white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:110px;
    ">${label}</div>`,
    iconSize: [90, 28],
    iconAnchor: [45, 14],
  });
}

const userIcon = new DivIcon({
  className: "",
  html: `<div style="
    width:20px;height:20px;border-radius:50%;
    border:3px solid white;background:#3b82f6;
    box-shadow:0 0 0 3px rgba(59,130,246,.3),0 4px 12px rgba(0,0,0,.2);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function FitMap({ centre }: { centre: Props["centre"] }) {
  const map = useMap();
  useEffect(() => {
    map.setView([centre.lat, centre.lng], 14);
  }, [centre, map]);
  return null;
}

export default function FoodMap({ venues, centre, activeId, onActive }: Props) {
  const shown = venues.slice(0, 500);
  const active = shown.find((v) => v.id === activeId);

  return (
    <div className="flex h-full flex-col">
      <MapContainer
        center={[centre.lat, centre.lng]}
        zoom={13}
        scrollWheelZoom
        className="h-full w-full"
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />
        <Marker position={[centre.lat, centre.lng]} icon={userIcon}>
          <Popup>You are here</Popup>
        </Marker>
        {shown.map((v) => (
          <Marker
            key={v.id}
            position={[v.lat, v.lng]}
            icon={markerIcon(v, activeId === v.id)}
            eventHandlers={{ click: () => onActive(v.id) }}
          >
            <Popup>
              <strong className="block">{v.name}</strong>
              <span className="text-gray-500 text-xs">{v.suburb || v.city}</span>
              {v.cheapestPrice != null && (
                <span className="block font-bold text-green-700 mt-1">from {money(v.cheapestPrice)}</span>
              )}
              {v.dealCount > 0 && <span className="block text-xs text-red-600">🔥 {v.dealCount} deal{v.dealCount !== 1 ? "s" : ""}</span>}
              {v.address && <span className="block text-xs text-gray-400 mt-1">{v.address}</span>}
              {v.website && <a href={v.website} target="_blank" rel="noreferrer" className="block text-xs text-blue-500 mt-1 underline">Website</a>}
            </Popup>
          </Marker>
        ))}
        <FitMap centre={centre} />
      </MapContainer>

      {/* Active venue card overlay */}
      {active && (
        <div className="absolute bottom-4 left-1/2 z-[1000] w-[90vw] max-w-sm -translate-x-1/2 rounded-2xl border border-[#ece8e3] bg-white px-4 py-3 shadow-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-[#1a1714] truncate">{active.name}</p>
              <p className="text-xs text-[#a09c98] mt-0.5">{active.suburb || active.city}{active.distanceKm != null ? ` · ${active.distanceKm} km` : ""}</p>
            </div>
            {active.cheapestPrice != null && (
              <p className="flex-shrink-0 text-lg font-bold text-[#1a6b3c]">{money(active.cheapestPrice)}</p>
            )}
          </div>
          {active.dealCount > 0 && (
            <p className="mt-1 text-xs font-semibold text-[#e8472a]">🔥 {active.dealCount} deal{active.dealCount !== 1 ? "s" : ""}</p>
          )}
          <div className="mt-2 flex gap-2">
            {active.address && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${active.name} ${active.address} ${active.city}`)}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 rounded-lg bg-[#f4fbf7] border border-[#c6e8d0] py-1.5 text-center text-xs font-semibold text-[#1a6b3c]"
              >
                Directions
              </a>
            )}
            <button
              onClick={() => onActive("")}
              className="rounded-lg border border-[#ece8e3] px-3 py-1.5 text-xs font-semibold text-[#a09c98]"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export type FoodMapProps = Props;
