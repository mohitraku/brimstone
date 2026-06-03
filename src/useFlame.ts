// Flame state hook — reads the flame row and recalculates live intensity.
import { useState, useCallback, useEffect } from "react";
import {
  getDatabase,
  getFlameState,
  getAllCommitments,
  getTodaysCompletions,
  type FlameRow,
} from "./db";
import { calculateFlameIntensity, todayDateString } from "./flame-math";

export interface FlameState {
  flameIntensity: number;
  streakDays: number;
  longestStreak: number;
  deathCount: number;
  lastDecayDate: string | null;
  lastCompletionDate: string | null;
}

export function useFlame() {
  const [flame, setFlame] = useState<FlameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const state = await getFlameState();
    if (!state) {
      setIsLoading(false);
      return;
    }

    const today = todayDateString();
    const completions = await getTodaysCompletions(today);
    const commitments = await getAllCommitments();

    const intensity = calculateFlameIntensity(
      completions.length,
      commitments.length,
      state.streak_days,
    );

    setFlame({
      flameIntensity: intensity,
      streakDays: state.streak_days,
      longestStreak: state.longest_streak,
      deathCount: state.death_count,
      lastDecayDate: state.last_decay_date,
      lastCompletionDate: state.last_completion_date,
    });
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { flame, isLoading, refresh };
}
