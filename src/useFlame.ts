// Flame state hook — reads DB, recalculates intensity from today's data.
import { useState, useCallback, useEffect } from "react";
import {
  getFlameState,
  updateFlameState,
  getTodaysCompletedIds,
  getAllCommitments,
  type FlameState,
} from "./db";
import {
  calculateFlameIntensity,
  todayDateString,
} from "./flame-math";

export interface FlameUIState {
  flameIntensity: number;
  streakDays: number;
  longestStreak: number;
  deathCount: number;
  lastDecayDate: string | null;
}

export function useFlame() {
  const [flame, setFlame] = useState<FlameUIState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const state = await getFlameState();
    if (!state) {
      setIsLoading(false);
      return;
    }

    const today = todayDateString();
    const [completedIds, all] = await Promise.all([
      getTodaysCompletedIds(today),
      getAllCommitments(),
    ]);

    const intensity = calculateFlameIntensity(
      completedIds.size,
      all.length,
      state.streak_days,
    );

    // Persist recalculated intensity if it changed
    if (Math.abs(intensity - state.flame_intensity) > 0.001) {
      await updateFlameState({ flame_intensity: intensity });
    }

    setFlame({
      flameIntensity: intensity,
      streakDays: state.streak_days,
      longestStreak: state.longest_streak,
      deathCount: state.death_count,
      lastDecayDate: state.last_decay_date,
    });
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { flame, isLoading, refresh };
}
