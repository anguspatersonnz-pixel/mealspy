import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { addFoodVenue, getFoodVenueBySlug, getFoodVenuesNear } from "@/lib/storage";
import { regionCentres } from "@/lib/data";
import type { FoodVenue } from "@/lib/data";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const slug = searchParams.get("slug");
  if (slug) {
    const venue = await getFoodVenueBySlug(slug);
    if (!venue) return NextResponse.json({ venues: [], count: 0 });
    return NextResponse.json({ venues: [venue], count: 1 });
  }

  const fallbackRegion = searchParams.get("region") ?? "Auckland";
  const fallback = regionCentres[fallbackRegion] ?? regionCentres.Auckland;
  const lat = Number(searchParams.get("lat") ?? fallback.lat);
  const lng = Number(searchParams.get("lng") ?? fallback.lng);
  const radiusKm = Number(searchParams.get("radiusKm") ?? 5);
  const category = searchParams.get("category") ?? "all";

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "Invalid location" }, { status: 400 });
  }

  const venues = await getFoodVenuesNear({ lat, lng, radiusKm, category });
  return NextResponse.json({ venues, count: venues.length });
}

async function geocode(address: string, suburb: string, city: string): Promise<{ lat: number; lng: number } | null> {
  // Build a progressively vaguer query: full address → suburb+city → city only
  const queries = [
    [address, suburb, city, "New Zealand"].filter(Boolean).join(", "),
    [suburb, city, "New Zealand"].filter(Boolean).join(", "),
    [city, "New Zealand"].join(", "),
  ];

  for (const q of queries) {
    if (!q.trim()) continue;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=nz`,
        { headers: { "User-Agent": "mealspy-nz/1.0 (cheapernz@gmail.com)" }, signal: AbortSignal.timeout(4000) }
      );
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.lat && data[0]?.lon) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    } catch {
      // try next query
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { name, category, address, suburb, city, lat, lng, phone, website, description, imageUrl } = body;
  if (!name?.trim() || !city?.trim()) {
    return NextResponse.json({ error: "name and city are required" }, { status: 400 });
  }

  // Use provided coords, or geocode from the address
  let resolvedLat = Number(lat) || 0;
  let resolvedLng = Number(lng) || 0;
  if (!resolvedLat || !resolvedLng) {
    const coords = await geocode(address?.trim() ?? "", suburb?.trim() ?? "", city.trim());
    if (coords) { resolvedLat = coords.lat; resolvedLng = coords.lng; }
  }

  const slug =
    name.trim().toLowerCase()
      .replace(/['']/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") +
    "-" + nanoid(5).toLowerCase();

  const venue: FoodVenue = {
    id: nanoid(),
    name: name.trim(),
    slug,
    category: category ?? "restaurant",
    address: address?.trim() ?? "",
    suburb: suburb?.trim() ?? "",
    city: city.trim(),
    lat: resolvedLat,
    lng: resolvedLng,
    phone: phone?.trim() ?? null,
    website: website?.trim() ?? null,
    description: description?.trim() ?? null,
    imageUrl: typeof imageUrl === "string" && imageUrl.trim() ? imageUrl.trim() : null,
    claimToken: nanoid(32),
    createdAt: new Date().toISOString(),
  };

  await addFoodVenue(venue);
  return NextResponse.json(
    { id: venue.id, slug: venue.slug, claim_token: venue.claimToken, geocoded: resolvedLat !== 0 },
    { status: 201 }
  );
}
