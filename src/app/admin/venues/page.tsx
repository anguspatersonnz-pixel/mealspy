"use client";

import { useEffect, useState } from "react";
import type { FoodVenue } from "@/lib/data";

export default function AdminVenuesPage() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [venues, setVenues] = useState<FoodVenue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load(t: string) {
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/food-venues", { headers: { "x-admin-key": t } });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Unauthorized"); setLoading(false); return; }
    setVenues(data.venues);
    setAuthed(true);
    setLoading(false);
  }

  async function setApproved(id: string, approved: boolean) {
    const res = await fetch("/api/admin/food-venues", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-key": token },
      body: JSON.stringify({ id, approved }),
    });
    if (res.ok) setVenues((v) => v.map((x) => x.id === id ? { ...x, approved } : x));
  }

  async function setMenuStatus(id: string, menuStatus: string) {
    const res = await fetch("/api/admin/food-venues", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-key": token },
      body: JSON.stringify({ id, menuStatus }),
    });
    if (res.ok) setVenues((v) => v.map((x) => x.id === id ? { ...x, menuStatus: menuStatus as FoodVenue["menuStatus"] } : x));
  }

  const pending = venues.filter((v) => !v.approved);
  const approved = venues.filter((v) => v.approved);

  if (!authed) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm space-y-3">
          <h1 className="text-lg font-bold">Admin — Venues</h1>
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Admin token"
            type="password"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            onClick={() => load(token)}
            disabled={loading || !token}
            className="w-full rounded-lg bg-gray-900 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Loading…" : "Sign in"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Venue approvals</h1>
          <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700">
            {pending.length} pending
          </span>
        </div>

        {/* Pending */}
        {pending.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Awaiting approval</h2>
            {pending.map((v) => (
              <VenueRow key={v.id} venue={v} onApprove={() => setApproved(v.id, true)} onReject={() => setApproved(v.id, false)} onMenuStatus={(s) => setMenuStatus(v.id, s)} />
            ))}
          </section>
        )}

        {pending.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-8 text-center text-sm text-gray-500">
            All caught up — no pending venues.
          </div>
        )}

        {/* Approved */}
        {approved.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Approved ({approved.length})</h2>
            {approved.map((v) => (
              <VenueRow key={v.id} venue={v} onApprove={() => setApproved(v.id, true)} onReject={() => setApproved(v.id, false)} onMenuStatus={(s) => setMenuStatus(v.id, s)} />
            ))}
          </section>
        )}
      </div>
    </div>
  );
}

function VenueRow({ venue, onApprove, onReject, onMenuStatus }: {
  venue: FoodVenue;
  onApprove: () => void;
  onReject: () => void;
  onMenuStatus: (s: string) => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900">{venue.name}</p>
          <p className="text-sm text-gray-500">{venue.category} · {venue.address || venue.suburb}, {venue.city}</p>
          {venue.description && <p className="mt-1 text-xs text-gray-400 line-clamp-2">{venue.description}</p>}
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className={`rounded-full px-2 py-0.5 font-semibold ${venue.approved ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
              {venue.approved ? "Approved" : "Pending"}
            </span>
            <span className={`rounded-full px-2 py-0.5 font-semibold ${
              venue.menuStatus === "live" ? "bg-blue-100 text-blue-700" :
              venue.menuStatus === "pending" ? "bg-yellow-100 text-yellow-700" :
              "bg-gray-100 text-gray-500"
            }`}>
              Menu: {venue.menuStatus}
            </span>
            {venue.website && <a href={venue.website} target="_blank" rel="noreferrer" className="text-blue-500 underline">{venue.website}</a>}
          </div>
        </div>
        {venue.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={venue.imageUrl} alt="" className="h-16 w-16 flex-shrink-0 rounded-lg object-cover" />
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {!venue.approved
          ? <button onClick={onApprove} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white">✓ Approve</button>
          : <button onClick={onReject} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600">Unapprove</button>
        }
        <select
          value={venue.menuStatus}
          onChange={(e) => onMenuStatus(e.target.value)}
          className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs font-semibold text-gray-700"
        >
          <option value="none">Menu: none</option>
          <option value="pending">Menu: pending</option>
          <option value="live">Menu: live</option>
        </select>
        <a
          href={`/food/venues/${venue.slug}/edit?token=${venue.claimToken}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600"
        >
          Edit listing →
        </a>
      </div>
    </div>
  );
}
