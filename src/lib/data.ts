export type ListingType = "store" | "bar" | "maker";
export type VenueType = ListingType;

export type FoodCategory = "restaurant" | "cafe" | "bakery" | "food-truck" | "takeaway" | "dairy";

export const FOOD_CATEGORIES: Array<{ value: FoodCategory; label: string; emoji: string }> = [
  { value: "restaurant", label: "Restaurant", emoji: "🍽️" },
  { value: "cafe", label: "Café", emoji: "☕" },
  { value: "bakery", label: "Bakery", emoji: "🥐" },
  { value: "food-truck", label: "Food truck", emoji: "🚚" },
  { value: "takeaway", label: "Takeaway", emoji: "🥡" },
  { value: "dairy", label: "Dairy / dairy bar", emoji: "🍦" },
];

export type FoodVenue = {
  id: string;
  name: string;
  slug: string;
  category: FoodCategory;
  address: string;
  suburb: string;
  city: string;
  lat: number;
  lng: number;
  phone: string | null;
  website: string | null;
  description: string | null;
  claimToken: string;
  createdAt: string;
  distanceKm?: number;
};

export type FoodItem = {
  id: string;
  venueId: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  isDeal: boolean;
  dealNote: string | null;
  dealExpires: string | null;
  isAvailable: boolean;
  createdAt: string;
};

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
  venueId?: string;
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
    id: "venue-liquorland-wellington-central",
    type: "store",
    name: "Liquorland Wellington Central",
    chain: "Liquorland",
    address: "233 Victoria Street",
    suburb: "Te Aro",
    city: "Wellington",
    region: "Wellington",
    lat: -41.2953749,
    lng: 174.7724029,
    phone: "04 801 8805",
    website: "https://www.liquorland.co.nz/store-locations/liquorland-wellington-central",
    source: "Liquorland licence/store page + OpenStreetMap geocode",
    checkedAt: "2026-05-26",
    verified: true,
  },
  {
    id: "venue-super-liquor-karori",
    type: "store",
    name: "Super Liquor Karori",
    chain: "Super Liquor",
    address: "5 Parkvale Road",
    suburb: "Karori",
    city: "Wellington",
    region: "Wellington",
    lat: -41.2841774,
    lng: 174.7371495,
    phone: "04 476 6514",
    website: "https://www.superliquor.co.nz/super-liquor-karori",
    source: "Super Liquor store page + OpenStreetMap geocode",
    checkedAt: "2026-05-26",
    verified: true,
  },
  {
    id: "venue-super-liquor-johnsonville",
    type: "store",
    name: "Super Liquor Johnsonville",
    chain: "Super Liquor",
    address: "8 Broderick Road",
    suburb: "Johnsonville",
    city: "Wellington",
    region: "Wellington",
    lat: -41.2242069,
    lng: 174.8065062,
    phone: "04 478 6976",
    website: "https://www.superliquor.co.nz/StoreLocator/Stores",
    source: "public store directory + OpenStreetMap geocode",
    checkedAt: "2026-05-26",
    verified: true,
  },
  {
    id: "venue-big-barrel-newtown",
    type: "store",
    name: "Big Barrel Newtown",
    chain: "Big Barrel",
    address: "34 Constable Street",
    suburb: "Newtown",
    city: "Wellington",
    region: "Wellington",
    lat: -41.3135529,
    lng: 174.781669,
    phone: "04 389 7285",
    website: "https://newtown.bigbarrel.co.nz/",
    source: "Big Barrel/public directory + OpenStreetMap geocode",
    checkedAt: "2026-05-26",
    verified: true,
  },
  {
    id: "venue-big-barrel-kent-terrace",
    type: "store",
    name: "Big Barrel Kent Terrace",
    chain: "Big Barrel",
    address: "27-29 Kent Terrace",
    suburb: "Mount Victoria",
    city: "Wellington",
    region: "Wellington",
    lat: -41.2956564,
    lng: 174.7835991,
    phone: "04 381 3951",
    website: "https://kenttce.bigbarrel.co.nz/",
    source: "Big Barrel/public directory + OpenStreetMap geocode",
    checkedAt: "2026-05-26",
    verified: true,
  },
  {
    id: "venue-big-barrel-miramar",
    type: "store",
    name: "Big Barrel Miramar",
    chain: "Big Barrel",
    address: "Unit 6/11 Tauhinu Road",
    suburb: "Miramar",
    city: "Wellington",
    region: "Wellington",
    lat: -41.3186,
    lng: 174.8167,
    phone: "04 212 4783",
    website: "https://miramar.bigbarrel.co.nz/",
    source: "Big Barrel/public directory; approximate suburb geocode",
    checkedAt: "2026-05-26",
    verified: true,
  },
  {
    id: "venue-big-barrel-lower-hutt",
    type: "store",
    name: "Big Barrel Lower Hutt",
    chain: "Big Barrel",
    address: "15 Rutherford Street",
    suburb: "Hutt Central",
    city: "Lower Hutt",
    region: "Wellington",
    lat: -41.2051265,
    lng: 174.9092952,
    phone: "04 566 6664",
    website: "https://bigbarrel.co.nz/en",
    source: "public directory + OpenStreetMap geocode",
    checkedAt: "2026-05-26",
    verified: true,
  },
  {
    id: "venue-big-barrel-taita",
    type: "store",
    name: "Big Barrel Taita",
    chain: "Big Barrel",
    address: "1123 High Street",
    suburb: "Taita",
    city: "Lower Hutt",
    region: "Wellington",
    lat: -41.1887119,
    lng: 174.9516964,
    phone: "04 577 1540",
    website: "https://bigbarrel.co.nz/en",
    source: "public directory + OpenStreetMap geocode",
    checkedAt: "2026-05-26",
    verified: true,
  },
  {
    id: "venue-big-barrel-titahi-bay",
    type: "store",
    name: "Big Barrel Titahi Bay",
    chain: "Big Barrel",
    address: "64B Morere Street",
    suburb: "Titahi Bay",
    city: "Porirua",
    region: "Wellington",
    lat: -41.1082953,
    lng: 174.8432868,
    phone: "04 236 6666",
    website: "https://bigbarrel.co.nz/en",
    source: "public directory + OpenStreetMap geocode",
    checkedAt: "2026-05-26",
    verified: true,
  },
  {
    id: "venue-cuba-liquor-world",
    type: "store",
    name: "Cuba Liquor World",
    chain: null,
    address: "145 Cuba Street",
    suburb: "Te Aro",
    city: "Wellington",
    region: "Wellington",
    lat: -41.293463,
    lng: 174.7757388,
    phone: "04 384 8657",
    website: null,
    source: "public directory + OpenStreetMap geocode",
    checkedAt: "2026-05-26",
    verified: true,
  },
  {
    id: "venue-hataitai-liquor-centre",
    type: "store",
    name: "Hataitai Liquor Centre",
    chain: null,
    address: "9 Moxham Avenue",
    suburb: "Hataitai",
    city: "Wellington",
    region: "Wellington",
    lat: -41.3047527,
    lng: 174.7940239,
    phone: "04 386 4565",
    website: null,
    source: "public directory + OpenStreetMap geocode",
    checkedAt: "2026-05-26",
    verified: true,
  },
  {
    id: "venue-tinakori-fine-wines",
    type: "store",
    name: "Tinakori Fine Wines & Spirits",
    chain: null,
    address: "348 Tinakori Road",
    suburb: "Thorndon",
    city: "Wellington",
    region: "Wellington",
    lat: -41.2789365,
    lng: 174.7688897,
    phone: null,
    website: null,
    source: "public directory + OpenStreetMap geocode",
    checkedAt: "2026-05-26",
    verified: true,
  },
  {
    id: "venue-ngaio-discount-liquor",
    type: "store",
    name: "Ngaio Discount Liquor",
    chain: null,
    address: "1 Khandallah Road",
    suburb: "Ngaio",
    city: "Wellington",
    region: "Wellington",
    lat: -41.2472072,
    lng: 174.7750646,
    phone: "04 479 6985",
    website: null,
    source: "public directory + OpenStreetMap geocode",
    checkedAt: "2026-05-26",
    verified: true,
  },
  {
    id: "venue-regional-wines-spirits",
    type: "store",
    name: "Regional Wines & Spirits",
    chain: null,
    address: "15 Ellice Street",
    suburb: "Mount Victoria",
    city: "Wellington",
    region: "Wellington",
    lat: -41.2997691,
    lng: 174.782077,
    phone: null,
    website: null,
    source: "public directory + OpenStreetMap geocode",
    checkedAt: "2026-05-26",
    verified: true,
  },
  {
    id: "venue-thirsty-liquor-cambridge-terrace",
    type: "store",
    name: "Thirsty Liquor Cambridge Terrace",
    chain: "Thirsty Liquor",
    address: "63 Cambridge Terrace",
    suburb: "Te Aro",
    city: "Wellington",
    region: "Wellington",
    lat: -41.2975959,
    lng: 174.7814994,
    phone: null,
    website: null,
    source: "public directory + OpenStreetMap geocode",
    checkedAt: "2026-05-26",
    verified: true,
  },
  {
    id: "venue-liquorland-hobson-street-cbd",
    type: "store",
    name: "Liquorland Hobson Street CBD",
    chain: "Liquorland",
    address: "51 Hobson Street",
    suburb: "Auckland Central",
    city: "Auckland",
    region: "Auckland",
    lat: -36.847539,
    lng: 174.761903,
    phone: null,
    website: "https://www.liquorland.co.nz/store-locations/liquorland-hobson-street-cbd",
    source: "Liquorland store/licence page + public address geocode",
    checkedAt: "2026-05-27",
    verified: true,
  },
  {
    id: "venue-glengarry-victoria-park",
    type: "store",
    name: "Glengarry Victoria Park",
    chain: "Glengarry",
    address: "118 Wellesley Street West",
    suburb: "Auckland Central",
    city: "Auckland",
    region: "Auckland",
    lat: -36.8498,
    lng: 174.7591,
    phone: "09 308 8346",
    website: "https://www.glengarrywines.co.nz/store/victoriapark",
    source: "Glengarry store page + public address geocode",
    checkedAt: "2026-05-27",
    verified: true,
  },
  {
    id: "venue-glengarry-parnell",
    type: "store",
    name: "Glengarry Parnell",
    chain: "Glengarry",
    address: "164 Parnell Road",
    suburb: "Parnell",
    city: "Auckland",
    region: "Auckland",
    lat: -36.8549,
    lng: 174.7817,
    phone: "09 358 1333",
    website: "https://www.glengarrywines.co.nz/store/parnell",
    source: "Glengarry store page + public address geocode",
    checkedAt: "2026-05-27",
    verified: true,
  },
  {
    id: "venue-fine-wine-delivery-mt-wellington",
    type: "store",
    name: "Fine Wine Delivery Mt Wellington",
    chain: "Fine Wine Delivery",
    address: "42 Lunn Avenue",
    suburb: "Mount Wellington",
    city: "Auckland",
    region: "Auckland",
    lat: -36.8889,
    lng: 174.8398,
    phone: "09 377 2300",
    website: "https://www.finewinedelivery.co.nz/",
    source: "Fine Wine Delivery/public directory + public address geocode",
    checkedAt: "2026-05-27",
    verified: true,
  },
  {
    id: "venue-beer-jerk-eden-terrace",
    type: "store",
    name: "Beer Jerk",
    chain: null,
    address: "2/2 Shaddock Street",
    suburb: "Eden Terrace",
    city: "Auckland",
    region: "Auckland",
    lat: -36.8669,
    lng: 174.7612,
    phone: null,
    website: "https://www.beerjerk.co.nz/pages/contact-us",
    source: "Beer Jerk contact page + public address geocode",
    checkedAt: "2026-05-27",
    verified: true,
  },
  {
    id: "venue-garage-project-kingsland",
    type: "maker",
    name: "Garage Project Kingsland",
    chain: "Garage Project",
    address: "357 New North Road",
    suburb: "Kingsland",
    city: "Auckland",
    region: "Auckland",
    lat: -36.866,
    lng: 174.7462,
    phone: "09 950 9980",
    website: "https://garageproject.co.nz/locations/kingsland-cellar-door",
    source: "Garage Project location page + public address geocode",
    checkedAt: "2026-05-27",
    verified: true,
  },
  {
    id: "venue-brothers-beer-city-works-depot",
    type: "maker",
    name: "Brothers Beer City Works Depot",
    chain: "Brothers Beer",
    address: "Shed 3D, City Works Depot, 90 Wellesley Street West",
    suburb: "Auckland Central",
    city: "Auckland",
    region: "Auckland",
    lat: -36.8501,
    lng: 174.7582,
    phone: "09 366 6100",
    website: "https://brothersbeer.co.nz/",
    source: "public venue directory + City Works Depot geocode",
    checkedAt: "2026-05-27",
    verified: true,
  },
  {
    id: "venue-behemoth-churlys",
    type: "maker",
    name: "Churly's Brewpub & Eatery",
    chain: "Behemoth Brewing",
    address: "1A Charles Street",
    suburb: "Mount Eden",
    city: "Auckland",
    region: "Auckland",
    lat: -36.8734,
    lng: 174.7552,
    phone: "09 218 3521",
    website: "https://www.behemothbrewing.co.nz/contact",
    source: "Behemoth contact page + public address geocode",
    checkedAt: "2026-05-27",
    verified: true,
  },
  {
    id: "venue-urbanaut-brewery-taproom",
    type: "maker",
    name: "Urbanaut Brewery Taproom",
    chain: "Urbanaut",
    address: "597 New North Road",
    suburb: "Morningside",
    city: "Auckland",
    region: "Auckland",
    lat: -36.8761,
    lng: 174.7335,
    phone: null,
    website: "https://urbanautbrewing.co.nz/",
    source: "public venue/licence directory + public address geocode",
    checkedAt: "2026-05-27",
    verified: true,
  },
  {
    id: "venue-hallertau-riverhead",
    type: "maker",
    name: "Hallertau Riverhead",
    chain: "Hallertau",
    address: "1171 Coatesville-Riverhead Highway",
    suburb: "Riverhead",
    city: "Auckland",
    region: "Auckland",
    lat: -36.7598,
    lng: 174.5834,
    phone: "09 412 5555",
    website: "https://hallertau.co.nz/pages/riverhead",
    source: "Hallertau Riverhead page + public address geocode",
    checkedAt: "2026-05-27",
    verified: true,
  },
  {
    id: "venue-hallertau-clevedon",
    type: "maker",
    name: "Hallertau Clevedon",
    chain: "Hallertau",
    address: "26 Clevedon-Kawakawa Road",
    suburb: "Clevedon",
    city: "Auckland",
    region: "Auckland",
    lat: -36.9914,
    lng: 175.0355,
    phone: "09 869 2989",
    website: "https://hallertau.co.nz/pages/contact",
    source: "Hallertau contact page + public address geocode",
    checkedAt: "2026-05-27",
    verified: true,
  },
  {
    id: "venue-the-beer-spot-northcote",
    type: "bar",
    name: "The Beer Spot Northcote",
    chain: "The Beer Spot",
    address: "54 Northcote Road",
    suburb: "Northcote",
    city: "Auckland",
    region: "Auckland",
    lat: -36.8018,
    lng: 174.7486,
    phone: "0800 762 343",
    website: "https://shop.thebeerspot.co.nz/pages/contact",
    source: "The Beer Spot contact page + public address geocode",
    checkedAt: "2026-05-27",
    verified: true,
  },
  {
    id: "venue-the-beer-spot-morningside",
    type: "bar",
    name: "The Beer Spot Morningside",
    chain: "The Beer Spot",
    address: "596 New North Road",
    suburb: "Morningside",
    city: "Auckland",
    region: "Auckland",
    lat: -36.8759,
    lng: 174.7337,
    phone: "0800 762 343",
    website: "https://shop.thebeerspot.co.nz/pages/contact",
    source: "The Beer Spot contact page + public address geocode",
    checkedAt: "2026-05-27",
    verified: true,
  },
  {
    id: "venue-the-beer-spot-panmure",
    type: "bar",
    name: "The Beer Spot Panmure",
    chain: "The Beer Spot",
    address: "Unit 12, 71 Jellicoe Road",
    suburb: "Panmure",
    city: "Auckland",
    region: "Auckland",
    lat: -36.8996,
    lng: 174.8527,
    phone: "0800 762 343",
    website: "https://shop.thebeerspot.co.nz/pages/contact",
    source: "The Beer Spot contact page + public address geocode",
    checkedAt: "2026-05-27",
    verified: true,
  },
  {
    id: "venue-the-beer-spot-huapai",
    type: "bar",
    name: "The Beer Spot Huapai",
    chain: "The Beer Spot",
    address: "321 Main Road",
    suburb: "Huapai",
    city: "Auckland",
    region: "Auckland",
    lat: -36.7711,
    lng: 174.5488,
    phone: "0800 762 343",
    website: "https://shop.thebeerspot.co.nz/pages/contact",
    source: "The Beer Spot contact page + public address geocode",
    checkedAt: "2026-05-27",
    verified: true,
  },
  {
    id: "venue-the-beer-spot-papakura",
    type: "bar",
    name: "The Beer Spot Papakura",
    chain: "The Beer Spot",
    address: "18 Broadway",
    suburb: "Papakura",
    city: "Auckland",
    region: "Auckland",
    lat: -37.0635,
    lng: 174.9438,
    phone: "0800 762 343",
    website: "https://shop.thebeerspot.co.nz/pages/contact",
    source: "The Beer Spot contact page + public address geocode",
    checkedAt: "2026-05-27",
    verified: true,
  },
  {
    id: "venue-the-beer-spot-whangaparaoa",
    type: "bar",
    name: "The Beer Spot Whangaparaoa",
    chain: "The Beer Spot",
    address: "Coast Plaza, 719 Whangaparaoa Road",
    suburb: "Stanmore Bay",
    city: "Auckland",
    region: "Auckland",
    lat: -36.6276,
    lng: 174.7389,
    phone: "0800 762 343",
    website: "https://shop.thebeerspot.co.nz/pages/contact",
    source: "The Beer Spot contact page + public address geocode",
    checkedAt: "2026-05-27",
    verified: true,
  },
  {
    id: "venue-16-tun",
    type: "bar",
    name: "16 Tun",
    chain: null,
    address: "10/26 Jellicoe Street",
    suburb: "Wynyard Quarter",
    city: "Auckland",
    region: "Auckland",
    lat: -36.8417,
    lng: 174.7583,
    phone: null,
    website: "https://www.16tun.co.nz/visit",
    source: "16 Tun/Wynyard Quarter venue page + public address geocode",
    checkedAt: "2026-05-27",
    verified: true,
  },
  {
    id: "venue-galbraiths-alehouse",
    type: "bar",
    name: "Galbraith's Alehouse",
    chain: null,
    address: "2 Mount Eden Road",
    suburb: "Eden Terrace",
    city: "Auckland",
    region: "Auckland",
    lat: -36.8658,
    lng: 174.7637,
    phone: "09 379 3557",
    website: "https://alehouse.co.nz/",
    source: "Galbraith's official site + public address geocode",
    checkedAt: "2026-05-27",
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
