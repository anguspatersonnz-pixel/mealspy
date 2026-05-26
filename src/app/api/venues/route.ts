import { NextRequest, NextResponse } from "next/server";
import { regionCentres, type VenueType } from "@/lib/data";
import { getVenuesNear } from "@/lib/storage";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const region = searchParams.get("region") ?? "Wellington";
  const fallback = regionCentres[region] ?? regionCentres.Wellington;
  const lat = Number(searchParams.get("lat") ?? fallback.lat);
  const lng = Number(searchParams.get("lng") ?? fallback.lng);
  const radiusKm = Number(searchParams.get("radiusKm") ?? 5);
  const type = (searchParams.get("type") ?? "all") as VenueType | "all";

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(radiusKm)) {
    return NextResponse.json({ error: "Invalid location" }, { status: 400 });
  }

  const venues = await getVenuesNear({ lat, lng, radiusKm, type });

  return NextResponse.json({
    centre: { lat, lng, region },
    count: venues.length,
    venues,
  });
}
