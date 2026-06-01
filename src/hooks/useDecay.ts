import { useCallback } from "react";
import { getDatabase, getFlameState, updateFlameState } from "@/db/database";
import { getAllCommitments } from "@/db/commitments";
import { getTodaysCompletedIds } from "@/db/embers";
import { insertDecayLog } from "@/db/decay";
import { todayDateString } from "@/utils/decay-math";
import { v4 as uuid } from "uuid";

/**
 * Processes daily decay for missed commitments.
 * Runs client-side at midnight or on app open.
 * Does NOT auto-use estus — user must manually forgive.
 */
export function useDecay(refreshFlame: () => Promise<void>) {
  const processDecay = useCallback(async () => {
    const db = await getDatabase();
    const state = await getFlameState(db);
    if (!state) return;

    const today = todayDateString();

    // Already processed today
    if (state.last_decay_date === today) return;

    // Get yesterday's date for decay check
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // Find active commitments
    const commitments = await getAllCommitments();

    // Find which were completed yesterday
    const completedIds = await getTodaysCompletedIds(yesterdayStr);
    const missedCount = commitments.filter(
      (c) => !completedIds.has(c.id)
    ).length;

    let flameIntensity = state.flame_intensity;
    let deathTriggered = false;

    if (missedCount > 0) {
      const decayAmount = missedCount * 0.08;
      const flameBefore = flameIntensity;
      flameIntensity = Math.max(0, flameIntensity - decayAmount);

      if (flameIntensity <= 0) {
        deathTriggered = true;
        flameIntensity = 0;
        await updateFlameState(db, {
          death_count: state.death_count + 1,
          streak_days: 0,
          flame_intensity: 0,
          last_decay_date: today,
        });
      } else {
        await updateFlameState(db, {
          flame_intensity: flameIntensity,
          last_decay_date: today,
        });
      }

      await insertDecayLog(
        uuid(),
        flameBefore,
        flameIntensity,
        flameBefore - flameIntensity,
        deathTriggered ? "flame_extinguished" : "missed_commitment"
      );
    } else {
      // All commitments completed: bump streak
      await updateFlameState(db, {
        streak_days: state.streak_days + 1,
        longest_streak: Math.max(state.longest_streak, state.streak_days + 1),
        last_decay_date: today,
      });
    }

    await refreshFlame();
    return { deathTriggered, flameIntensity };
  }, [refreshFlame]);

  return { processDecay };
}
