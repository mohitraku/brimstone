# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Test Commands

```bash
npm install            # Install dependencies
npx expo start         # Start dev server (scan QR with Expo Go)
npx expo start --web   # Start web version
npx expo lint          # Lint TypeScript
npx tsc --noEmit       # Type-check
```

No test suite is configured yet.

## Architecture

**Brimstone** is a life momentum builder — a mobile app where a 3D flame burns brighter when you complete commitments ("oaths") and dims when you miss them. Souls-like dark aesthetic, no hand-holding, no passwords.

### Stack
- **Mobile:** Expo SDK 52 + React Native 0.76 + TypeScript
- **3D:** Three.js via `expo-gl` — low-poly retro flame with flat shading
- **Backend:** Supabase (auth only: magic link + phone OTP), Realtime for anonymous bell events
- **Local DB:** `expo-sqlite` — primary data store (privacy-first)
- **State:** React hooks + Zustand for UI state

### Project Structure
```
app/                    # Expo Router file-based routing
  _layout.tsx           # Root: providers, auth gate
  (auth)/login.tsx      # Passwordless auth (magic link / OTP)
  (tabs)/
    index.tsx           # Flame screen — 3D bonfire + today's oaths
    commitments.tsx     # Oath list + CRUD
    record.tsx          # Streak, deaths, estus status
  modals/
    create-commitment.tsx  # New oath form
src/
  components/
    flame/FlameScene.tsx  # Three.js scene: fire, particles, retro shaders
    commitments/CommitmentCard.tsx
    estus/EstusDisplay.tsx
    ui/BellIndicator.tsx  # "A bell tolls in the distance"
  db/                     # SQLite data layer
    database.ts           # Init + migrations (flame_state, commitments, embers, decay_log)
    commitments.ts        # Commitment CRUD
    embers.ts             # Completion records
    decay.ts              # Decay audit log
  hooks/                  # Data + logic hooks
    useAuth.ts            # Supabase auth session
    useFlame.ts           # Flame state (SQLite reads + intensity calc)
    useCommitments.ts     # Oath CRUD + complete flow
    useEstus.ts           # Charge use + 24h regen check
    useDecay.ts           # Client-side daily decay processing
    useBell.ts            # Realtime subscription to global_events
  lib/supabase.ts         # Supabase client singleton
  utils/
    flame-math.ts         # Intensity calculation (0.0–1.0, no lower clamp)
    decay-math.ts         # Decay amount per missed task
  store/ui-store.ts       # Zustand: bell last tolled
supabase/
  migrations/001_global_events.sql  # Anonymous bell event table
```

### Core Mechanics
- **Flame intensity (0.0–1.0):** No lower clamp. Flame can die → death_count++, tiny flame rekindles next day
- **Completion:** Local SQLite insert → intensity recalculated → anonymous event posted to Supabase (bell)
- **Decay:** Runs client-side at midnight / app open. Each missed oath = 0.08 decay. No auto-estus.
- **Estus:** Max 2 charges. 1 regen every 24h. Manual use only (swipe on missed task).
- **Bell:** Anonymous global_events table. No user_id, no task data. Just "someone completed something."

### Data Privacy
All personal data stays in local SQLite. Only auth tokens and anonymous completion pings (no user/task data) leave the device.

### Key Configuration
- `.env` — `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` (copy from `.env.example`)
- Supabase must have Realtime enabled and the `001_global_events` migration applied
