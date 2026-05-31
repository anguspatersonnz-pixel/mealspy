import { NextRequest, NextResponse } from "next/server";
import { getFoodVenues } from "@/lib/storage";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });

  const venues = await getFoodVenues();
  const venue = venues.find((v) => v.claimToken === token);
  if (!venue) return NextResponse.json({ error: "No listing found for that token" }, { status: 404 });

  return NextResponse.json({ slug: venue.slug, name: venue.name });
}
