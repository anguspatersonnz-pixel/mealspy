import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { addFoodVenue, getFoodVenuesNear } from "@/lib/storage";
import { regionCentres } from "@/lib/data";
import type { FoodVenue } from "@/lib/data";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
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

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { name, category, address, suburb, city, lat, lng, phone, website, description } = body;
  if (!name?.trim() || !city?.trim()) {
    return NextResponse.json({ error: "name and city are required" }, { status: 400 });
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
    lat: Number(lat) || 0,
    lng: Number(lng) || 0,
    phone: phone?.trim() ?? null,
    website: website?.trim() ?? null,
    description: description?.trim() ?? null,
    claimToken: nanoid(32),
    createdAt: new Date().toISOString(),
  };

  await addFoodVenue(venue);
  return NextResponse.json(
    { id: venue.id, slug: venue.slug, claim_token: venue.claimToken },
    { status: 201 }
  );
}
