// Unified SQLite data layer — schema, CRUD, embers, decay log.
import * as SQLite from "expo-sqlite";

// ── Types ────────────────────────────────────────────────────────
export interface FlameState {
  flame_intensity: number;
  streak_days: number;
  longest_streak: number;
  death_count: number;
  last_decay_date: string | null;
  last_completion_date: string | null;
}

export interface Commitment {
  id: string;
  title: string;
  frequency: string; // "daily" | "weekdays" | "weekly"
  icon: string | null;
  is_deleted: number; // 0 = active, 1 = deleted
  created_at: string;
}

export interface Ember {
  id: string;
  commitment_id: string;
  gain: number;
  completed_date: string;
}

export interface DecayLogEntry {
  id: string;
  decay_date: string;
  amount: number;
  reason: string;
}

// ── Helpers ──────────────────────────────────────────────────────
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync("brimstone.db");
  await runMigrations(_db);
  return _db;
}

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS flame_state (
      id INTEGER PRIMARY KEY DEFAULT 1,
      flame_intensity REAL NOT NULL DEFAULT 0.5,
      streak_days INTEGER NOT NULL DEFAULT 0,
      longest_streak INTEGER NOT NULL DEFAULT 0,
      death_count INTEGER NOT NULL DEFAULT 0,
      last_decay_date TEXT,
      last_completion_date TEXT
    );

    CREATE TABLE IF NOT EXISTS commitments (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      frequency TEXT NOT NULL DEFAULT 'daily',
      icon TEXT,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS embers (
      id TEXT PRIMARY KEY,
      commitment_id TEXT NOT NULL,
      gain REAL NOT NULL DEFAULT 0,
      completed_date TEXT NOT NULL,
      FOREIGN KEY (commitment_id) REFERENCES commitments(id)
    );

    CREATE TABLE IF NOT EXISTS decay_log (
      id TEXT PRIMARY KEY,
      decay_date TEXT NOT NULL,
      amount REAL NOT NULL,
      reason TEXT NOT NULL
    );
  `);

  // Seed flame state if empty
  const existing = await db.getFirstAsync("SELECT id FROM flame_state WHERE id = 1");
  if (!existing) {
    await db.runAsync(
      "INSERT INTO flame_state (id) VALUES (1)",
    );
  }
}

// ── Flame State ──────────────────────────────────────────────────
export async function getFlameState(
  db?: SQLite.SQLiteDatabase,
): Promise<FlameState | null> {
  const d = db ?? (await getDatabase());
  return d.getFirstAsync<FlameState>("SELECT * FROM flame_state WHERE id = 1");
}

export async function updateFlameState(
  patch: Partial<FlameState>,
  db?: SQLite.SQLiteDatabase,
): Promise<void> {
  const d = db ?? (await getDatabase());
  const keys = Object.keys(patch);
  if (keys.length === 0) return;
  const sets = keys.map((k) => `${k} = ?`).join(", ");
  const vals: unknown[] = keys.map((k) => (patch as Record<string, unknown>)[k]);
  await d.runAsync(
    `UPDATE flame_state SET ${sets} WHERE id = 1`,
    vals as SQLite.SQLiteBindValue[],
  );
}

// ── Commitments ──────────────────────────────────────────────────
export async function getAllCommitments(): Promise<Commitment[]> {
  const db = await getDatabase();
  return db.getAllAsync<Commitment>(
    "SELECT * FROM commitments WHERE is_deleted = 0 ORDER BY created_at ASC",
  );
}

export async function createCommitment(
  id: string,
  title: string,
  frequency: string,
  icon: string | null,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "INSERT INTO commitments (id, title, frequency, icon) VALUES (?, ?, ?, ?)",
    id,
    title,
    frequency,
    icon,
  );
}

export async function deleteCommitment(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE commitments SET is_deleted = 1 WHERE id = ?",
    id,
  );
}

export async function getActiveCommitmentsForDate(
  dateStr: string,
): Promise<Commitment[]> {
  const db = await getDatabase();
  const dayOfWeek = new Date(dateStr + "T00:00:00").getDay(); // 0=Sun

  const all = await db.getAllAsync<Commitment>(
    "SELECT * FROM commitments WHERE is_deleted = 0",
  );

  return all.filter((c) => {
    if (c.frequency === "daily") return true;
    if (c.frequency === "weekdays") return dayOfWeek >= 1 && dayOfWeek <= 5;
    if (c.frequency === "weekly") return dayOfWeek === 0; // Sunday
    return true;
  });
}

// ── Embers ───────────────────────────────────────────────────────
export async function insertEmber(
  id: string,
  commitmentId: string,
  gain: number,
  completedDate: string,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "INSERT INTO embers (id, commitment_id, gain, completed_date) VALUES (?, ?, ?, ?)",
    id,
    commitmentId,
    gain,
    completedDate,
  );
}

export async function getTodaysCompletedIds(
  today: string,
): Promise<Set<string>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ commitment_id: string }>(
    "SELECT commitment_id FROM embers WHERE completed_date = ?",
    today,
  );
  return new Set(rows.map((r) => r.commitment_id));
}

// ── Decay ────────────────────────────────────────────────────────
export async function insertDecayLog(
  id: string,
  decayDate: string,
  amount: number,
  reason: string,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "INSERT INTO decay_log (id, decay_date, amount, reason) VALUES (?, ?, ?, ?)",
    id,
    decayDate,
    amount,
    reason,
  );
}
