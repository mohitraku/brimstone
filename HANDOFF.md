# Brimstone — Windows Handoff

## Current State (2026-06-02)

**SDK:** Expo SDK 54, React Native 0.81.5, React 19.1.0
**Auth:** Removed — app opens directly to flame (no login)
**Bell system:** Supabase Realtime with anon RLS (needs policy update in dashboard)
**Dev client:** `expo-dev-client` installed, `eas.json` configured, not yet built

All user data is local SQLite. No sign-in. The app should open straight to the flame.

## Quick Start

```powershell
cd D:\GitHub\brimstone
npm install --legacy-peer-deps
npx expo start --dev-client
```

Before `--dev-client` works, you need to build the dev client APK (see below).

## First Thing: EAS Login + Dev Build

```powershell
# 1. Log into EAS (this is what failed in WSL2)
npx eas-cli login

# 2. Build the dev client APK (~10 min on EAS servers)
npx eas-cli build --profile development --platform android

# 3. Download the APK from the link EAS gives you, install on phone

# 4. Start the dev server
npx expo start --dev-client

# 5. Connect phone — scan QR or enter LAN URL from Metro output
```

## Second Thing: Supabase RLS Policy

Run this in Supabase dashboard → SQL Editor:

```sql
DROP POLICY IF EXISTS "anon_events_insert" ON public.global_events;
DROP POLICY IF EXISTS "anon_events_select" ON public.global_events;
CREATE POLICY "anon_events_insert" ON public.global_events FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_events_select" ON public.global_events FOR SELECT USING (true);
```

Without this, the bell system (anonymous completion pings) won't work.

## Architecture

```
app/_layout.tsx           # Root — providers, always renders tabs (no auth gate)
app/(tabs)/_layout.tsx    # Tab navigator (Flame, Oaths, Record)
app/(tabs)/index.tsx      # Flame screen — 3D GL scene + today's oaths
app/(tabs)/commitments.tsx # Oath list + CRUD
app/(tabs)/record.tsx      # Stats: streak, deaths
app/modals/create-commitment.tsx  # New oath form

src/hooks/useFlame.ts       # Flame state (SQLite)
src/hooks/useCommitments.ts # Oath CRUD
src/hooks/useEstus.ts       # Estus charges
src/hooks/useDecay.ts       # Daily decay processing
src/hooks/useBell.ts        # Supabase Realtime bell subscription
src/lib/supabase.ts         # Supabase client (anon key, no auth config)
src/db/                     # SQLite data layer
src/components/flame/       # Three.js flame scene
src/components/ui/          # Shared UI components
supabase/migrations/        # Backend SQL
```

## Key Changes (last 4 commits)

1. `37112ed` — Removed Supabase auth entirely. No login, no OTP, no magic links. App opens directly.
2. `5b43b0c` — Fixed 3 runtime errors: crypto polyfill, Three.js canvas shim, safe area tab bar.
3. `dd0246c` — Installed `expo-dev-client` for dev builds (not yet built).

## Things That Went Away

- `app/(auth)/` — login screen and auth layout group (deleted)
- `app/auth/` — old callback route (deleted)
- `src/hooks/useAuth.ts` — entire auth hook (deleted)
- `expo-auth-session` — removed from deps
- `expo-crypto` — removed from deps

## Environment

Copy `.env.example` to `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=https://wunhgenttvvhcfzzkkti.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_I46scDTKqZK0CJuQu4-lFg_CjQGUTE1
```

## Known Issues on Windows

- `npm install` will need `--legacy-peer-deps` due to peer dependency mismatches from the SDK 54 upgrade
- Dev build APK must be installed once before `--dev-client` works
- If Metro shows "CI mode", check that `CI` env var is not set
