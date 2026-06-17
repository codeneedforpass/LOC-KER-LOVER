# LOC-KER-LOVER

A secure, mutual location-sharing app for couples. The UI currently runs as an **interactive simulator** with in-memory state; this repo is set up to move to a real backend without Google AI Studio.

## Recommended stack (all have free tiers)

| Layer | Recommendation | Why |
|-------|----------------|-----|
| **Frontend hosting** | [Render](https://render.com) Static Site, [Vercel](https://vercel.com), [Netlify](https://netlify.com), or [Cloudflare Pages](https://pages.cloudflare.com) | Free CDN deploy for Vite/React SPAs |
| **Database + Realtime** | [Supabase](https://supabase.com) | Postgres, live location sync via Realtime, Storage for couple photos |
| **Auth** | Supabase Auth *(default)* or [Clerk](https://clerk.com) *(optional)* | Pairing, sessions, OAuth — Supabase keeps everything in one project |
| **Maps** | [Leaflet](https://leafletjs.com) + OpenStreetMap *(free)* or [Mapbox](https://mapbox.com) | Replace the SVG simulator with a real map when ready |
| **Push (later)** | [OneSignal](https://onesignal.com) | Geofence / SOS alerts on mobile web |

No Gemini or AI Studio is required — the app does not call any AI APIs.

### Suggested architecture

```
Browser (Vite/React)
    → Supabase Auth (login / pair codes)
    → Supabase Postgres (profiles, pairs, locations, chat)
    → Supabase Realtime (live lat/lon between partners)
    → Supabase Storage (shared gallery)
Hosted on Render / Vercel / Netlify (static `dist/`)
```

Reference SQL for tables and RLS lives in [`supabase/schema.reference.sql`](supabase/schema.reference.sql).

## Local development

**Prerequisites:** Node.js 20+

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy environment file and edit values:
   ```bash
   cp .env.example .env.local
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000)

By default `VITE_USE_MOCK_DATA=true` keeps the dual-phone simulator working with no backend.

## Environment variables

See [`.env.example`](.env.example) for the full list. Client-safe keys use the `VITE_` prefix.

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_APP_URL` | For deploy | Public app URL (auth redirects, share links) |
| `VITE_APP_ENV` | No | `development` / `staging` / `production` |
| `VITE_USE_MOCK_DATA` | No | `true` = simulator (default), `false` = wire to Supabase |
| `VITE_SUPABASE_URL` | For live backend | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | For live backend | Supabase anon (publishable) key |
| `VITE_CLERK_PUBLISHABLE_KEY` | Optional | Only if you choose Clerk instead of Supabase Auth |
| `VITE_MAPBOX_TOKEN` | Optional | Real map tiles (Leaflet/OSM needs no key) |

Never commit `.env.local` or put `service_role` keys in the frontend.

## Deploy (Render example)

This repo includes a [`render.yaml`](render.yaml) Blueprint for a **static site** (no service wiring). After connecting your Git repo on Render:

1. Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_APP_URL` in the Render dashboard.
2. Set `VITE_USE_MOCK_DATA=false` when the app reads from Supabase.
3. Deploy — build runs `npm ci && npm run build`, serves `dist/`.

Equivalent free options: import the repo on Vercel or Netlify, same build command and env vars.

## Pairing demo codes (simulator)

- Alex: `LVR-9426`
- Taylor: `LVR-1378`

## License

Apache-2.0 (see file headers).
