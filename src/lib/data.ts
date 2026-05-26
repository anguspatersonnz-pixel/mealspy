export type ListingType = "store" | "bar" | "maker";
export type VenueType = ListingType;

export type AlcoholStyle =
  | "lager"
  | "ipa"
  | "pale ale"
  | "stout"
  | "cider"
  | "wine"
  | "spirits"
  | "mixed";

export type Listing = {
  id: string;
  type: ListingType;
  venue: string;
  product: string;
  style: AlcoholStyle;
  price: number;
  unit: string;
  lat: number;
  lng: number;
  distanceKm?: number;
  suburb: string;
  region: string;
  updatedMinutesAgo: number;
  openTonight: boolean;
  special: string;
  verified: boolean;
};

export type Venue = {
  id: string;
  type: VenueType;
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
  checkedAt: string;
  verified: boolean;
  distanceKm?: number;
};

export const listings: Listing[] = [
  {
    id: "yb-001",
    type: "store",
    venue: "Thorndon Bottle House",
    product: "Parrotdog Bitterbitch",
    style: "ipa",
    price: 21.49,
    unit: "6 x 330ml",
    lat: -41.2769,
    lng: 174.7772,
    suburb: "Thorndon",
    region: "Wellington",
    updatedMinutesAgo: 12,
    openTonight: true,
    special: "Shelf price verified this afternoon. No loyalty card needed.",
    verified: true,
  },
  {
    id: "yb-002",
    type: "bar",
    venue: "Golding's Free Dive",
    product: "Guest pale ale",
    style: "pale ale",
    price: 8,
    unit: "pint",
    lat: -41.2939,
    lng: 174.7749,
    suburb: "Te Aro",
    region: "Wellington",
    updatedMinutesAgo: 4,
    openTonight: true,
    special: "Happy hour until 7pm. Rotating tap while keg lasts.",
    verified: true,
  },
  {
    id: "yb-003",
    type: "store",
    venue: "Kelburn Liquor Centre",
    product: "Mac's Gold",
    style: "lager",
    price: 23.99,
    unit: "12 x 330ml",
    lat: -41.2903,
    lng: 174.7592,
    suburb: "Kelburn",
    region: "Wellington",
    updatedMinutesAgo: 34,
    openTonight: true,
    special: "Case deal. Price excludes delivery.",
    verified: true,
  },
  {
    id: "yb-004",
    type: "bar",
    venue: "Aro Taproom",
    product: "House lager",
    style: "lager",
    price: 18,
    unit: "jug",
    lat: -41.2955,
    lng: 174.7676,
    suburb: "Aro Valley",
    region: "Wellington",
    updatedMinutesAgo: 8,
    openTonight: true,
    special: "Tonight only, 5pm to 9pm.",
    verified: true,
  },
  {
    id: "yb-005",
    type: "maker",
    venue: "South Coast Ferments",
    product: "Feijoa cider",
    style: "cider",
    price: 18,
    unit: "4 x 440ml",
    lat: -41.3375,
    lng: 174.7726,
    suburb: "Island Bay",
    region: "Wellington",
    updatedMinutesAgo: 26,
    openTonight: true,
    special: "Licensed maker. Saturday pickup and courier age check available.",
    verified: true,
  },
  {
    id: "yb-006",
    type: "bar",
    venue: "Rogue & Vagabond",
    product: "Stout",
    style: "stout",
    price: 7.5,
    unit: "schooner",
    lat: -41.2926,
    lng: 174.774,
    suburb: "Te Aro",
    region: "Wellington",
    updatedMinutesAgo: 17,
    openTonight: true,
    special: "Dark beer special after 8pm.",
    verified: true,
  },
  {
    id: "yb-007",
    type: "store",
    venue: "Harbour Wine & Spirits",
    product: "House sauvignon blanc",
    style: "wine",
    price: 11.99,
    unit: "750ml",
    lat: -41.284,
    lng: 174.7762,
    suburb: "Wellington Central",
    region: "Wellington",
    updatedMinutesAgo: 54,
    openTonight: true,
    special: "Single bottle special, no minimum.",
    verified: false,
  },
  {
    id: "yb-008",
    type: "maker",
    venue: "Kereru Small Batch",
    product: "Fresh hop hazy",
    style: "ipa",
    price: 24,
    unit: "4 x 440ml",
    lat: -41.124,
    lng: 175.0706,
    suburb: "Upper Hutt",
    region: "Wellington",
    updatedMinutesAgo: 45,
    openTonight: false,
    special: "Direct brewery pickup. Limited batch, 42 packs left.",
    verified: true,
  },
  {
    id: "yb-009",
    type: "store",
    venue: "Customhouse Cellars",
    product: "Vodka",
    style: "spirits",
    price: 39.9,
    unit: "1L",
    lat: -41.2796,
    lng: 174.781,
    suburb: "Pipitea",
    region: "Wellington",
    updatedMinutesAgo: 92,
    openTonight: false,
    special: "Cheapest within 10km, opens tomorrow morning.",
    verified: true,
  },
  {
    id: "yb-010",
    type: "bar",
    venue: "Morningside Tavern",
    product: "Tap lager",
    style: "lager",
    price: 7,
    unit: "pint",
    lat: -36.8756,
    lng: 174.7322,
    suburb: "Morningside",
    region: "Auckland",
    updatedMinutesAgo: 10,
    openTonight: true,
    special: "Submitted by venue. Active until kickoff ends.",
    verified: true,
  },
  {
    id: "yb-011",
    type: "maker",
    venue: "Grey Lynn Garage Brew",
    product: "Neighbourhood pale ale",
    style: "pale ale",
    price: 20,
    unit: "4 x 440ml",
    lat: -36.858,
    lng: 174.731,
    suburb: "Grey Lynn",
    region: "Auckland",
    updatedMinutesAgo: 23,
    openTonight: true,
    special: "Licensed nanobrewery. Taproom pickup only.",
    verified: true,
  },
  {
    id: "yb-012",
    type: "store",
    venue: "Ponsonby Liquor",
    product: "Mixed RTDs",
    style: "mixed",
    price: 27,
    unit: "10 pack",
    lat: -36.8474,
    lng: 174.7435,
    suburb: "Ponsonby",
    region: "Auckland",
    updatedMinutesAgo: 39,
    openTonight: true,
    special: "Multi-pack price from public shelf check.",
    verified: false,
  },
];

export const starterVenues: Venue[] = [
  {
    id: "venue-thorndon-bottle-house",
    type: "store",
    name: "Thorndon Bottle House",
    chain: null,
    address: "Thorndon",
    suburb: "Thorndon",
    city: "Wellington",
    region: "Wellington",
    lat: -41.2769,
    lng: 174.7772,
    phone: null,
    website: null,
    source: "starter",
    checkedAt: "2026-05-26",
    verified: true,
  },
  {
    id: "venue-kelburn-liquor-centre",
    type: "store",
    name: "Kelburn Liquor Centre",
    chain: null,
    address: "Kelburn",
    suburb: "Kelburn",
    city: "Wellington",
    region: "Wellington",
    lat: -41.2903,
    lng: 174.7592,
    phone: null,
    website: null,
    source: "starter",
    checkedAt: "2026-05-26",
    verified: true,
  },
  {
    id: "venue-goldings-free-dive",
    type: "bar",
    name: "Golding's Free Dive",
    chain: null,
    address: "Te Aro",
    suburb: "Te Aro",
    city: "Wellington",
    region: "Wellington",
    lat: -41.2939,
    lng: 174.7749,
    phone: null,
    website: null,
    source: "starter",
    checkedAt: "2026-05-26",
    verified: true,
  },
  {
    id: "venue-aro-taproom",
    type: "bar",
    name: "Aro Taproom",
    chain: null,
    address: "Aro Valley",
    suburb: "Aro Valley",
    city: "Wellington",
    region: "Wellington",
    lat: -41.2955,
    lng: 174.7676,
    phone: null,
    website: null,
    source: "starter",
    checkedAt: "2026-05-26",
    verified: true,
  },
  {
    id: "venue-south-coast-ferments",
    type: "maker",
    name: "South Coast Ferments",
    chain: null,
    address: "Island Bay",
    suburb: "Island Bay",
    city: "Wellington",
    region: "Wellington",
    lat: -41.3375,
    lng: 174.7726,
    phone: null,
    website: null,
    source: "starter",
    checkedAt: "2026-05-26",
    verified: true,
  },
  {
    id: "venue-morningside-tavern",
    type: "bar",
    name: "Morningside Tavern",
    chain: null,
    address: "Morningside",
    suburb: "Morningside",
    city: "Auckland",
    region: "Auckland",
    lat: -36.8756,
    lng: 174.7322,
    phone: null,
    website: null,
    source: "starter",
    checkedAt: "2026-05-26",
    verified: true,
  },
  {
    id: "venue-ponsonby-liquor",
    type: "store",
    name: "Ponsonby Liquor",
    chain: null,
    address: "Ponsonby",
    suburb: "Ponsonby",
    city: "Auckland",
    region: "Auckland",
    lat: -36.8474,
    lng: 174.7435,
    phone: null,
    website: null,
    source: "starter",
    checkedAt: "2026-05-26",
    verified: true,
  },
];

export const styles: AlcoholStyle[] = [
  "lager",
  "ipa",
  "pale ale",
  "stout",
  "cider",
  "wine",
  "spirits",
  "mixed",
];

export const regions = ["Wellington", "Auckland", "Christchurch", "Hamilton", "Dunedin"];

export const regionCentres: Record<string, { lat: number; lng: number }> = {
  Wellington: { lat: -41.2924, lng: 174.7787 },
  Auckland: { lat: -36.8485, lng: 174.7633 },
  Christchurch: { lat: -43.5321, lng: 172.6362 },
  Hamilton: { lat: -37.787, lng: 175.2793 },
  Dunedin: { lat: -45.8788, lng: 170.5028 },
};

export function distanceKm(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const earthRadiusKm = 6371;
  const dLat = degreesToRadians(to.lat - from.lat);
  const dLng = degreesToRadians(to.lng - from.lng);
  const lat1 = degreesToRadians(from.lat);
  const lat2 = degreesToRadians(to.lat);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function degreesToRadians(degrees: number) {
  return degrees * (Math.PI / 180);
}

export function listingsNear(params: {
  lat: number;
  lng: number;
  radiusKm: number;
  type?: ListingType | "all";
  style?: AlcoholStyle | "all";
  openTonight?: boolean;
}) {
  return listings
    .map((listing) => ({
      ...listing,
      distanceKm: Number(distanceKm(params, listing).toFixed(1)),
    }))
    .filter((listing) => listing.distanceKm <= params.radiusKm)
    .filter((listing) => !params.type || params.type === "all" || listing.type === params.type)
    .filter((listing) => !params.style || params.style === "all" || listing.style === params.style)
    .filter((listing) => !params.openTonight || listing.openTonight)
    .sort((a, b) => a.price - b.price);
}

export function venuesNear(params: {
  lat: number;
  lng: number;
  radiusKm: number;
  type?: VenueType | "all";
}) {
  return starterVenues
    .map((venue) => ({
      ...venue,
      distanceKm: Number(distanceKm(params, venue).toFixed(1)),
    }))
    .filter((venue) => venue.distanceKm <= params.radiusKm)
    .filter((venue) => !params.type || params.type === "all" || venue.type === params.type)
    .sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99));
}

export function money(value: number) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
  }).format(value);
}
