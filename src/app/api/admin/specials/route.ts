import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, slugify } from "@/lib/admin";
import { styles, type AlcoholStyle } from "@/lib/data";
import { addSubmittedListing, getSubmittedListings, getVenue } from "@/lib/storage";

export async function GET(request: NextRequest) {
  const auth = requireAdmin(request);
  if (auth) return auth;

  const { searchParams } = request.nextUrl;
  const sellerId = searchParams.get("sellerId");
  const specials = (await getSubmittedListings()).filter((listing) => !sellerId || listing.venueId === sellerId);

  return NextResponse.json({ count: specials.length, specials });
}

export async function POST(request: NextRequest) {
  const auth = requireAdmin(request);
  if (auth) return auth;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid special" }, { status: 400 });

  const sellerId = String(body.sellerId ?? body.venueId ?? "").trim();
  const seller = sellerId ? await getVenue(sellerId) : null;

  if (!seller) {
    return NextResponse.json({ error: "sellerId must match an existing seller." }, { status: 400 });
  }

  const product = String(body.product ?? "").trim();
  const unit = String(body.unit ?? "").trim();
  const price = Number(body.price);
  const style = String(body.style ?? "lager") as AlcoholStyle;

  if (!product || !unit || !Number.isFinite(price) || price < 0 || !styles.includes(style)) {
    return NextResponse.json(
      { error: "product, price, unit, and a valid style are required." },
      { status: 400 },
    );
  }

  const listing = await addSubmittedListing({
    id: String(body.id ?? `special-${slugify(`${seller.name}-${product}`)}-${Date.now()}`),
    venueId: seller.id,
    type: seller.type,
    venue: seller.name,
    product,
    style,
    price,
    unit,
    lat: seller.lat,
    lng: seller.lng,
    suburb: seller.suburb,
    region: seller.region,
    updatedMinutesAgo: 0,
    openTonight: Boolean(body.openTonight ?? true),
    special: String(body.special ?? "").trim(),
    verified: Boolean(body.verified ?? true),
  });

  return NextResponse.json({ status: "saved", special: listing });
}
