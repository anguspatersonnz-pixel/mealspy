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

## Import starter data

Convert a spreadsheet to JSON with these fields:

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
