import * as SQLite from "expo-sqlite";
import { getDatabase } from "./database";

export interface Ember {
  id: string;
  commitment_id: string;
  intensity_gain: number;
  completed_at: string;
  streak_date: string;
}

export async function insertEmber(
  id: string,
  commitmentId: string,
  intensityGain: number,
  streakDate: string
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "INSERT INTO embers (id, commitment_id, intensity_gain, completed_at, streak_date) VALUES (?, ?, ?, datetime('now'), ?)",
    id,
    commitmentId,
    intensityGain,
    streakDate
  );
}

export async function getTodaysCompletions(
  todayDate: string
): Promise<Ember[]> {
  const db = await getDatabase();
  return db.getAllAsync<Ember>(
    "SELECT * FROM embers WHERE streak_date = ? ORDER BY completed_at DESC",
    todayDate
  );
}

export async function getTodaysCompletedIds(
  todayDate: string
): Promise<Set<string>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ commitment_id: string }>(
    "SELECT commitment_id FROM embers WHERE streak_date = ?",
    todayDate
  );
  return new Set(rows.map((r) => r.commitment_id));
}

export async function getEmbersForDateRange(
  startDate: string,
  endDate: string
): Promise<Ember[]> {
  const db = await getDatabase();
  return db.getAllAsync<Ember>(
    "SELECT * FROM embers WHERE streak_date BETWEEN ? AND ? ORDER BY completed_at DESC",
    startDate,
    endDate
  );
}

export async function getDailyEmberCounts(
  daysBack: number
): Promise<Array<{ streak_date: string; count: number; total_gain: number }>> {
  const db = await getDatabase();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);
  return db.getAllAsync<{
    streak_date: string;
    count: number;
    total_gain: number;
  }>(
    "SELECT streak_date, COUNT(*) as count, SUM(intensity_gain) as total_gain FROM embers WHERE streak_date >= ? GROUP BY streak_date ORDER BY streak_date DESC",
    startDate.toISOString().split("T")[0]
  );
}

export async function getEmberCount(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM embers"
  );
  return row?.count ?? 0;
}
