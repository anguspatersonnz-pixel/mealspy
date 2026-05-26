import { createClient } from "@supabase/supabase-js";
import { Listing } from "./data";
import type { SellerApplication } from "./storage";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const hasSupabase = Boolean(url && serviceRoleKey);

export const supabaseAdmin = hasSupabase
  ? createClient(url as string, serviceRoleKey as string, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

export type ListingRow = {
  id: string;
  type: Listing["type"];
  venue: string;
  product: string;
  style: Listing["style"];
  price: number;
  unit: string;
  lat: number;
  lng: number;
  suburb: string;
  region: string;
  open_tonight: boolean;
  special: string;
  verified: boolean;
  created_at: string;
};

export function listingFromRow(row: ListingRow): Listing {
  const createdAt = new Date(row.created_at).getTime();
  const minutes = Number.isFinite(createdAt)
    ? Math.max(0, Math.round((Date.now() - createdAt) / 60000))
    : 0;

  return {
    id: row.id,
    type: row.type,
    venue: row.venue,
    product: row.product,
    style: row.style,
    price: Number(row.price),
    unit: row.unit,
    lat: Number(row.lat),
    lng: Number(row.lng),
    suburb: row.suburb,
    region: row.region,
    updatedMinutesAgo: minutes,
    openTonight: row.open_tonight,
    special: row.special,
    verified: row.verified,
  };
}

export function listingToRow(listing: Listing): Omit<ListingRow, "created_at"> {
  return {
    id: listing.id,
    type: listing.type,
    venue: listing.venue,
    product: listing.product,
    style: listing.style,
    price: listing.price,
    unit: listing.unit,
    lat: listing.lat,
    lng: listing.lng,
    suburb: listing.suburb,
    region: listing.region,
    open_tonight: listing.openTonight,
    special: listing.special,
    verified: listing.verified,
  };
}

export function applicationToRow(application: SellerApplication) {
  return {
    id: application.id,
    type: application.type,
    business_name: application.businessName,
    contact_email: application.contactEmail,
    licence: application.licence,
    region: application.region,
    status: application.status,
    created_at: application.createdAt,
  };
}
