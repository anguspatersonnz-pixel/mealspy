import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, slugify } from "@/lib/admin";
import { regionCentres, type Venue, type VenueType } from "@/lib/data";
import { addVenue, getVenues } from "@/lib/storage";

export async function GET(request: NextRequest) {
  const auth = requireAdmin(request);
  if (auth) return auth;

  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type") as VenueType | null;
  const region = searchParams.get("region");
  const search = searchParams.get("q")?.trim().toLowerCase();

  const sellers = (await getVenues())
    .filter((seller) => !type || seller.type === type)
    .filter((seller) => !region || seller.region === region)
    .filter((seller) => {
      if (!search) return true;
      return [seller.name, seller.suburb, seller.city, seller.region, seller.chain]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));
    });

  return NextResponse.json({ count: sellers.length, sellers });
}

export async function POST(request: NextRequest) {
  const auth = requireAdmin(request);
  if (auth) return auth;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid seller" }, { status: 400 });

  const type = body.type as VenueType;
  const name = String(body.name ?? "").trim();
  const suburb = String(body.suburb ?? "").trim();
  const city = String(body.city ?? body.region ?? "Wellington").trim();
  const region = String(body.region ?? city).trim();
  const address = String(body.address ?? "").trim();
  const centre = regionCentres[region] ?? regionCentres.Wellington;
  const lat = Number(body.lat ?? centre.lat);
  const lng = Number(body.lng ?? centre.lng);

  if (!["store", "bar", "maker"].includes(type) || !name || !suburb || !region || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { error: "type, name, suburb, region, lat, and lng are required." },
      { status: 400 },
    );
  }

  const seller: Venue = {
    id: String(body.id ?? `seller-${slugify(`${name}-${suburb}`)}`),
    type,
    name,
    chain: body.chain ? String(body.chain).trim() : null,
    address: address || `${suburb}, ${region}`,
    suburb,
    city,
    region,
    lat,
    lng,
    phone: body.phone ? String(body.phone).trim() : null,
    website: body.website ? String(body.website).trim() : null,
    source: String(body.source ?? "admin"),
    checkedAt: String(body.checkedAt ?? new Date().toISOString().slice(0, 10)),
    verified: Boolean(body.verified ?? true),
  };

  return NextResponse.json({ status: "saved", seller: await addVenue(seller) });
}
