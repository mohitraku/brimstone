import * as SQLite from "expo-sqlite";
import { getDatabase } from "./database";

export interface DecayLogEntry {
  id: string;
  flame_before: number;
  flame_after: number;
  decay_amount: number;
  reason: string;
  created_at: string;
}

export async function insertDecayLog(
  id: string,
  flameBefore: number,
  flameAfter: number,
  decayAmount: number,
  reason: string
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "INSERT INTO decay_log (id, flame_before, flame_after, decay_amount, reason) VALUES (?, ?, ?, ?, ?)",
    id,
    flameBefore,
    flameAfter,
    decayAmount,
    reason
  );
}

export async function getDecayLogs(limit = 30): Promise<DecayLogEntry[]> {
  const db = await getDatabase();
  return db.getAllAsync<DecayLogEntry>(
    "SELECT * FROM decay_log ORDER BY created_at DESC LIMIT ?",
    limit
  );
}
