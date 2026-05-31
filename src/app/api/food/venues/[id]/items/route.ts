import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { addFoodItem, deleteFoodItem, getFoodItems, getFoodVenueBySlug, getFoodVenues, updateFoodItem } from "@/lib/storage";
import type { FoodItem } from "@/lib/data";

async function resolveVenue(id: string) {
  // id can be UUID or slug
  const venues = await getFoodVenues();
  return venues.find((v) => v.id === id) ?? (await getFoodVenueBySlug(id)) ?? null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const items = await getFoodItems(id);
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const venue = await resolveVenue(id);
  if (!venue || venue.claimToken !== token) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.name?.trim() || body.price == null) {
    return NextResponse.json({ error: "name and price required" }, { status: 400 });
  }

  const price = Number(body.price);
  if (isNaN(price) || price < 0 || price > 500) {
    return NextResponse.json({ error: "Invalid price" }, { status: 400 });
  }

  const item: FoodItem = {
    id: nanoid(),
    venueId: venue.id,
    name: body.name.trim(),
    description: body.description?.trim() ?? null,
    price,
    category: body.category?.trim() ?? null,
    isDeal: body.isDeal ?? false,
    dealNote: body.dealNote?.trim() ?? null,
    dealExpires: body.dealExpires ?? null,
    isAvailable: true,
    createdAt: new Date().toISOString(),
  };

  await addFoodItem(item);
  return NextResponse.json({ item }, { status: 201 });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const venue = await resolveVenue(id);
  if (!venue || venue.claimToken !== token) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "item id required" }, { status: 400 });

  if (body.price != null) {
    const price = Number(body.price);
    if (isNaN(price) || price < 0 || price > 500) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }
    body.price = price;
  }

  const updated = await updateFoodItem(body.id, venue.id, body);
  if (!updated) return NextResponse.json({ error: "Item not found" }, { status: 404 });
  return NextResponse.json({ item: updated });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  const itemId = request.nextUrl.searchParams.get("item_id");
  if (!token || !itemId) return NextResponse.json({ error: "Missing token or item_id" }, { status: 400 });

  const venue = await resolveVenue(id);
  if (!venue || venue.claimToken !== token) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  const deleted = await deleteFoodItem(itemId, venue.id);
  if (!deleted) return NextResponse.json({ error: "Item not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
