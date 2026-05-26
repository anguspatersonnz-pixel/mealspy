import { NextRequest, NextResponse } from "next/server";
import { addVenue } from "@/lib/storage";
import { type Venue, type VenueType } from "@/lib/data";

type ImportVenue = {
  type: VenueType;
  name: string;
  chain?: string | null;
  address: string;
  suburb: string;
  city: string;
  region: string;
  lat: number;
  lng: number;
  phone?: string | null;
  website?: string | null;
  source?: string;
  checked_at?: string;
};

function slug(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(request: NextRequest) {
  const configuredToken = process.env.YOURBEER_ADMIN_TOKEN;
  const sentToken = request.headers.get("x-admin-token");

  if (configuredToken && sentToken !== configuredToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const rows = Array.isArray(body?.venues) ? (body.venues as ImportVenue[]) : [];

  if (!rows.length) {
    return NextResponse.json({ error: "Send { venues: [...] }" }, { status: 400 });
  }

  const saved: Venue[] = [];

  for (const row of rows) {
    if (
      !["store", "bar", "maker"].includes(row.type) ||
      !row.name ||
      !row.address ||
      !row.suburb ||
      !row.city ||
      !row.region ||
      !Number.isFinite(Number(row.lat)) ||
      !Number.isFinite(Number(row.lng))
    ) {
      continue;
    }

    saved.push(
      await addVenue({
        id: `venue_${slug(row.name)}_${slug(row.suburb)}`,
        type: row.type,
        name: row.name,
        chain: row.chain ?? null,
        address: row.address,
        suburb: row.suburb,
        city: row.city,
        region: row.region,
        lat: Number(row.lat),
        lng: Number(row.lng),
        phone: row.phone ?? null,
        website: row.website ?? null,
        source: row.source ?? "manual",
        checkedAt: row.checked_at ?? new Date().toISOString().slice(0, 10),
        verified: true,
      }),
    );
  }

  return NextResponse.json({ imported: saved.length, venues: saved });
}
