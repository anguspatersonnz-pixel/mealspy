# yourbeer

Local alcohol price intelligence for New Zealand.

yourbeer helps people compare nearby bottle shop prices, tonight's bar specials, and direct listings from licensed small breweries and makers.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Supabase

1. Create a Supabase project.
2. Open the Supabase SQL editor.
3. Run `supabase/schema.sql`.
4. Add these env vars locally and in Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
YOURBEER_ADMIN_TOKEN=...
```

Without those env vars, the API falls back to local `.data` files for development.

## Seller and specials backend

The high-level model is:

- **Sellers** are venues: bottle shops, bars/pubs, or makers in the `venues` table.
- **Specials/prices** are listings in the `listings` table, linked back to a seller with `venue_id`.
- The public app reads from `/api/nearby`, so anything saved through the admin specials API shows up in the customer list automatically.

Admin routes accept either `x-admin-key: YOURBEER_ADMIN_TOKEN` or `Authorization: Bearer YOURBEER_ADMIN_TOKEN`. In local development, they also work without a token if no token is configured.

List sellers:

```bash
curl http://localhost:3000/api/admin/sellers \
  -H "x-admin-key: YOURBEER_ADMIN_TOKEN"
```

Create or update a seller:

```bash
curl -X POST http://localhost:3000/api/admin/sellers \
  -H "Content-Type: application/json" \
  -H "x-admin-key: YOURBEER_ADMIN_TOKEN" \
  -d '{"id":"seller-goldings","type":"bar","name":"Goldings Free Dive","address":"14 Leeds Street","suburb":"Te Aro","city":"Wellington","region":"Wellington","lat":-41.2939,"lng":174.7749}'
```

Add a pub price or special:

```bash
curl -X POST http://localhost:3000/api/admin/specials \
  -H "Content-Type: application/json" \
  -H "x-admin-key: YOURBEER_ADMIN_TOKEN" \
  -d '{"sellerId":"seller-goldings","product":"Guest pale ale","style":"pale ale","price":8,"unit":"pint","special":"Happy hour until 7pm","openTonight":true}'
```

Update a special:

```bash
curl -X PATCH http://localhost:3000/api/admin/specials/SPECIAL_ID \
  -H "Content-Type: application/json" \
  -H "x-admin-key: YOURBEER_ADMIN_TOKEN" \
  -d '{"price":7.5,"special":"Extended until 8pm"}'
```

Remove a special:

```bash
curl -X DELETE http://localhost:3000/api/admin/specials/SPECIAL_ID \
  -H "x-admin-key: YOURBEER_ADMIN_TOKEN"
```

## Import OpenStreetMap venues

For local dev, pull alcohol stores, pubs, bars, and brewery-tagged venues from OpenStreetMap via Overpass:

```bash
npm run import:osm
```

That writes `.data/venues.json`, which the app reads before the built-in starter venues. You can target another region with:

```bash
npm run import:osm -- --region Christchurch
```

## Import starter data

Venue locations first:

```text
type, name, chain, address, suburb, city, region, lat, lng, phone, website, source, checked_at
```

Then POST venues:

```bash
curl -X POST https://your-domain.vercel.app/api/import-venues \
  -H "Content-Type: application/json" \
  -H "x-admin-token: YOURBEER_ADMIN_TOKEN" \
  -d '{"venues":[{"type":"store","name":"Example Bottle Shop","chain":"Example","address":"1 Example Street","suburb":"Te Aro","city":"Wellington","region":"Wellington","lat":-41.2924,"lng":174.7787,"source":"manual"}]}'
```

Prices/specials later:

```text
type, venue, product, style, price, unit, suburb, region, lat, lng, special
```

Then POST it:

```bash
curl -X POST https://your-domain.vercel.app/api/import-listings \
  -H "Content-Type: application/json" \
  -H "x-admin-token: YOURBEER_ADMIN_TOKEN" \
  -d '{"listings":[{"type":"store","venue":"Example Bottle Shop","product":"Lager","style":"lager","price":22.99,"unit":"12 pack","suburb":"Te Aro","region":"Wellington","lat":-41.2924,"lng":174.7787,"special":"Starter price"}]}'
```
