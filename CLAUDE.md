# Brimstone — Life Momentum Builder

## Identity

Brimstone is a mobile app where a **flame burns brighter when you complete commitments ("oaths") and dims when you miss them**. You wake up, swear oaths, and keep them. The flame answers.

**Business model:** One-time purchase ($5–10). No subscriptions, no accounts, no server costs. Zero-backend architecture. The app works forever offline. This is not a SaaS — it's a tool you own.

## Philosophy: "Fumble in the Dark"

Like Dark Souls, the app **does not explain itself**. No tutorials. No onboarding. No tooltips. No "tap here to begin." The user is dropped into a dark space with a flame and must discover mechanics through experimentation:

- **Minimal text.** Labels are sparse, cryptic, or absent. Prefer icons and visual feedback.
- **No instructions.** The create form doesn't say "What do you swear to do?" — it's just an underscore cursor in the dark.
- **Discovery through interaction.** Tapping things reveals what they do. Long-press reveals hidden actions.
- **Consequence without warning.** If you miss an oath, the flame decays. You're not told — you see it the next day.
- **Death is part of it.** The flame can die. A death counter appears. The user figures out why.
- **No confirmation toasts.** Completing an oath flicks the card crossed-out and the flame responds. No "Completed!" banner.
- **Stats appear only when they change.** Streak numbers and death scars fade in, then fade out. They're not permanent dashboard elements.

## Visual Direction: PS1-Era Retro (Low-Poly / Flat-Shaded)

The flame takes inspiration from **FlyKnight** and **Kingsfield** — old-school retro 3D reinterpreted in 2D:

- **Flat colors** — no gradients, no smooth blends, no modern "#FF6600" brights
- **Angular geometry** — the 2D flame is built from layered diamond shapes (rotated 45° squares), not smooth curves
- **Limited palette** — warm embers, deep oranges, charcoal blacks. No neon, no teal, no bloom
- **Chunky particles** — small squares rising upward, not smooth glowing orbs
- **Visible edges** — rock base uses hard-edged rectangles with visible borders
- **Serif font everywhere** — gothic, old, weighty feel

## Project Snapshot

| Attribute | Value |
|---|---|
| Framework | Expo SDK 54 (managed workflow) |
| React | 19.1.0 |
| React Native | 0.81.5 |
| TypeScript | 5.9 (strict mode) |
| Runtime deps | **6** (expo, expo-sqlite, expo-status-bar, react, react-native, react-native-safe-area-context) |
| Dev deps | 2 (@types/react, typescript) |
| Source files | **10** (11 including App.tsx) |
| Database | Local SQLite (expo-sqlite ~16.0.0) |
| Entry point | `App.tsx` at repo root (no expo-router) |
| Routing | `useState<"hearth" \| "forge">` toggle — 2 views total |
| State mgmt | React useState/useCallback/useEffect — no libraries |
| Animations | React Native `Animated` API — no Reanimated, no gesture-handler |
| Testing | Expo Go QR scan — instant, no build step |

## File Map

```
brimstone/
├── App.tsx                    # Root entry — view toggle, decay init, loading guard
├── app.json                   # Expo config (no plugins, dark splash, portrait)
├── package.json               # 6 runtime deps, "main": "expo/AppEntry"
├── tsconfig.json              # Expo base + strict, @/* → ./src/*
├── .gitignore
│
└── src/
    ├── theme.ts               # Design tokens: colors, spacing, fontSize, radii
    ├── flame-math.ts          # Game math: intensity formula, decay, level names, dates
    ├── db.ts                  # Unified SQLite layer: schema, CRUD, embers, decay log
    ├── useFlame.ts            # Flame state hook — reads DB, recalculates intensity
    ├── useDecay.ts            # Decay processing hook — overnight decay, death, rekindle
    ├── useCommitments.ts      # Oath CRUD hook — add, remove, complete, refresh
    ├── FlameScene.tsx          # 2D animated flame — diamond layers, wisps, particles
    ├── Hearth.tsx             # Main screen — flame + oath list + overlay + forge button
    ├── Forge.tsx              # Oath creation/management — form, sigil grid, bound list
    └── CommitmentCard.tsx     # Single oath card — sigil, title, frequency, completion
```

## Architecture Deep Dive

### No Router

There is **no expo-router, no React Navigation, no tab bar, no stack navigator**. The app has exactly two views: `"hearth"` (main) and `"forge"` (create/manage oaths). View switching is a single `useState<"hearth" | "forge">("hearth")` in `App.tsx`. The Hearth and Forge components are **pure presentational** — they receive all data and callbacks as props.

Why: routers add weight, concepts, and complexity. Two views don't need a navigation library.

### State Lifted to Root

All state lives in `App.tsx` via three custom hooks:

```
App
├── useFlame()        → { flame, isLoading, refresh }
├── useDecay(refresh) → { processDecay, rekindleIfDead }
└── useCommitments(refresh) → { commitments, completedIds, add, remove, complete }
```

**`refresh` is the data-flow spine.** Both `useDecay` and `useCommitments` receive `useFlame`'s `refresh` callback as their `onChange` parameter. When decay processes or an oath is completed, they call `onChange?.()` which triggers `useFlame.refresh()`, recalculating the flame intensity from fresh DB state.

Hearth and Forge are **pure presentational components** — they take props, render UI, call callbacks. They don't own state, don't call DB, don't know about hooks.

### No State Management Library

Only React's built-in `useState`, `useCallback`, `useEffect`, and `useRef`. No Zustand, no Redux, no Context providers. The component tree is flat enough that prop drilling is fine — it's at most 2 levels deep (App → Hearth/Forge → CommitmentCard).

## Database (src/db.ts)

### Singleton Pattern with Race-Condition Guard

```typescript
let _db: SQLite.SQLiteDatabase | null = null;
let _dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  if (!_dbPromise) {
    _dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync("brimstone.db");
      await runMigrations(db);
      _db = db;
      return db;
    })();
  }
  return _dbPromise;
}
```

The promise-based lock prevents multiple concurrent `openDatabaseAsync` calls during parallel startup (useFlame, useCommitments, and useDecay all fire DB ops on mount). Before this fix, concurrent calls could race `_db` assignment, causing silent failures and a perpetual blank loading screen.

### Schema — 4 Tables

**`flame_state`** — Single row (id=1), seeded on first migration:
| Column | Type | Default | Purpose |
|---|---|---|---|
| id | INTEGER PK | 1 | Singleton guard |
| flame_intensity | REAL | 0.5 | 0.0–1.0, drives visual flame |
| streak_days | INTEGER | 0 | Consecutive days with ≥1 completion |
| longest_streak | INTEGER | 0 | All-time best streak |
| death_count | INTEGER | 0 | Times flame extinguished |
| last_decay_date | TEXT | null | YYYY-MM-DD of last decay processing |
| last_completion_date | TEXT | null | ISO timestamp of last completion |

**`commitments`** — Oaths the user has bound:
| Column | Type | Purpose |
|---|---|---|
| id | TEXT PK | Generated via `generateId()` |
| title | TEXT | The oath text |
| frequency | TEXT | `"daily"`, `"weekdays"`, or `"weekly"` |
| icon | TEXT (nullable) | Emoji sigil |
| is_deleted | INTEGER | 0=active, 1=soft-deleted |
| created_at | TEXT | SQLite datetime default |

Deletes are **soft** (`is_deleted = 1`) — never hard-delete rows. Queries filter `WHERE is_deleted = 0`.

**`embers`** — Completion records (one per oath per day):
| Column | Type | Purpose |
|---|---|---|
| id | TEXT PK | Generated |
| commitment_id | TEXT FK | References commitments(id) |
| gain | REAL | Intensity gain from this completion |
| completed_date | TEXT | YYYY-MM-DD of completion |

**`decay_log`** — Audit trail of flame decay events:
| Column | Type | Purpose |
|---|---|---|
| id | TEXT PK | Generated |
| decay_date | TEXT | YYYY-MM-DD |
| amount | REAL | How much intensity was lost |
| reason | TEXT | Human-readable (e.g., "2 oaths unkept") |

### ID Generation

Inline `generateId()` — no uuid package:
```typescript
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
```

### updateFlameState Pattern

Dynamic `SET` builder — accepts a `Partial<FlameState>` patch and builds the SQL dynamically:
```typescript
const keys = Object.keys(patch);
const sets = keys.map((k) => `${k} = ?`).join(", ");
const vals: unknown[] = keys.map((k) => (patch as Record<string, unknown>)[k]);
await d.runAsync(`UPDATE flame_state SET ${sets} WHERE id = 1`, vals as SQLite.SQLiteBindValue[]);
```
The cast to `SQLite.SQLiteBindValue[]` is required to satisfy expo-sqlite's strict TypeScript types for `runAsync`.

### Frequency Filtering

`getActiveCommitmentsForDate(dateStr)` filters commitments by day-of-week:
- `"daily"` → always active
- `"weekdays"` → Mon–Fri (dayOfWeek 1–5)
- `"weekly"` → Sunday only (dayOfWeek 0)

Filtering happens in JS after fetching all active commitments — not in SQL. This is fine for the expected data volume (<50 oaths).

### Important: Optional `db` Parameter

Several functions accept an optional `db` parameter (`getFlameState(db?)`, `updateFlameState(patch, db?)`). This enables **transactional consistency** — callers can open the DB once and pass it through multiple operations. If omitted, each function opens its own connection (which resolves to the same singleton).

## Game Math (src/flame-math.ts)

### Flame Intensity Formula

```
intensity = clamp(0.2 + completionRatio × 0.6 + streakBonus, 0, 1)

where:
  completionRatio = completedToday / totalActive (0 if totalActive=0)
  streakBonus     = log₂(streakDays + 1) × 0.06 (0 if streak=0)
```

- **Zero oaths bound:** Returns 0.5 (neutral flame — no obligations, no judgment)
- **Completion weight:** 60% of the score
- **Streak bonus:** 20% max (logarithmic — diminishing returns)
- **Baseline:** 20% (the 0.2 constant — flame doesn't die instantly)

### Decay

- **DECAY_PER_MISS:** 0.08 per missed oath per day
- **Death:** When intensity would go ≤0, it's clamped to 0, `death_count` increments, `streak_days` resets to 0
- **Rekindle:** If flame is dead AND decay has already been processed today, the next app open sets intensity to `REKINDLE_INTENSITY` (0.06)

### Intensity Gain Per Completion

```typescript
export function completionIntensityGain(totalActive: number): number {
  if (totalActive <= 0) return 0;
  return 0.6 / totalActive;
}
```
Each completion contributes `0.6 / totalActive` to intensity. With 3 oaths, each is worth 0.2. With 1 oath, it's worth 0.6.

### Flame Level Tiers (7 levels)

| Range | Name |
|---|---|
| ≤0 | Extinguished |
| <0.2 | Fading Ember |
| <0.4 | Sputtering Wick |
| <0.6 | Steady Flame |
| <0.8 | Roaring Pyre |
| <0.95 | Blazing Inferno |
| ≥0.95 | Searing Inferno |

### Flame Color

```typescript
export function flameColor(intensity: number): string {
  if (intensity <= 0) return "#3a3430"; // cold ash
  const r = Math.round(180 + intensity * 75);  // 180→255
  const g = Math.round(60 + intensity * 140);   // 60→200
  const b = Math.round(10 + intensity * 30);    // 10→40
  return `rgb(${r},${g},${b})`;
}
```
Shifts from dim red toward bright gold as intensity rises. Used for the overlay text color in Hearth.

### Date Helpers

- `todayDateString()` → `"2026-06-04"` (YYYY-MM-DD in local time)
- `pad(n)` — internal, not exported
- `offsetDateString(dateStr, days)` — defined **locally in useDecay.ts**, NOT in flame-math. Moves a date forward/back by N days.

## Hook-by-Hook Behavior

### useFlame() → { flame, isLoading, refresh }

1. On mount, `useEffect` calls `refresh()`
2. `refresh()`:
   - Gets `FlameState` from DB
   - Fetches today's `completedIds` and all `commitments` in parallel
   - Calculates `intensity = calculateFlameIntensity(completedIds.size, all.length, state.streak_days)`
   - Persists if `abs(new - old) > 0.001`
   - Maps to `FlameUIState` (camelCase — different from DB `FlameState` which uses snake_case)
   - Sets `isLoading = false` in `finally` block (always resolves)
3. Returns `{ flame: FlameUIState | null, isLoading: boolean, refresh: () => Promise<void> }`

**Type mapping:** DB `FlameState` uses snake_case (`flame_intensity`), but `FlameUIState` uses camelCase (`flameIntensity`). This is intentional — the DB layer speaks SQL, the UI layer speaks JS.

### useDecay(onChange?) → { processDecay, rekindleIfDead }

1. `processDecay()`:
   - Gets singleton DB + flame state
   - If `last_decay_date` is null (first ever run): sets it to yesterday, calls `onChange?.()`, returns
   - If `last_decay_date === today`: already processed, returns early
   - Iterates from `last_decay_date+1` to `yesterday`, checking each day:
     - Gets active commitments for that date (filtered by day-of-week)
     - Gets completed IDs for that date
     - Applies `DECAY_PER_MISS × missed_count` decay
     - Logs each decay event
   - If `totalDecay > 0`: updates flame state, handles death (intensity≤0 → deathCount++, streak=0)
   - Calls `onChange?.()` at the end (which is `useFlame.refresh`, recalculating intensity)
2. `rekindleIfDead()`:
   - If `flame_intensity ≤ 0` AND `last_decay_date === today`: sets intensity to 0.06
   - This means: the flame was dead, decay already processed today, it's a new app open — rekindle

**Important:** `onChange?.()` is called WITHOUT `await` in both `processDecay` and `rekindleIfDead`. This fires `useFlame.refresh()` as a background task — the decay functions return immediately, not waiting for the UI to refresh.

### useCommitments(onChange?) → { commitments, completedIds, isLoading, refresh, add, remove, complete }

1. On mount, fetches commitments + today's completions
2. `add(title, frequency, icon)`:
   - Calls `createCommitment(generateId(), ...)` 
   - `await refresh()` (re-fetch commitments state)
   - Calls `onChange?.()` (triggers `useFlame.refresh` for flame recalculation)
3. `remove(id)`:
   - Calls `deleteCommitment(id)` (soft-delete)
   - `await refresh()`
   - Calls `onChange?.()`
4. `complete(commitmentId)` → `Promise<number>`:
   - Opens DB, gets flame state
   - Calculates `gain = completionIntensityGain(all.length)`
   - Inserts an ember record
   - Recalculates intensity: `calculateFlameIntensity(completedIds.size + 1, all.length, state.streak_days)`
   - Updates flame state with new intensity + `last_completion_date`
   - `await refresh()` (re-fetch to get updated completedIds)
   - Calls `onChange?.()`
   - Returns the new intensity (used by Hearth for the `onComplete` type signature)

**Critical detail:** `complete()` uses `completedIds.size + 1` (closure value + 1) NOT a fresh DB query. The `completedIds` dependency in the useCallback array means this callback is recreated whenever completions change, so the closure value is always correct.

## Component Tree & Props

### App (root)
```
Props: (none — owns all state)
State:
  view: "hearth" | "forge"
  decayRan: boolean

Renders:
  Loading: "the ember stirs…" (if isLoading || !flame || !decayRan)
  Hearth (view === "hearth")
  Forge (view === "forge")
```

### Hearth
```
Props:
  flame: FlameUIState        // from useFlame
  commitments: Commitment[]  // from useCommitments
  completedIds: Set<string>  // from useCommitments
  onComplete: (id) => Promise<number>  // wrapped complete()
  onForge: () => void        // setView("forge")

Layout:
  ├── Flame container (flex:1, minHeight: "45%")
  │   ├── FlameScene (intensity={flame.flameIntensity})
  │   └── Animated overlay (fades: 1 → [2.5s delay] → 0.12)
  │       ├── Level name (uppercase serif, color from flameColor())
  │       ├── Death block (if dead): "Deaths borne: N" + "The ember stirs at dawn."
  │       ├── Streak text (if streak>0): "N dawn(s) kindled"
  │       └── Scar text (if deathCount>0): "borne N death(s)"
  └── Oaths section (flex:1, minHeight: "35%", borderTop)
      ├── ScrollView
      │   ├── Empty state: "⬥" + "the hearth is cold" (if no oaths)
      │   └── CommitmentCard[] (one per oath)
      └── Forge button: centered "+" circle, positioned absolute at bottom
```

**Overlay animation:** The flame level name flashes fully visible for 2.8s on mount, then fades to 0.12 opacity. It's always present — just nearly invisible. This means the level name is always readable if you look closely, but it doesn't dominate the screen.

### Forge
```
Props:
  commitments: Commitment[]
  onAdd: (title, frequency, icon) => Promise<void>
  onRemove: (id) => Promise<void>
  onBack: () => void

Layout:
  ├── Drag handle (thin pill shape, decorative)
  ├── ScrollView
  │   ├── Section mark: "swear an oath"
  │   ├── TextInput (placeholder: "_", autoFocus, serif, dark)
  │   ├── 3 frequency chips: "each dawn" / "each labor" / "each seventh"
  │   ├── 12-sigil emoji grid (fire, sword, flex, book, runner, lotus, target, bulb, star, shield, candle, moon)
  │   ├── "Swear" button (primary, disabled when empty)
  │   ├── "turn back" ghost button
  │   ├── Divider + "oaths bound" section
  │   ├── Oath rows (sigil + title + frequency, long-press to forsake)
  │   └── "hold to forsake" hint in faint italic
  └── KeyboardAvoidingView wrapper (padding on iOS, height on Android)
```

**Forsake UX:** Long-press an oath in the "oaths bound" list → Alert dialog: `forsake "title"?` with "no" (cancel) and "yes" (destructive, calls `onRemove`). No undo. No confirmation beyond the Alert.

### CommitmentCard
```
Props:
  title: string
  icon: string | null
  frequency: string
  isCompleted: boolean
  onComplete: () => void

Layout:
  ├── Sigil (left): emoji or "⬥" fallback
  ├── Body (center):
  │   ├── Title (serif, line-through + faded when completed)
  │   └── Frequency mark (faint, below title)
  └── Check circle (right):
      ├── Empty circle (border only) when not completed
      └── Filled circle + "✓" when completed
```

Disabled when completed (`disabled={isCompleted}`). Opacity drops to 0.4 when done.

### FlameScene
```
Props:
  intensity: number  // 0.0–1.0

Structure:
  ├── Particles (14-pool, absolute positioned, rising squares)
  ├── Flame grouping (centered)
  │   ├── Wisps (3 rectangular bars, rotating at different speeds)
  │   ├── Outer flame (90×90 diamond, deep orange)
  │   ├── Mid flame (60×60 diamond, rich orange)
  │   ├── Inner flame (36×36 diamond, warm amber)
  │   └── Core (18×18 diamond, bright gold)
  ├── Rock base (5 static angular rectangles)
  └── Ember dot (only visible when dead, pulsing)
```

**Animation system:**
- `pulse` — Slow rhythmic breathing (0→1 in 900ms, 1→0 in 800ms, looped). Drives flame scale.
- `flicker` — Rapid chaotic sequence (6 segments, 60–180ms each, looped). Drives inner flame jitter.
- `wispSpin` — 3200ms rotation loop (0→360°). Drives wisp1 and wisp3.
- `wispSpin2` — 2800ms reverse rotation (360°→0). Drives wisp2. Uses `useNativeDriver: false` because it rotates a float.
- **Particles** — Pool of 14 pre-created particles. `requestAnimationFrame` loop tracks emission interval: `0.3 - intensity × 0.2` seconds (0.3s at low intensity, 0.1s at high). Each particle rises with slight random horizontal drift, fades in then out, duration 900–2100ms. When pool is exhausted, oldest particle gets recycled.

**Dead flame (intensity ≤ 0):**
- All 4 flame diamonds visible but scaled to 0.3, colored `FLAME_DEAD` (#1a1410)
- Core opacity: 0.04, outer opacity: 0.25
- No wisps (not rendered — `if (!isDead)` guard)
- No particles (emission loop returns early when intensity ≤ 0)
- Ember dot appears: 12px circle, `#5a2010`, pulsing via flicker (opacity 0.3–0.7)
- The flame still has a faint presence — it's not completely gone

**`intensityRef` pattern:** The `intensity` prop is mirrored into `intensityRef.current` because the `requestAnimationFrame` callback captures the initial value in its closure. Without the ref, the particle emission would always use the intensity value from the first render.

**`useWindowDimensions`:** The container height is `Math.max(winH * 0.4, 260)` — minimum 260px or 40% of screen height. This ensures the flame is always large enough regardless of device.

## Design Tokens (src/theme.ts)

### Colors — Dark, Warm, Sparse
```
bg:         "#0a0a0a"   — near-black void (background)
surface:    "#111111"   — slightly lifted surfaces (cards, inputs)
border:     "#1a1a1a"   — subtle dividers
ember:      "#4a1008"   — deepest flame red
deepOrange: "#8b3a0f"   — outer flame
orange:     "#b8550f"   — mid flame
gold:       "#c47a1a"   — accent, check marks
pale:       "#d4a44a"   — warm highlight
text:       "#b8a89a"   — primary text (warm grey, never pure white)
textFaint:  "#5c544c"   — secondary/muted text
textMuted:  "#3a3430"   — near-invisible text
accent:     "#9e6a20"   — primary action color (amber/bronze)
accentFaint:"#5c3d12"   — active chip/sigil background
danger:     "#6b2020"   — death text, destructive actions
success:    "#3a4a2a"   — subtle green (unused currently)
```

**No neon. No pure white.** The brightest text color is `#b8a89a` — a warm, muted grey with amber undertones. This is intentional: bright white text on a dark background feels modern/sterile. Warm grey feels ancient, like candlelight on parchment.

### Typography
- **Font:** System serif (`fontFamily: "serif"`) everywhere — gothic, old-world feel
- **Sizes:** xs=11, sm=13, md=15, lg=18, xl=22, xxl=28
- **Uppercase** for level names, section marks, and action buttons with letter spacing
- **Italic** for hints, empty states, loading text

## App Startup Sequence

1. `App` component mounts
2. `useFlame()` → `useEffect` fires `refresh()`:
   - Opens DB (or waits for existing promise)
   - Reads flame_state, today's completions, all commitments
   - Calculates fresh intensity, persists if changed
   - Sets `flame` state, sets `isLoading = false`
3. `useCommitments(refresh)` → `useEffect` fires its own `refresh()`:
   - Fetches commitments and today's completed IDs
   - Sets `commitments` and `completedIds` state
4. App's `useEffect` fires `init()`:
   - `await processDecay()` — processes missed days since last decay
   - `await rekindleIfDead()` — rekindles if dead and decay already run today
   - `setDecayRan(true)` (in finally/try-catch)
5. All three guards satisfied: `isLoading=false`, `flame` populated, `decayRan=true`
6. Hearth renders with flame and oath list

**Why three independent startup paths?** `useFlame` and `useCommitments` both need to load on mount regardless of whether decay runs. Decay is a one-time processing step. They're intentionally not serialized — the DB singleton ensures safe concurrent access.

**If ANY startup operation fails:** The try/catch blocks in `useFlame.refresh()`, `useCommitments.refresh()`, and App's `init()` ensure the loading guards always resolve. Errors are logged via `console.error` but don't block the UI. The user sees the app with whatever state was successfully loaded.

## package.json — Critical Details

### `"main": "expo/AppEntry"`
This tells Expo to look for `App.tsx` at the project root instead of using expo-router. **Without this line, Expo will not find the entry point.** This is the key configuration that enables the no-router architecture. The alternative would be an `app/` directory with expo-router file conventions — this single field bypasses all of that.

### Scripts
- `start` → `expo start` (Expo Go dev server — instant QR scan)
- `android` / `ios` → `expo run:android` / `expo run:ios` (native builds — not needed for normal dev)

### No Plugins
`app.json` has `"plugins": []` — empty array. No expo-router, no expo-secure-store, no expo-notifications. Zero native plugin configuration.

## How to Run

```powershell
# Node.js must be on PATH (install from https://nodejs.org)
npx expo start
```

Scan the QR code with **Expo Go** on your phone. That's it. No build step. No `--dev-client` flag. The 2D animated flame uses only React Native's built-in `Animated` API — no native modules.

## What NOT to Add

These were intentionally removed or avoided. Do not re-add them without strong justification:

- **No navigation libraries** (react-navigation, expo-router, react-native-screens) — useState view toggle is the architecture
- **No gesture handler** — basic TouchableOpacity covers every interaction
- **No Reanimated** — Animated API works for the flame
- **No state management libraries** — useState/useCallback/useEffect is enough for this tree depth
- **No uuid** — inline `generateId()` is 1 line
- **No native modules** (expo-gl, three, expo-camera, etc.) — instant Expo Go testing is more valuable
- **No backend/Supabase** — local SQLite is the entire data layer
- **No estus/secondary currency** — the flame answers to oaths alone
- **No onboarding/tutorials** — "fumble in the dark" philosophy
- **No toast notifications** — visual feedback through the flame, not toasts
- **No gradient libraries** (expo-linear-gradient) — flat colors are the aesthetic

## Known Gotchas & Past Fixes

### expo-sqlite TypeScript casting
`runAsync(sql, params)` requires `SQLite.SQLiteBindValue[]` for the params array. When building params dynamically (as in `updateFlameState`), use `vals as SQLite.SQLiteBindValue[]`. A plain `unknown[]` will not type-check.

### Reanimated vs Animated
The project uses React Native's built-in `Animated` API, not `react-native-reanimated`. Transforms use string interpolation (`"0deg"`, `"45deg"`) and `Animated.multiply()`. Do not import from `react-native-reanimated` — it's not installed.

### useCallback dependencies
Several callbacks depend on `completedIds` (a `Set<string>`). Since `Set` is referentially different every time `setCompletedIds` is called, these callbacks are recreated on every completion. This is intentional and correct — the `complete` function needs the latest `completedIds.size` in its closure.

### Date strings
All dates are `"YYYY-MM-DD"` strings in local time. Never use ISO strings or UTC for date comparison. The `todayDateString()` function uses `new Date()` local methods, not UTC.

### offsetDateString location
`offsetDateString` is **not in flame-math.ts** — it's a local function in `useDecay.ts`. If you need date offsetting elsewhere, copy the pattern (don't add a dependency, don't add a date library).

### Wisp rotation: useNativeDriver
Two of the three animation loops use `useNativeDriver: true`, but `wispSpin2` uses `useNativeDriver: false` because it rotates a float value (not a transform string). This is intentional — `useNativeDriver` doesn't support non-transform animated values.

### Package lock CRLF warnings
On Windows, git warns about LF→CRLF conversion for `package.json` and `package-lock.json`. This is cosmetic and harmless. Do not add a `.gitattributes` file to silence it — the warnings serve as a reminder that line endings are being normalized.

### app.json icon path
The `"icon": "./assets/icon.png"` path references a file that doesn't exist. This is fine for dev — Expo falls back to a default icon. Add the actual icon asset before publishing.

## Commit Style

Commits are in present tense, lowercase. Examples from the log:
- `Remove android/ directory — no more native build cruft`
- `Fix blank screen — add DB race-condition guard + try/catch on startup paths`
- `npm install — remove 18 unused native-module packages`

Each commit is one logical change. No multi-concern commits.
