import { NextRequest, NextResponse } from "next/server";
import { getFoodVenueBySlug, getFoodVenues, saveMenuUpload } from "@/lib/storage";

async function resolveVenue(id: string) {
  const venues = await getFoodVenues();
  return venues.find((v) => v.id === id) ?? (await getFoodVenueBySlug(id)) ?? null;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "Invalid form data" }, { status: 400 });

  const token = formData.get("token") as string | null;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const venue = await resolveVenue(id);
  if (!venue || venue.claimToken !== token) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  const file = formData.get("menu") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 20 MB)" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  await saveMenuUpload(venue.id, file.name, buffer);

  return NextResponse.json({ ok: true });
}
