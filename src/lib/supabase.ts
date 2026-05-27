import { createClient } from "@supabase/supabase-js";
import { Listing } from "./data";
import type { Venue } from "./data";
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
  venue_id: string | null;
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

export type VenueRow = {
  id: string;
  type: Venue["type"];
  name: string;
  chain: string | null;
  address: string;
  suburb: string;
  city: string;
  region: string;
  lat: number;
  lng: number;
  phone: string | null;
  website: string | null;
  source: string;
  checked_at: string;
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
    venueId: row.venue_id ?? undefined,
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
    venue_id: listing.venueId ?? null,
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

export function venueFromRow(row: VenueRow): Venue {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    chain: row.chain,
    address: row.address,
    suburb: row.suburb,
    city: row.city,
    region: row.region,
    lat: Number(row.lat),
    lng: Number(row.lng),
    phone: row.phone,
    website: row.website,
    source: row.source,
    checkedAt: row.checked_at,
    verified: row.verified,
  };
}

export function venueToRow(venue: Venue): Omit<VenueRow, "created_at"> {
  return {
    id: venue.id,
    type: venue.type,
    name: venue.name,
    chain: venue.chain,
    address: venue.address,
    suburb: venue.suburb,
    city: venue.city,
    region: venue.region,
    lat: venue.lat,
    lng: venue.lng,
    phone: venue.phone,
    website: venue.website,
    source: venue.source,
    checked_at: venue.checkedAt,
    verified: venue.verified,
  };
}
