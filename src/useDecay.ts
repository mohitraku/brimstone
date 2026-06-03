// Decay hook — overnight decay processing, death trigger, rekindle.
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
} from "./flame-math";

/** Return YYYY-MM-DD offset by N days (negative = past). */
function offsetDateString(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function useDecay(onChange?: () => void) {
  /**
   * Process decay for missed commitments since last decay date.
   * Called on app mount. Handles death (intensity hits 0).
   */
  const processDecay = useCallback(async () => {
    const db = await getDatabase();
    const state = await getFlameState(db);
    if (!state) return;

    const today = todayDateString();
    const lastDate = state.last_decay_date;

    // If never decayed, set last_decay_date to yesterday (so today's tasks don't decay)
    if (!lastDate) {
      const yesterday = offsetDateString(today, -1);
      await updateFlameState({ last_decay_date: yesterday }, db);
      onChange?.();
      return;
    }

    // Already processed today
    if (lastDate === today) return;

    // Process each missed day from last_date+1 to yesterday
    let current = offsetDateString(lastDate, 1);
    let totalDecay = 0;

    while (current < today) {
      const active = await getActiveCommitmentsForDate(current);
      const completed = await getTodaysCompletedIds(current);

      const missed = active.filter((c) => !completed.has(c.id));
      const decay = missed.length * DECAY_PER_MISS;

      if (decay > 0) {
        totalDecay += decay;
        await insertDecayLog(
          generateId(),
          current,
          decay,
          `${missed.length} oath${missed.length !== 1 ? "s" : ""} unkept`,
        );
      }

      current = offsetDateString(current, 1);
    }

    if (totalDecay > 0 || lastDate !== today) {
      let newIntensity = state.flame_intensity - totalDecay;
      let deathCount = state.death_count;
      let streakDays = state.streak_days;

      if (newIntensity <= 0) {
        newIntensity = 0;
        deathCount += 1;
        streakDays = 0;
        await insertDecayLog(
          generateId(),
          today,
          state.flame_intensity,
          "flame extinguished",
        );
      }

      await updateFlameState(
        {
          flame_intensity: Math.max(0, newIntensity),
          last_decay_date: today,
          death_count: deathCount,
          streak_days: streakDays,
          longest_streak: Math.max(
            state.longest_streak,
            state.streak_days,
          ),
        },
        db,
      );
    }

    onChange?.();
  }, [onChange]);

  /**
   * Rekindle: if flame is dead and decay already processed today,
   * bring it back to minimal intensity at next app open.
   */
  const rekindleIfDead = useCallback(async () => {
    const state = await getFlameState();
    if (!state) return;

    const today = todayDateString();

    // Dead + decay processed today = time to rekindle
    if (state.flame_intensity <= 0 && state.last_decay_date === today) {
      await updateFlameState({
        flame_intensity: REKINDLE_INTENSITY,
      });
      onChange?.();
    }
  }, [onChange]);

  return { processDecay, rekindleIfDead };
}
