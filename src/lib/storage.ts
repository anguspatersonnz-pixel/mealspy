import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Listing } from "./data";
import { distanceKm, starterVenues, type FoodItem, type FoodVenue, type Venue, type VenueType } from "./data";
import {
  applicationToRow,
  hasSupabase,
  listingFromRow,
  listingToRow,
  supabaseAdmin,
  venueFromRow,
  venueToRow,
  type ListingRow,
  type VenueRow,
} from "./supabase";

export type SellerApplication = {
  id: string;
  type: "venue" | "maker";
  businessName: string;
  contactEmail: string;
  licence: string;
  region: string;
  createdAt: string;
  status: "received";
};

const dataDir = process.env.VERCEL
  ? path.join(os.tmpdir(), "mealspy-data")
  : path.join(process.cwd(), ".data");
const listingsFile = path.join(dataDir, "listings.json");
const applicationsFile = path.join(dataDir, "applications.json");
const venuesFile = path.join(dataDir, "venues.json");

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const text = await readFile(file, "utf8");
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(file: string, data: T) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(file, JSON.stringify(data, null, 2));
}

export async function getSubmittedListings() {
  if (hasSupabase && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) return (data as ListingRow[]).map(listingFromRow);
  }

  return readJson<Listing[]>(listingsFile, []);
}

export async function addSubmittedListing(listing: Listing) {
  if (hasSupabase && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from("listings")
      .insert(listingToRow(listing))
      .select("*")
      .single();

    if (!error && data) return listingFromRow(data as ListingRow);
    throw new Error(error?.message ?? "Could not save listing");
  }

  const listings = await getSubmittedListings();
  const next = [listing, ...listings];
  await writeJson(listingsFile, next);
  return listing;
}

export async function updateSubmittedListing(id: string, updates: Partial<Listing>) {
  const listings = await getSubmittedListings();
  const existing = listings.find((listing) => listing.id === id);
  if (!existing) return null;
  const updated = { ...existing, ...updates, id };

  if (hasSupabase && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from("listings")
      .update(listingToRow(updated))
      .eq("id", id)
      .select("*")
      .single();

    if (!error && data) return listingFromRow(data as ListingRow);
    throw new Error(error?.message ?? "Could not update listing");
  }

  await writeJson(
    listingsFile,
    listings.map((listing) => (listing.id === id ? updated : listing)),
  );
  return updated;
}

export async function deleteSubmittedListing(id: string) {
  if (hasSupabase && supabaseAdmin) {
    const { error } = await supabaseAdmin.from("listings").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return true;
  }

  const listings = await getSubmittedListings();
  await writeJson(
    listingsFile,
    listings.filter((listing) => listing.id !== id),
  );
  return listings.some((listing) => listing.id === id);
}

export async function getApplications() {
  return readJson<SellerApplication[]>(applicationsFile, []);
}

export async function addApplication(application: SellerApplication) {
  if (hasSupabase && supabaseAdmin) {
    const { error } = await supabaseAdmin
      .from("seller_applications")
      .insert(applicationToRow(application));

    if (error) throw new Error(error.message);
    return application;
  }

  const applications = await getApplications();
  const next = [application, ...applications];
  await writeJson(applicationsFile, next);
  return application;
}

export async function getVenues() {
  if (hasSupabase && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from("venues")
      .select("*")
      .order("name", { ascending: true });

    if (!error && data) return (data as VenueRow[]).map(venueFromRow);
  }

  const localVenues = await readJson<Venue[]>(venuesFile, []);
  return [...localVenues, ...starterVenues];
}

export async function getVenue(id: string) {
  const venues = await getVenues();
  return venues.find((venue) => venue.id === id) ?? null;
}

export async function getVenuesNear(params: {
  lat: number;
  lng: number;
  radiusKm: number;
  type?: VenueType | "all";
}) {
  const venues = await getVenues();
  return venues
    .map((venue) => ({
      ...venue,
      distanceKm: Number(distanceKm(params, venue).toFixed(1)),
    }))
    .filter((venue) => venue.distanceKm <= params.radiusKm)
    .filter((venue) => !params.type || params.type === "all" || venue.type === params.type)
    .sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99));
}

export async function addVenue(venue: Venue) {
  if (hasSupabase && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from("venues")
      .upsert(venueToRow(venue), { onConflict: "id" })
      .select("*")
      .single();

    if (!error && data) return venueFromRow(data as VenueRow);
    throw new Error(error?.message ?? "Could not save venue");
  }

  const venues = await readJson<Venue[]>(venuesFile, []);
  const next = [venue, ...venues.filter((item) => item.id !== venue.id)];
  await writeJson(venuesFile, next);
  return venue;
}

// ── Food venues ────────────────────────────────────────────────────────────────

const foodVenuesFile = path.join(dataDir, "food-venues.json");
const foodItemsFile = path.join(dataDir, "food-items.json");

export async function getFoodVenues(): Promise<FoodVenue[]> {
  return readJson<FoodVenue[]>(foodVenuesFile, []);
}

export async function getFoodVenuesNear(params: {
  lat: number;
  lng: number;
  radiusKm: number;
  category?: string;
}): Promise<(FoodVenue & { cheapestPrice: number | null; dealCount: number })[]> {
  const venues = await getFoodVenues();
  const items = await getFoodItems();
  const now = new Date();

  return venues
    .filter((v) => !params.category || params.category === "all" || v.category === params.category)
    .map((v) => {
      const venueItems = items.filter((i) => i.venueId === v.id && i.isAvailable);
      const cheapestPrice = venueItems.length > 0 ? Math.min(...venueItems.map((i) => i.price)) : null;
      const dealCount = venueItems.filter(
        (i) => i.isDeal && (!i.dealExpires || new Date(i.dealExpires) > now)
      ).length;
      return {
        ...v,
        distanceKm: Number(distanceKm(params, v).toFixed(1)),
        cheapestPrice,
        dealCount,
      };
    })
    .filter((v) => v.distanceKm <= params.radiusKm)
    .sort((a, b) => {
      if (b.dealCount !== a.dealCount) return b.dealCount - a.dealCount;
      return (a.distanceKm ?? 99) - (b.distanceKm ?? 99);
    });
}

export async function getFoodVenueBySlug(slug: string): Promise<FoodVenue | null> {
  const venues = await getFoodVenues();
  return venues.find((v) => v.slug === slug) ?? null;
}

export async function addFoodVenue(venue: FoodVenue): Promise<FoodVenue> {
  const venues = await getFoodVenues();
  const next = [venue, ...venues.filter((v) => v.id !== venue.id)];
  await writeJson(foodVenuesFile, next);
  return venue;
}

export async function getFoodItems(venueId?: string): Promise<FoodItem[]> {
  const all = await readJson<FoodItem[]>(foodItemsFile, []);
  return venueId ? all.filter((i) => i.venueId === venueId) : all;
}

export async function addFoodItem(item: FoodItem): Promise<FoodItem> {
  const items = await getFoodItems();
  await writeJson(foodItemsFile, [item, ...items]);
  return item;
}

export async function updateFoodItem(id: string, venueId: string, updates: Partial<FoodItem>): Promise<FoodItem | null> {
  const items = await getFoodItems();
  const existing = items.find((i) => i.id === id && i.venueId === venueId);
  if (!existing) return null;
  const updated = { ...existing, ...updates, id, venueId };
  await writeJson(foodItemsFile, items.map((i) => (i.id === id && i.venueId === venueId ? updated : i)));
  return updated;
}

export async function deleteFoodItem(id: string, venueId: string): Promise<boolean> {
  const items = await getFoodItems();
  const filtered = items.filter((i) => !(i.id === id && i.venueId === venueId));
  if (filtered.length === items.length) return false;
  await writeJson(foodItemsFile, filtered);
  return true;
}

export async function saveMenuUpload(venueId: string, filename: string, buffer: Buffer): Promise<string> {
  const uploadsDir = path.join(dataDir, "menu-uploads");
  await mkdir(uploadsDir, { recursive: true });
  const ext = path.extname(filename) || ".bin";
  const dest = path.join(uploadsDir, `${venueId}-${Date.now()}${ext}`);
  await writeFile(dest, buffer);
  return dest;
}
