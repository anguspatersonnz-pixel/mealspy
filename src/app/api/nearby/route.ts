import { NextRequest, NextResponse } from "next/server";
import {
  distanceKm,
  listings,
  regionCentres,
  type AlcoholStyle,
  type ListingType,
} from "@/lib/data";
import { getSubmittedListings } from "@/lib/storage";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const region = searchParams.get("region") ?? "Wellington";
  const fallback = regionCentres[region] ?? regionCentres.Wellington;
  const lat = Number(searchParams.get("lat") ?? fallback.lat);
  const lng = Number(searchParams.get("lng") ?? fallback.lng);
  const radiusKm = Number(searchParams.get("radiusKm") ?? 5);
  const type = (searchParams.get("type") ?? "all") as ListingType | "all";
  const style = (searchParams.get("style") ?? "all") as AlcoholStyle | "all";
  const openTonight = searchParams.get("openTonight") !== "false";

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(radiusKm)) {
    return NextResponse.json({ error: "Invalid location" }, { status: 400 });
  }

  const submitted = await getSubmittedListings();
  const results = [...submitted, ...listings]
    .map((listing) => ({
      ...listing,
      distanceKm: Number(distanceKm({ lat, lng }, listing).toFixed(1)),
    }))
    .filter((listing) => listing.distanceKm <= radiusKm)
    .filter((listing) => type === "all" || listing.type === type)
    .filter((listing) => style === "all" || listing.style === style)
    .filter((listing) => !openTonight || listing.openTonight)
    .sort((a, b) => a.price - b.price);

  return NextResponse.json({
    centre: { lat, lng, region },
    count: results.length,
    listings: results,
  });
}
