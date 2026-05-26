import { NextRequest, NextResponse } from "next/server";
import { regionCentres, type AlcoholStyle, type ListingType } from "@/lib/data";
import { addSubmittedListing } from "@/lib/storage";

type ImportListing = {
  type: ListingType;
  venue: string;
  product: string;
  style: AlcoholStyle;
  price: number;
  unit: string;
  suburb: string;
  region: string;
  lat?: number;
  lng?: number;
  special?: string;
  openTonight?: boolean;
};

export async function POST(request: NextRequest) {
  const configuredToken = process.env.YOURBEER_ADMIN_TOKEN;
  const sentToken = request.headers.get("x-admin-token");

  if (configuredToken && sentToken !== configuredToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const rows = Array.isArray(body?.listings) ? (body.listings as ImportListing[]) : [];

  if (!rows.length) {
    return NextResponse.json({ error: "Send { listings: [...] }" }, { status: 400 });
  }

  const saved = [];

  for (const row of rows) {
    const centre = regionCentres[row.region] ?? regionCentres.Wellington;
    if (!["store", "bar", "maker"].includes(row.type) || !row.venue || !row.product || !row.unit) {
      continue;
    }

    saved.push(
      await addSubmittedListing({
        id: `import_${Date.now()}_${saved.length}`,
        type: row.type,
        venue: row.venue,
        product: row.product,
        style: row.style,
        price: Number(row.price),
        unit: row.unit,
        lat: Number(row.lat ?? centre.lat),
        lng: Number(row.lng ?? centre.lng),
        suburb: row.suburb,
        region: row.region,
        updatedMinutesAgo: 0,
        openTonight: row.openTonight ?? true,
        special: row.special ?? "Imported starter price.",
        verified: true,
      }),
    );
  }

  return NextResponse.json({ imported: saved.length, listings: saved });
}
