"use client";

import { useEffect } from "react";
import { DivIcon, LatLngBoundsExpression } from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { ListingType, money } from "@/lib/data";
import "leaflet/dist/leaflet.css";

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

function markerIcon(place: MapPlace, active: boolean) {
  const label = place.price != null ? money(place.price).replace("NZ", "") : shortName(place.venue);
  const bg = active ? "#1f1b16" : place.hasPrice ? "#245c3b" : "#ffffff";
  const color = active || place.hasPrice ? "#ffffff" : "#245c3b";
  const border = active ? "#f0bb4d" : "#ffffff";

  return new DivIcon({
    className: "",
    html: `<div style="
      display:flex;
      align-items:center;
      justify-content:center;
      min-width:46px;
      height:30px;
      padding:0 8px;
      border-radius:999px;
      border:3px solid ${border};
      background:${bg};
      color:${color};
      font-size:12px;
      font-weight:900;
      box-shadow:0 6px 16px rgba(0,0,0,.22);
      max-width:118px;
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;
    ">${label}</div>`,
    iconSize: [90, 30],
    iconAnchor: [45, 15],
  });
}

function shortName(name: string) {
  return name.length > 18 ? `${name.slice(0, 17)}...` : name;
}

const userIcon = new DivIcon({
  className: "",
  html: `<div style="
    width:22px;
    height:22px;
    border-radius:999px;
    border:4px solid white;
    background:#1677ff;
    box-shadow:0 0 0 3px rgba(22,119,255,.25),0 6px 16px rgba(0,0,0,.25);
  "></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function FitMap({ centre, listings }: { centre: Props["centre"]; listings: MapPlace[] }) {
  const map = useMap();

  useEffect(() => {
    if (!listings.length) {
      map.setView([centre.lat, centre.lng], 13);
      return;
    }

    const points: LatLngBoundsExpression = [
      [centre.lat, centre.lng],
      ...listings.slice(0, 20).map((place) => [place.lat, place.lng] as [number, number]),
    ];
    map.fitBounds(points, { padding: [28, 28], maxZoom: 15 });
  }, [centre, listings, map]);

  return null;
}

export default function BeerMap({ listings, centre, activeId, onActive }: Props) {
  const nearest = listings.slice(0, 30);

  return (
    <section className="flex h-full flex-col bg-white p-2">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xl font-black">Beer map</h2>
        <span className="text-xs font-bold text-black/45">OpenStreetMap</span>
      </div>
      <div className="grid min-h-0 flex-1 gap-2 lg:grid-cols-[1fr_190px]">
        <div className="min-h-[190px] overflow-hidden rounded-lg border border-black/10">
          <MapContainer
            center={[centre.lat, centre.lng]}
            zoom={13}
            scrollWheelZoom
            className="h-full min-h-[190px] w-full"
            attributionControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <Marker position={[centre.lat, centre.lng]} icon={userIcon}>
              <Popup>You are here</Popup>
            </Marker>
            {nearest.map((place) => (
              <Marker
                key={place.id}
                position={[place.lat, place.lng]}
                icon={markerIcon(place, activeId === place.id)}
                eventHandlers={{ click: () => onActive(place.id) }}
              >
                <Popup>
                  <strong>{place.venue}</strong>
                  <br />
                  {place.product ?? place.suburb}
                  <br />
                  {place.price != null ? `${money(place.price)} ${place.unit ?? ""}` : "No price yet"}
                </Popup>
              </Marker>
            ))}
            <FitMap centre={centre} listings={nearest} />
          </MapContainer>
        </div>
        <div className="hidden gap-2 overflow-auto lg:grid">
          {nearest.slice(0, 10).map((place) => (
            <button
              key={place.id}
              type="button"
              onClick={() => onActive(place.id)}
              className={`rounded border p-3 text-left ${
                activeId === place.id ? "border-[#245c3b] bg-[#edf7ef]" : "border-black/10 bg-white"
              }`}
            >
              <p className="font-black">{place.venue}</p>
              <p className="text-sm text-black/55">{place.product ?? place.suburb}</p>
              <p className="mt-1 text-sm font-black text-[#245c3b]">
                {place.price != null ? money(place.price) : "No price yet"} · {(place.distanceKm ?? 0).toFixed(1)} km
              </p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export type BeerMapProps = Props;
