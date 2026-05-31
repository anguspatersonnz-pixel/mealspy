import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const prefix = "test-akl";
const now = new Date().toISOString();
const dealExpiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

async function loadEnvFile(file) {
  if (!existsSync(file)) return;
  const text = await readFile(file, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const raw = trimmed.slice(eq + 1).trim();
    process.env[key] ??= raw.replace(/^["']|["']$/g, "");
  }
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function hours(open = "07:00", close = "21:30", weekendOpen = "08:00", weekendClose = "22:00") {
  return {
    mon: { open, close },
    tue: { open, close },
    wed: { open, close },
    thu: { open, close },
    fri: { open, close: weekendClose },
    sat: { open: weekendOpen, close: weekendClose },
    sun: { open: weekendOpen, close },
  };
}

const cbdCoords = [
  [-36.8485, 174.7633], [-36.8462, 174.7668], [-36.8501, 174.7589], [-36.8523, 174.7649],
  [-36.8445, 174.7707], [-36.8498, 174.7725], [-36.8552, 174.7618], [-36.8427, 174.7581],
  [-36.8538, 174.7688], [-36.8474, 174.7556], [-36.8566, 174.7662], [-36.8454, 174.7621],
  [-36.8516, 174.7751], [-36.8434, 174.7657], [-36.8581, 174.7598], [-36.8469, 174.7739],
  [-36.8508, 174.7702], [-36.8549, 174.7567], [-36.8418, 174.7692], [-36.8594, 174.7641],
  [-36.8441, 174.7549], [-36.8529, 174.7728], [-36.8481, 174.7598], [-36.8561, 174.7714],
  [-36.8491, 174.7671],
];

const remueraCoords = [
  [-36.8794, 174.7995], [-36.8811, 174.8042], [-36.8768, 174.7938], [-36.8842, 174.8124],
  [-36.8729, 174.7897], [-36.8875, 174.8066], [-36.8781, 174.8163], [-36.8834, 174.7952],
  [-36.8755, 174.8078], [-36.8901, 174.8014], [-36.8717, 174.8135], [-36.8864, 174.7912],
  [-36.8802, 174.8191], [-36.8742, 174.7984], [-36.8888, 174.8148], [-36.8773, 174.7905],
  [-36.8827, 174.8099], [-36.8735, 174.8049], [-36.8913, 174.8084], [-36.8799, 174.7946],
  [-36.8855, 174.8181], [-36.8709, 174.7961], [-36.8895, 174.7934], [-36.8761, 174.8115],
  [-36.8839, 174.8027],
];

const onetangiCoords = [
  [-36.7875, 175.0827], [-36.7891, 175.0861], [-36.7858, 175.0789], [-36.7904, 175.0902],
  [-36.7839, 175.0845], [-36.7922, 175.0814], [-36.7867, 175.0938], [-36.7818, 175.0805],
  [-36.7941, 175.0874], [-36.7847, 175.0918], [-36.7883, 175.0764], [-36.7960, 175.0833],
  [-36.7826, 175.0879], [-36.7909, 175.0948], [-36.7851, 175.0748],
];

const venues = [
  ["Harbour Spoon", "restaurant", "CBD", "42 Customs Street East", "Fast lunch bowls and grilled plates near the ferry end of town.", cbdCoords[0]],
  ["Shortland Bento Bar", "takeaway", "CBD", "18 Shortland Street", "Japanese-style bento boxes, katsu sets, and quick rice bowls.", cbdCoords[1]],
  ["Federal Dumpling House", "restaurant", "CBD", "66 Federal Street", "Hand-folded dumplings, noodles, and small plates for groups.", cbdCoords[2]],
  ["Queen Street Curry Co", "restaurant", "CBD", "210 Queen Street", "Compact curry spot with student-friendly lunch combos.", cbdCoords[3]],
  ["Britomart Bagel Stop", "cafe", "CBD", "9 Galway Street", "Bagels, filter coffee, and grab-and-go breakfast deals.", cbdCoords[4]],
  ["Viaduct Taco Window", "takeaway", "CBD", "101 Halsey Street", "Tacos, loaded fries, and waterfront snack boxes.", cbdCoords[5]],
  ["Aotea Noodle Lab", "restaurant", "CBD", "305 Queen Street", "Spicy noodle soups and dry noodles with rotating toppings.", cbdCoords[6]],
  ["High Street Sandwich Works", "cafe", "CBD", "22 High Street", "Pressed sandwiches, salads, and office lunch packs.", cbdCoords[7]],
  ["Wellesley Rice Kitchen", "takeaway", "CBD", "88 Wellesley Street West", "Teriyaki rice, donburi, and simple combo meals.", cbdCoords[8]],
  ["Hobson Smash Burgers", "restaurant", "CBD", "130 Hobson Street", "Thin-patty burgers, fries, and late-night sauces.", cbdCoords[9]],
  ["K Road Falafel Cart", "food-truck", "CBD", "374 Karangahape Road", "Falafel wraps, hummus bowls, and herb-loaded chips.", cbdCoords[10]],
  ["Lorne Street Laksa", "restaurant", "CBD", "31 Lorne Street", "Malaysian-inspired laksa, roti, and iced milk tea.", cbdCoords[11]],
  ["Parnell Rise Pita", "takeaway", "CBD", "4 Parnell Rise", "Fresh pitas and salads on the edge of the city.", cbdCoords[12]],
  ["Fort Lane Pizza Slice", "takeaway", "CBD", "7 Fort Lane", "New York-style slices, knots, and quick counter service.", cbdCoords[13]],
  ["Myers Park Waffle Co", "cafe", "CBD", "15 Mayoral Drive", "Sweet and savoury waffles with strong coffee.", cbdCoords[14]],
  ["Commerce Street Bao", "restaurant", "CBD", "52 Commerce Street", "Bao, dumplings, and crisp seasonal sides.", cbdCoords[15]],
  ["Nelson Street Nasi", "takeaway", "CBD", "146 Nelson Street", "Nasi goreng, satay skewers, and sambal-heavy lunch boxes.", cbdCoords[16]],
  ["Victoria Market Bakery", "bakery", "CBD", "70 Victoria Street West", "Pies, pastries, and filled rolls baked through the morning.", cbdCoords[17]],
  ["Downtown Dosa Corner", "restaurant", "CBD", "12 Gore Street", "Crisp dosas, idli plates, and vegetarian curries.", cbdCoords[18]],
  ["Symonds Street Souvlaki", "takeaway", "CBD", "47 Symonds Street", "Souvlaki wraps, chips, and fresh Greek-style salads.", cbdCoords[19]],
  ["Albert Park Sushi", "takeaway", "CBD", "19 Kitchener Street", "Sushi packs, miso, and hot donburi near the galleries.", cbdCoords[20]],
  ["Fanshawe Fish Roll", "takeaway", "CBD", "115 Fanshawe Street", "Fish rolls, chowder cups, and office lunch specials.", cbdCoords[21]],
  ["Elliott Street Pasta Bar", "restaurant", "CBD", "33 Elliott Street", "Fresh pasta tubs, focaccia, and simple Italian lunches.", cbdCoords[22]],
  ["City Works Grill", "restaurant", "CBD", "90 Wellesley Street West", "Grilled skewers, rice plates, and after-work snack deals.", cbdCoords[23]],
  ["Chancery Salad Counter", "cafe", "CBD", "4 Chancery Street", "Build-your-own salads, soups, and protein bowls.", cbdCoords[24]],
  ["Remuera Road Ramen", "restaurant", "Remuera", "335 Remuera Road", "Neighbourhood ramen shop with broths and rice sides.", remueraCoords[0]],
  ["Upland Village Cafe", "cafe", "Remuera", "587 Remuera Road", "Brunch plates, cabinet food, and friendly coffee service.", remueraCoords[1]],
  ["Benson Road Dumplings", "takeaway", "Remuera", "31 Benson Road", "Dumplings, buns, and noodle boxes for pickup.", remueraCoords[2]],
  ["Greenlane Bahn Mi", "takeaway", "Remuera", "2 Green Lane East", "Banh mi, rice paper rolls, and Vietnamese iced coffee.", remueraCoords[3]],
  ["Orakei Bowl House", "restaurant", "Remuera", "228 Orakei Road", "Poke-style bowls, miso greens, and light dinners.", remueraCoords[4]],
  ["Meadowbank Curry Pot", "restaurant", "Remuera", "7 St Johns Road", "Family curries, naan packs, and mild-to-hot sauces.", remueraCoords[5]],
  ["Remuera Bakehouse", "bakery", "Remuera", "397 Remuera Road", "Classic pies, sausage rolls, and sweet slices.", remueraCoords[6]],
  ["Clonbern Chicken Shop", "takeaway", "Remuera", "11 Clonbern Road", "Rotisserie chicken, chips, slaw, and gravy rolls.", remueraCoords[7]],
  ["Ascot Salad & Soup", "cafe", "Remuera", "92 Ascot Avenue", "Seasonal soups, salads, and toasted sandwiches.", remueraCoords[8]],
  ["Lucerne Sushi Bench", "takeaway", "Remuera", "15 Lucerne Road", "Fresh sushi trays and hot miso for local lunches.", remueraCoords[9]],
  ["Shore Road Taco Shed", "food-truck", "Remuera", "42 Shore Road", "Parked-up taco truck with rotating fillings.", remueraCoords[10]],
  ["Remuera Thai Lunch", "restaurant", "Remuera", "401 Remuera Road", "Thai stir-fries, curries, and speedy lunch portions.", remueraCoords[11]],
  ["Portland Pita Pocket", "takeaway", "Remuera", "27 Portland Road", "Pita pockets, tabbouleh, and lemon chicken plates.", remueraCoords[12]],
  ["Ladies Mile Pasta", "restaurant", "Remuera", "62 Ladies Mile", "Small pasta bar with gnocchi, ragu, and salads.", remueraCoords[13]],
  ["Peach Parade Dairy Bar", "dairy", "Remuera", "19 Peach Parade", "Scoops, toasties, pies, and corner-store snacks.", remueraCoords[14]],
  ["Ohinerau Rice & Grill", "restaurant", "Remuera", "5 Ohinerau Street", "Korean-inspired rice plates and grilled meats.", remueraCoords[15]],
  ["Remuera Village Bagels", "cafe", "Remuera", "328 Remuera Road", "Bagels, schmears, and breakfast coffee combos.", remueraCoords[16]],
  ["Bassett Burger Window", "takeaway", "Remuera", "21 Bassett Road", "Simple burgers, loaded fries, and thick shakes.", remueraCoords[17]],
  ["Market Road Laksa", "restaurant", "Remuera", "88 Market Road", "Laksa, char kway teow, and Malaysian lunch plates.", remueraCoords[18]],
  ["Arney Crescent Deli", "cafe", "Remuera", "14 Arney Crescent", "Deli sandwiches, soups, and picnic boxes.", remueraCoords[19]],
  ["Ngapuhi Noodle Stop", "takeaway", "Remuera", "6 Ngapuhi Road", "Noodles, wontons, and fast takeaway dinners.", remueraCoords[20]],
  ["Remuera Fish & Chips", "takeaway", "Remuera", "480 Remuera Road", "Fish packs, burgers, chips, and family bundles.", remueraCoords[21]],
  ["Koraha Kebab House", "takeaway", "Remuera", "23 Koraha Street", "Kebabs, rice plates, and garlic-loaded chips.", remueraCoords[22]],
  ["Ventnor Vegetarian Kitchen", "restaurant", "Remuera", "16 Ventnor Road", "Vegetarian curries, bowls, and daily specials.", remueraCoords[23]],
  ["Remuera Espresso & Pie", "bakery", "Remuera", "503 Remuera Road", "Espresso, pies, muffins, and budget breakfast rolls.", remueraCoords[24]],
  ["Onetangi Beach Bao", "takeaway", "Onetangi", "1 Fourth Avenue", "Steamed bao, slaw bowls, and beach picnic snacks.", onetangiCoords[0]],
  ["The Strand Fish Roll", "takeaway", "Onetangi", "5 The Strand", "Fish rolls, kumara chips, and quick seaside lunch packs.", onetangiCoords[1]],
  ["Onetangi Sunrise Cafe", "cafe", "Onetangi", "12 Waiheke Road", "Breakfast rolls, coffee, and cabinet food near the sand.", onetangiCoords[2]],
  ["Beachfront Taco Cart", "food-truck", "Onetangi", "18 The Strand", "Soft tacos, salsa, and chilled drinks from a beach cart.", onetangiCoords[3]],
  ["Fourth Ave Flatbreads", "restaurant", "Onetangi", "22 Fourth Avenue", "Flatbreads, dips, and shared plates for beach crews.", onetangiCoords[4]],
  ["Onetangi Noodle Shack", "takeaway", "Onetangi", "29 Waiheke Road", "Noodles, wontons, and fast post-swim takeaway boxes.", onetangiCoords[5]],
  ["Seaview Smash Burgers", "restaurant", "Onetangi", "33 Seaview Road", "Smash burgers, fries, and shakes with a sea-breeze feel.", onetangiCoords[6]],
  ["Waiheke Picnic Bakery", "bakery", "Onetangi", "41 Waiheke Road", "Pies, rolls, cakes, and beach picnic pastry boxes.", onetangiCoords[7]],
  ["Onetangi Rice & Grill", "restaurant", "Onetangi", "7 First Avenue", "Rice plates, grilled skewers, and seasonal sides.", onetangiCoords[8]],
  ["Kiwi Street Curry Hut", "restaurant", "Onetangi", "14 Kiwi Street", "Curries, naan, and family-size takeaway packs.", onetangiCoords[9]],
  ["Ocean View Sushi Bench", "takeaway", "Onetangi", "2 Ocean View Road", "Sushi packs, donburi, and miso close to the beach.", onetangiCoords[10]],
  ["Onetangi Salad & Soup", "cafe", "Onetangi", "9 Third Avenue", "Fresh salads, soups, and toasted sandwiches.", onetangiCoords[11]],
  ["Te Makiri Pita Stop", "takeaway", "Onetangi", "16 Te Makiri Road", "Pitas, tabbouleh, chicken plates, and garlic sauce.", onetangiCoords[12]],
  ["Beach Dairy Toasties", "dairy", "Onetangi", "25 The Strand", "Toasties, scoops, pies, and classic dairy snacks.", onetangiCoords[13]],
  ["Onetangi Pasta Window", "restaurant", "Onetangi", "3 Second Avenue", "Fresh pasta tubs, focaccia, and compact dinner specials.", onetangiCoords[14]],
];

const menuTemplates = [
  [["Chicken rice bowl", "Ginger chicken, pickles, and jasmine rice", 12.5], ["Crispy tofu salad", "Crunchy greens with sesame dressing", 11], ["Pork dumplings", "Six pieces with chilli soy", 9.5], ["Lunch combo", "Main plus drink", 14, true, "Today only combo"]],
  [["Smash burger", "Double patty, cheese, pickles", 13], ["Loaded fries", "Cheese sauce and house seasoning", 8.5], ["Chicken burger", "Crispy thigh and slaw", 12], ["Burger + fries", "Classic combo price", 15, true, "Save $3"]],
  [["Paneer curry", "Tomato curry with rice", 13.5], ["Butter chicken", "Mild creamy curry and rice", 14.5], ["Garlic naan", "Two pieces", 4.5], ["Curry lunch box", "Curry, rice, naan", 12, true, "Lunch deal"]],
  [["Ramen bowl", "Soy broth, noodles, egg", 15], ["Karaage cup", "Crispy chicken pieces", 8], ["Edamame", "Salted green soy beans", 5.5], ["Mini ramen set", "Small ramen and side", 13, true, "Under $15"]],
  [["Falafel wrap", "Falafel, salad, tahini", 10.5], ["Hummus bowl", "Warm pita and pickles", 12], ["Spiced chips", "Paprika salt and garlic sauce", 6], ["Wrap + chips", "Falafel wrap with small chips", 13, true, "Street deal"]],
  [["Sushi eight pack", "Mixed daily sushi", 9.5], ["Teriyaki donburi", "Chicken, rice, cabbage", 12.5], ["Miso soup", "Seaweed and tofu", 3.5], ["Sushi + miso", "Eight pack with soup", 11, true, "Quick lunch"]],
  [["Margherita slice", "Tomato, basil, mozzarella", 6], ["Pepperoni slice", "Classic pepperoni", 7], ["Garlic knots", "Three knots and sauce", 5], ["Two slice special", "Any two slices", 12, true, "Counter special"]],
  [["Steak pie", "Pepper steak filling", 6.5], ["Sausage roll", "House pastry", 4.8], ["Filled roll", "Ham salad roll", 7.5], ["Pie + coffee", "Any pie and regular coffee", 10, true, "Morning deal"]],
  [["Taco trio", "Three mixed tacos", 14], ["Loaded nachos", "Beans, salsa, cheese", 12.5], ["Churro bites", "Cinnamon sugar", 6], ["Two tacos", "Any two tacos", 10, true, "Taco deal"]],
  [["Soup of the day", "Served with bread", 9], ["Chicken sandwich", "Toasted sourdough", 11.5], ["Protein salad", "Greens, grains, egg", 13], ["Soup + sandwich", "Half sandwich and soup", 12, true, "Cafe combo"]],
];

function buildItems(venue, index) {
  const template = menuTemplates[index % menuTemplates.length];
  return template.map(([name, description, price, isDeal = false, dealNote = null], itemIndex) => ({
    id: `${venue.id}-item-${itemIndex + 1}`,
    venue_id: venue.id,
    name,
    description,
    price,
    category: null,
    is_deal: Boolean(isDeal),
    deal_note: dealNote,
    deal_expires: isDeal ? dealExpiry : null,
    is_available: true,
    created_at: now,
    image_url: null,
  }));
}

const foodVenues = venues.map(([name, category, suburb, address, description, coord], index) => ({
  id: `${prefix}-${String(index + 1).padStart(2, "0")}`,
  name,
  slug: `${slugify(name)}-test`,
  category,
  address,
  suburb,
  city: "Auckland",
  lat: coord[0],
  lng: coord[1],
  phone: `09 55${String(index + 10).padStart(2, "0")} ${String(1000 + index)}`,
  website: `https://example.com/${slugify(name)}`,
  description,
  image_url: null,
  claim_token: `test-token-${String(index + 1).padStart(2, "0")}`,
  created_at: now,
  approved: true,
  menu_status: "live",
  opening_hours: hours(
    index % 5 === 0 ? "06:30" : "07:00",
    index % 7 === 0 ? "20:00" : "21:30",
    "08:00",
    index % 3 === 0 ? "23:00" : "22:00",
  ),
}));

const foodItems = foodVenues.flatMap(buildItems);

async function seedSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return false;

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const ids = foodVenues.map((venue) => venue.id);
  const { error: deleteError } = await supabase.from("food_venues").delete().like("id", `${prefix}-%`);
  if (deleteError) throw deleteError;

  const { error: venueError } = await supabase.from("food_venues").insert(foodVenues);
  if (venueError) throw venueError;

  const { error: itemError } = await supabase.from("food_items").insert(foodItems);
  if (itemError) throw itemError;

  console.log(`Seeded ${ids.length} test food venues and ${foodItems.length} menu items in Supabase.`);
  return true;
}

async function seedLocal() {
  const dataDir = path.join(root, ".data");
  await mkdir(dataDir, { recursive: true });

  const venuesPath = path.join(dataDir, "food-venues.json");
  const itemsPath = path.join(dataDir, "food-items.json");
  const currentVenues = existsSync(venuesPath) ? JSON.parse(await readFile(venuesPath, "utf8")) : [];
  const currentItems = existsSync(itemsPath) ? JSON.parse(await readFile(itemsPath, "utf8")) : [];

  const nextVenues = [
    ...foodVenues.map((venue) => ({
      id: venue.id,
      name: venue.name,
      slug: venue.slug,
      category: venue.category,
      address: venue.address,
      suburb: venue.suburb,
      city: venue.city,
      lat: venue.lat,
      lng: venue.lng,
      phone: venue.phone,
      website: venue.website,
      description: venue.description,
      imageUrl: venue.image_url,
      claimToken: venue.claim_token,
      createdAt: venue.created_at,
      approved: venue.approved,
      menuStatus: venue.menu_status,
      openingHours: venue.opening_hours,
    })),
    ...currentVenues.filter((venue) => !String(venue.id).startsWith(`${prefix}-`)),
  ];

  const nextItems = [
    ...foodItems.map((item) => ({
      id: item.id,
      venueId: item.venue_id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      isDeal: item.is_deal,
      dealNote: item.deal_note,
      dealExpires: item.deal_expires,
      isAvailable: item.is_available,
      createdAt: item.created_at,
      imageUrl: item.image_url,
    })),
    ...currentItems.filter((item) => !String(item.venueId).startsWith(`${prefix}-`)),
  ];

  await writeFile(venuesPath, JSON.stringify(nextVenues, null, 2));
  await writeFile(itemsPath, JSON.stringify(nextItems, null, 2));
  console.log(`Seeded ${foodVenues.length} test food venues and ${foodItems.length} menu items locally.`);
}

await loadEnvFile(path.join(root, ".env.local"));

try {
  const usedSupabase = await seedSupabase();
  if (!usedSupabase) await seedLocal();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
