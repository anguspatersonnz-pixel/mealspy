import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { styles, type AlcoholStyle } from "@/lib/data";
import { deleteSubmittedListing, getVenue, updateSubmittedListing } from "@/lib/storage";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = requireAdmin(request);
  if (auth) return auth;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid special" }, { status: 400 });

  const updates: Parameters<typeof updateSubmittedListing>[1] = {};

  if (body.sellerId || body.venueId) {
    const seller = await getVenue(String(body.sellerId ?? body.venueId));
    if (!seller) return NextResponse.json({ error: "sellerId must match an existing seller." }, { status: 400 });
    updates.venueId = seller.id;
    updates.type = seller.type;
    updates.venue = seller.name;
    updates.lat = seller.lat;
    updates.lng = seller.lng;
    updates.suburb = seller.suburb;
    updates.region = seller.region;
  }

  if (body.product != null) updates.product = String(body.product).trim();
  if (body.unit != null) updates.unit = String(body.unit).trim();
  if (body.price != null) updates.price = Number(body.price);
  if (body.special != null) updates.special = String(body.special).trim();
  if (body.openTonight != null) updates.openTonight = Boolean(body.openTonight);
  if (body.verified != null) updates.verified = Boolean(body.verified);
  if (body.style != null) updates.style = String(body.style) as AlcoholStyle;

  if (updates.style && !styles.includes(updates.style)) {
    return NextResponse.json({ error: "Invalid style." }, { status: 400 });
  }
  if (updates.price != null && (!Number.isFinite(updates.price) || updates.price < 0)) {
    return NextResponse.json({ error: "Invalid price." }, { status: 400 });
  }

  const special = await updateSubmittedListing(id, updates);
  if (!special) return NextResponse.json({ error: "Special not found." }, { status: 404 });

  return NextResponse.json({ status: "saved", special });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = requireAdmin(request);
  if (auth) return auth;

  const { id } = await params;
  const deleted = await deleteSubmittedListing(id);
  if (!deleted) return NextResponse.json({ error: "Special not found." }, { status: 404 });

  return NextResponse.json({ status: "deleted", id });
}
