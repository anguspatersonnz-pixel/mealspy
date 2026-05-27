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
