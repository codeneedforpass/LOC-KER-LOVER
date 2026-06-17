# Loc-Ker Lover

A secure, mutual location-sharing app for couples. Real users sign in with Clerk, pair via codes, and share live GPS through Supabase.

## Stack

| Layer | Service |
|-------|---------|
| App | Vite + React + Capacitor (Android APK) |
| Auth | Clerk |
| Backend | Supabase (Postgres + Realtime) |
| Push | OneSignal |

## Setup (required)

### 1. Supabase SQL (run in order)

1. [`supabase/schema.reference.sql`](supabase/schema.reference.sql)
2. [`supabase/clerk.schema.sql`](supabase/clerk.schema.sql)
3. [`supabase/production.clerk-rls.sql`](supabase/production.clerk-rls.sql)

### 2. Clerk + Supabase

1. [Clerk Dashboard](https://dashboard.clerk.com) → **Configure → Supabase** → enable integration.
2. Add domains: `https://localhost` (Android APK) and your Render URL.
3. Set `VITE_CLERK_PUBLISHABLE_KEY` in `.env.local`.

### 3. Environment

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_ONESIGNAL_APP_ID=your-app-id
```

## How users pair

1. Both partners create accounts (Clerk sign up).
2. Each gets a pairing code (e.g. `LVR-4821`) in the app.
3. One partner enters the other's code on the Pair screen.
4. Enable location sharing — GPS syncs via Supabase Realtime.

## Local dev

```bash
npm install
cp .env.example .env.local   # edit keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll see sign-in, then a single full-screen phone UI (not the old dual-phone prototype).

## Android APK

```powershell
powershell -ExecutionPolicy Bypass -File scripts/android-apk.ps1
```

Output: `Loc-Ker-Lover-debug.apk`

## Deploy (Render)

Set all `VITE_*` keys in the Render dashboard and redeploy. See [`render.yaml`](render.yaml).

## License

Apache-2.0
