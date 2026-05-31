import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getFoodVenues, updateFoodVenue } from "@/lib/storage";

export async function GET(request: NextRequest) {
  const auth = requireAdmin(request);
  if (auth) return auth;
  const venues = await getFoodVenues(true);
  return NextResponse.json({ venues });
}

export async function PATCH(request: NextRequest) {
  const auth = requireAdmin(request);
  if (auth) return auth;
  const body = await request.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (typeof body.approved === "boolean") updates.approved = body.approved;
  if (body.menuStatus) updates.menuStatus = body.menuStatus;

  const venue = await updateFoodVenue(body.id, updates);
  if (!venue) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ venue });
}
