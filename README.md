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
```

Without those env vars, the API falls back to local `.data` files for development.
