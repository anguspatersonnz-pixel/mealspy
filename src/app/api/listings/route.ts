import { NextRequest, NextResponse } from "next/server";
import { addSubmittedListing, getSubmittedListings } from "@/lib/storage";
import { regionCentres, type AlcoholStyle, type ListingType } from "@/lib/data";

export async function GET() {
  return NextResponse.json(await getSubmittedListings());
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "Invalid listing" }, { status: 400 });
  }

  const type = body.type as ListingType;
  const venue = String(body.venue ?? "").trim();
  const product = String(body.product ?? "").trim();
  const price = Number(body.price);
  const unit = String(body.unit ?? "").trim();
  const suburb = String(body.suburb ?? "").trim();
  const region = String(body.region ?? "Wellington");
  const centre = regionCentres[region] ?? regionCentres.Wellington;

  if (!["store", "bar", "maker"].includes(type) || !venue || !product || !unit || !suburb || !Number.isFinite(price)) {
    return NextResponse.json({ error: "Missing listing details" }, { status: 400 });
  }

  const listing = await addSubmittedListing({
    id: `listing_${Date.now()}`,
    type,
    venue,
    product,
    style: (body.style ?? "lager") as AlcoholStyle,
    price,
    unit,
    lat: Number(body.lat ?? centre.lat),
    lng: Number(body.lng ?? centre.lng),
    distanceKm: Number(body.distanceKm ?? 0),
    suburb,
    region,
    updatedMinutesAgo: 0,
    openTonight: Boolean(body.openTonight ?? true),
    special: String(body.special ?? "Submitted. Pending verification."),
    verified: false,
  });

  return NextResponse.json({ status: "saved", listing });
}
