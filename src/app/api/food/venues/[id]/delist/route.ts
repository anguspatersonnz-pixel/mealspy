import { NextRequest, NextResponse } from "next/server";
import { getFoodVenueBySlug, getFoodVenues, updateFoodVenue } from "@/lib/storage";

async function resolveVenue(id: string) {
  const venues = await getFoodVenues(true);
  return venues.find((v) => v.id === id) ?? (await getFoodVenueBySlug(id)) ?? null;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const venue = await resolveVenue(id);
  if (!venue || venue.claimToken !== token) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  await updateFoodVenue(venue.id, { approved: false });
  return NextResponse.json({ ok: true });
}
