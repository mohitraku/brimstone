import * as SQLite from "expo-sqlite";
import { getDatabase } from "./database";

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

export async function getAllCommitments(): Promise<Commitment[]> {
  const db = await getDatabase();
  return db.getAllAsync<Commitment>(
    "SELECT * FROM commitments WHERE is_active = 1 ORDER BY sort_order ASC, created_at ASC"
  );
}

export async function getCommitment(id: string): Promise<Commitment | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Commitment>(
    "SELECT * FROM commitments WHERE id = ?",
    id
  );
}

export async function createCommitment(
  id: string,
  title: string,
  frequency: string,
  icon: string | null
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "INSERT INTO commitments (id, title, frequency, icon) VALUES (?, ?, ?, ?)",
    id,
    title,
    frequency,
    icon
  );
}

export async function updateCommitment(
  id: string,
  updates: Partial<Pick<Commitment, "title" | "frequency" | "icon" | "is_active" | "sort_order">>
): Promise<void> {
  const db = await getDatabase();
  const keys = Object.keys(updates);
  const sets = keys.map((k) => `${k} = ?`).join(", ");
  const values = keys.map((k) => (updates as Record<string, unknown>)[k]);
  await db.runAsync(
    `UPDATE commitments SET ${sets} WHERE id = ?`,
    ...[...values, id] as SQLite.SQLiteBindValue[]
  );
}

export async function deleteCommitment(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("UPDATE commitments SET is_active = 0 WHERE id = ?", id);
}

export async function getActiveCommitmentsForDate(
  date: string
): Promise<Commitment[]> {
  const db = await getDatabase();
  const dayOfWeek = new Date(date).getDay(); // 0=Sun, 6=Sat
  return db.getAllAsync<Commitment>(
    `SELECT * FROM commitments WHERE is_active = 1
     AND (
       frequency = 'daily'
       OR (frequency = 'weekdays' AND ? BETWEEN 1 AND 5)
       OR (frequency = 'weekly' AND ? = ?)
     )
     ORDER BY sort_order ASC`,
    dayOfWeek,
    dayOfWeek,
    0 // weekly check: simplified for MVP
  );
}
