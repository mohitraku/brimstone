// Unified SQLite data layer — all schema, queries, and CRUD in one file.
import * as SQLite from "expo-sqlite";

// ── Types ───────────────────────────────────────────────────────────────────

export interface FlameRow {
  flame_intensity: number;
  streak_days: number;
  longest_streak: number;
  death_count: number;
  last_completion_date: string | null;
  last_decay_date: string | null;
}

export interface Commitment {
  id: string;
  title: string;
  description: string | null;
  frequency: "daily" | "weekdays" | "weekly";
  is_active: number;
  sort_order: number;
  icon: string | null;
  created_at: string;
}

export interface Ember {
  id: string;
  commitment_id: string;
  intensity_gain: number;
  completed_at: string;
  streak_date: string;
}

export interface DecayLogEntry {
  id: string;
  flame_before: number;
  flame_after: number;
  decay_amount: number;
  reason: string;
  created_at: string;
}

// ── ID generation (no uuid dependency) ──────────────────────────────────────

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// ── Database singleton ──────────────────────────────────────────────────────

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync("brimstone.db");
  await runMigrations(db);
  return db;
}

async function runMigrations(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS flame_state (
      id                  INTEGER PRIMARY KEY DEFAULT 1,
      flame_intensity     REAL NOT NULL DEFAULT 0.06,
      streak_days         INTEGER NOT NULL DEFAULT 0,
      longest_streak      INTEGER NOT NULL DEFAULT 0,
      death_count         INTEGER NOT NULL DEFAULT 0,
      last_completion_date TEXT,
      last_decay_date     TEXT,
      created_at          TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS commitments (
      id           TEXT PRIMARY KEY,
      title        TEXT NOT NULL,
      description  TEXT,
      frequency    TEXT NOT NULL DEFAULT 'daily',
      is_active    INTEGER NOT NULL DEFAULT 1,
      sort_order   INTEGER NOT NULL DEFAULT 0,
      icon         TEXT,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS embers (
      id              TEXT PRIMARY KEY,
      commitment_id   TEXT NOT NULL REFERENCES commitments(id),
      intensity_gain  REAL NOT NULL,
      completed_at    TEXT NOT NULL,
      streak_date     TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS decay_log (
      id           TEXT PRIMARY KEY,
      flame_before REAL NOT NULL,
      flame_after  REAL NOT NULL,
      decay_amount REAL NOT NULL,
      reason       TEXT NOT NULL,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Seed the single flame state row if it doesn't exist
  const row = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM flame_state"
  );
  if (row?.count === 0) {
    await database.runAsync("INSERT INTO flame_state (id) VALUES (1)");
  }
}

// ── Flame state ─────────────────────────────────────────────────────────────

export async function getFlameState(
  database?: SQLite.SQLiteDatabase,
): Promise<FlameRow | null> {
  const d = database ?? (await getDatabase());
  return d.getFirstAsync<FlameRow>(
    "SELECT flame_intensity, streak_days, longest_streak, death_count, last_completion_date, last_decay_date FROM flame_state WHERE id = 1",
  );
}

export async function updateFlameState(
  updates: Partial<FlameRow & { updated_at: string }>,
  database?: SQLite.SQLiteDatabase,
): Promise<void> {
  const d = database ?? (await getDatabase());
  const keys = Object.keys(updates);
  if (keys.length === 0) return;
  const sets = keys.map((k) => `${k} = ?`).join(", ");
  const values = keys.map((k) => (updates as Record<string, unknown>)[k]);
  await d.runAsync(
    `UPDATE flame_state SET ${sets}, updated_at = datetime('now') WHERE id = 1`,
    values as SQLite.SQLiteBindValue[],
  );
}

// ── Commitments CRUD ────────────────────────────────────────────────────────

export async function getAllCommitments(): Promise<Commitment[]> {
  const d = await getDatabase();
  return d.getAllAsync<Commitment>(
    "SELECT * FROM commitments WHERE is_active = 1 ORDER BY sort_order ASC, created_at ASC",
  );
}

export async function createCommitment(
  id: string,
  title: string,
  frequency: string,
  icon: string | null,
): Promise<void> {
  const d = await getDatabase();
  await d.runAsync(
    "INSERT INTO commitments (id, title, frequency, icon) VALUES (?, ?, ?, ?)",
    id,
    title,
    frequency,
    icon,
  );
}

export async function deleteCommitment(id: string): Promise<void> {
  const d = await getDatabase();
  await d.runAsync(
    "UPDATE commitments SET is_active = 0 WHERE id = ?",
    id,
  );
}

/** Get commitments that were active on a given date (by frequency filter). */
export async function getActiveCommitmentsForDate(
  dateStr: string,
): Promise<Commitment[]> {
  const d = await getDatabase();
  const dayOfWeek = new Date(dateStr + "T00:00:00").getDay(); // 0=Sun

  return d.getAllAsync<Commitment>(
    `SELECT * FROM commitments
     WHERE is_active = 1
       AND (
         frequency = 'daily'
         OR (frequency = 'weekdays' AND ? BETWEEN 1 AND 5)
         OR frequency = 'weekly'
       )
     ORDER BY sort_order ASC`,
    dayOfWeek,
  );
}

// ── Embers (completions) ────────────────────────────────────────────────────

export async function insertEmber(
  id: string,
  commitmentId: string,
  intensityGain: number,
  streakDate: string,
): Promise<void> {
  const d = await getDatabase();
  await d.runAsync(
    "INSERT INTO embers (id, commitment_id, intensity_gain, completed_at, streak_date) VALUES (?, ?, ?, datetime('now'), ?)",
    id,
    commitmentId,
    intensityGain,
    streakDate,
  );
}

export async function getTodaysCompletions(
  todayDate: string,
): Promise<Ember[]> {
  const d = await getDatabase();
  return d.getAllAsync<Ember>(
    "SELECT * FROM embers WHERE streak_date = ? ORDER BY completed_at DESC",
    todayDate,
  );
}

export async function getTodaysCompletedIds(
  todayDate: string,
): Promise<Set<string>> {
  const d = await getDatabase();
  const rows = await d.getAllAsync<{ commitment_id: string }>(
    "SELECT commitment_id FROM embers WHERE streak_date = ?",
    todayDate,
  );
  return new Set(rows.map((r) => r.commitment_id));
}

// ── Decay log ───────────────────────────────────────────────────────────────

export async function insertDecayLog(
  id: string,
  flameBefore: number,
  flameAfter: number,
  decayAmount: number,
  reason: string,
): Promise<void> {
  const d = await getDatabase();
  await d.runAsync(
    "INSERT INTO decay_log (id, flame_before, flame_after, decay_amount, reason) VALUES (?, ?, ?, ?, ?)",
    id,
    flameBefore,
    flameAfter,
    decayAmount,
    reason,
  );
}
