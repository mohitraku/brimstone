# Brimstone

A life momentum builder wrapped in Souls-like aesthetics. Tend a flame that burns brighter when you honor your commitments. It dims when you falter. It dies when you abandon it.

No tutorials. No passwords. No social features. Just you and the flame — and a distant bell when others fight.

## How it works

- **Swear oaths** — daily or weekly commitments you intend to keep
- **Complete them** — each completion feeds the flame, making it burn brighter
- **Miss them** — the flame decays. Let it reach zero and the flame dies, recorded in your death count
- **Estus charges** — you have 2. Spend one to forgive a missed oath. They regenerate slowly (24 hours each). Use them wisely.
- **A distant bell** — when another Brimstone user completes an oath, you hear a bell toll. "Others fight." Nothing else is shared — no names, no tasks, no data.
- **The flame rekindles at dawn** — if it dies, a tiny ember returns the next day. You rise again.

## Tech

- **Mobile:** Expo SDK 52, React Native 0.76, TypeScript
- **3D:** Three.js via expo-gl — low-poly retro flame with flat shading
- **Auth:** Supabase — magic link (email) and phone OTP (no passwords)
- **Data:** SQLite on-device (privacy-first; nothing leaves your phone except anonymous completion pings)
- **Realtime:** Supabase Realtime for the bell system

## Getting started

```bash
git clone https://github.com/mohitraku/brimstone.git
cd brimstone
cp .env.example .env
# Edit .env with your Supabase project URL and anon key
npm install
npx expo start
```

Scan the QR code with [Expo Go](https://expo.dev/go) on your phone.

### Supabase setup

Run the migration in `supabase/migrations/001_global_events.sql` against your Supabase project. Enable Realtime on the `global_events` table. Enable email (magic link) and phone auth providers in the Supabase dashboard.

## Project structure

```
app/          Expo Router screens (auth, tabs: Flame/Oaths/Record, modals)
src/
  components/ UI components (flame scene, oath cards, estus display, bell)
  db/         SQLite data layer (flame state, commitments, embers, decay log)
  hooks/      Data + logic hooks (auth, flame, commitments, estus, decay, bell)
  lib/        Supabase client
  utils/      Flame intensity math, decay math, formatting
  store/      Zustand UI state
supabase/     Backend migrations and config
```
