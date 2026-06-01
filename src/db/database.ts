import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync("brimstone.db");
  await runMigrations(db);
  return db;
}

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS flame_state (
      id                  INTEGER PRIMARY KEY DEFAULT 1,
      flame_intensity     REAL NOT NULL DEFAULT 0.06,
      streak_days         INTEGER NOT NULL DEFAULT 0,
      longest_streak      INTEGER NOT NULL DEFAULT 0,
      death_count         INTEGER NOT NULL DEFAULT 0,
      last_completion_date TEXT,
      last_decay_date     TEXT,
      current_estus       INTEGER NOT NULL DEFAULT 2,
      max_estus           INTEGER NOT NULL DEFAULT 2,
      last_estus_regen    TEXT NOT NULL DEFAULT (datetime('now')),
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

  // Ensure the single flame_state row exists
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM flame_state"
  );
  if (row?.count === 0) {
    await db.runAsync(
      "INSERT INTO flame_state (id) VALUES (1)"
    );
  }
}

export function getFlameState(db: SQLite.SQLiteDatabase) {
  return db.getFirstAsync<{
    flame_intensity: number;
    streak_days: number;
    longest_streak: number;
    death_count: number;
    last_completion_date: string | null;
    last_decay_date: string | null;
    current_estus: number;
    max_estus: number;
    last_estus_regen: string;
  }>("SELECT * FROM flame_state WHERE id = 1");
}

export function updateFlameState(
  db: SQLite.SQLiteDatabase,
  updates: Record<string, unknown>
) {
  const keys = Object.keys(updates);
  const sets = keys.map((k) => `${k} = ?`).join(", ");
  const values = keys.map((k) => updates[k]);
  return db.runAsync(
    `UPDATE flame_state SET ${sets}, updated_at = datetime('now') WHERE id = 1`,
    values as SQLite.SQLiteBindValue[]
  );
}
