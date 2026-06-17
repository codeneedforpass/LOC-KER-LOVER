# LOC-KER-LOVER

A secure, mutual location-sharing app for couples. The UI currently runs as an **interactive simulator** with in-memory state; this repo is set up to move to a real backend without Google AI Studio.

## Recommended stack (all have free tiers)

| Layer | Recommendation | Why |
|-------|----------------|-----|
| **Frontend hosting** | [Render](https://render.com) Static Site, [Vercel](https://vercel.com), [Netlify](https://netlify.com), or [Cloudflare Pages](https://pages.cloudflare.com) | Free CDN deploy for Vite/React SPAs |
| **Database + Realtime** | [Supabase](https://supabase.com) | Postgres, live location sync via Realtime, Storage for couple photos |
| **Auth** | Supabase Auth *(default)* or [Clerk](https://clerk.com) *(optional)* | Pairing, sessions, OAuth — Supabase keeps everything in one project |
| **Maps** | [Leaflet](https://leafletjs.com) + [OpenStreetMap](https://www.openstreetmap.org) *(free, no API key)* | Real map in the dashboard simulator |
| **Push** | [OneSignal](https://onesignal.com) | SOS, geofence, and partner alerts (web push) |

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

## Supabase setup (manual)

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard) — **skip** the GitHub repository step.
2. Open **SQL Editor**, paste and run in order:
   - [`supabase/schema.reference.sql`](supabase/schema.reference.sql)
   - [`supabase/seed.demo.sql`](supabase/seed.demo.sql) *(dual-phone demo)*
   - [`supabase/clerk.schema.sql`](supabase/clerk.schema.sql) *(Clerk user linking)*
3. Copy your keys from **Project Settings → API** into `.env.local`:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_USE_MOCK_DATA=false
```

4. Enable **Realtime** on the `locations` table in **Database → Replication** if it is not already active.

## Clerk authentication

Linked Clerk application: `app_3FGuAAJPDSrZ89ctFuyPYH9SbuN`

1. Copy your **publishable key** from [Clerk Dashboard → API Keys](https://dashboard.clerk.com/last-active?path=api-keys) into `.env.local`:
   ```env
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
   ```
2. Run `supabase/clerk.schema.sql` in the SQL Editor (adds `clerk_id` to profiles).
3. Restart `npm run dev` — sign up or sign in via the header buttons.
4. On first sign-in, your Clerk account is synced to a Supabase `profiles` row automatically.

## OneSignal push notifications

1. Create a **Web** app at [onesignal.com](https://onesignal.com).
2. Set **Site URL** to your `VITE_APP_URL` (e.g. `http://localhost:3000` for dev).
3. Copy **OneSignal App ID** into `.env.local`:
   ```env
   VITE_ONESIGNAL_APP_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ```
4. Service workers live in `public/onesignal/` (already included).
5. Sign in with Clerk, then click **Enable push** in the header.
6. For partner-to-partner delivery, create a **Journey** in OneSignal triggered by user tags (`last_alert_type`, `partner_id`) or add a server route with your REST API key (never in the frontend).

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
