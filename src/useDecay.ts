// Decay processing hook — handles overnight decay, death, and rekindle.
import { useCallback } from "react";
import {
  getDatabase,
  getFlameState,
  updateFlameState,
  getActiveCommitmentsForDate,
  getTodaysCompletedIds,
  insertDecayLog,
  generateId,
} from "./db";
import {
  DECAY_PER_MISS,
  REKINDLE_INTENSITY,
  todayDateString,
  offsetDateString,
} from "./flame-math";

export function useDecay(onChange?: () => void) {
  /**
   * Process overnight decay for missed commitments.
   * Called once per calendar day — checks what was missed yesterday
   * and decays the flame accordingly. Triggers death if flame hits 0.
   */
  const processDecay = useCallback(async () => {
    const db = await getDatabase();
    const state = await getFlameState(db);
    if (!state) return;

    const today = todayDateString();
    if (state.last_decay_date === today) return; // Already processed today

    const yesterday = offsetDateString(today, -1);
    const commitments = await getActiveCommitmentsForDate(yesterday);
    const completedIds = await getTodaysCompletedIds(yesterday);
    const missedCount = commitments.filter(
      (c) => !completedIds.has(c.id),
    ).length;

    if (missedCount > 0) {
      const decayAmount = missedCount * DECAY_PER_MISS;
      const flameBefore = state.flame_intensity;
      let flameAfter = Math.max(0, flameBefore - decayAmount);

      if (flameAfter <= 0) {
        // The flame has died
        flameAfter = 0;
        await updateFlameState(
          {
            flame_intensity: 0,
            death_count: state.death_count + 1,
            streak_days: 0,
            last_decay_date: today,
          },
          db,
        );
      } else {
        await updateFlameState(
          {
            flame_intensity: flameAfter,
            last_decay_date: today,
          },
          db,
        );
      }

      await insertDecayLog(
        generateId(),
        flameBefore,
        flameAfter,
        flameBefore - flameAfter,
        flameAfter <= 0 ? "flame_extinguished" : "missed_commitment",
      );
    } else {
      // All oaths were kept — strengthen the streak
      const newStreak = state.streak_days + 1;
      await updateFlameState(
        {
          streak_days: newStreak,
          longest_streak: Math.max(state.longest_streak, newStreak),
          last_decay_date: today,
        },
        db,
      );
    }

    onChange?.();
  }, [onChange]);

  /**
   * After a death, rekindle a tiny ember for the new day.
   * Only fires once — when the flame is dead but decay has been processed
   * for today (meaning the death happened yesterday or earlier).
   */
  const rekindleIfDead = useCallback(async () => {
    const db = await getDatabase();
    const state = await getFlameState(db);
    if (!state) return;

    const today = todayDateString();
    if (
      state.flame_intensity <= 0 &&
      state.last_decay_date === today
    ) {
      await updateFlameState(
        {
          flame_intensity: REKINDLE_INTENSITY,
          streak_days: 0,
        },
        db,
      );
      onChange?.();
    }
  }, [onChange]);

  return { processDecay, rekindleIfDead };
}
