import { useState, useEffect, useCallback } from "react";
import { getDatabase, getFlameState, updateFlameState } from "@/db/database";
import { getTodaysCompletions } from "@/db/embers";
import { calculateFlameIntensity } from "@/utils/flame-math";
import { todayDateString } from "@/utils/decay-math";
import { getAllCommitments } from "@/db/commitments";

export interface FlameState {
  flameIntensity: number;
  streakDays: number;
  longestStreak: number;
  deathCount: number;
  currentEstus: number;
  maxEstus: number;
  lastEstusRegen: string;
  lastDecayDate: string | null;
  lastCompletionDate: string | null;
}

export function useFlame() {
  const [flame, setFlame] = useState<FlameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const db = await getDatabase();
    const state = await getFlameState(db);
    if (!state) return;

    const today = todayDateString();
    const todaysCompletions = await getTodaysCompletions(today);
    const commitments = await getAllCommitments();

    const intensity = calculateFlameIntensity(
      todaysCompletions.length,
      commitments.length,
      state.streak_days,
      state.current_estus,
      state.max_estus
    );

    setFlame({
      flameIntensity: intensity,
      streakDays: state.streak_days,
      longestStreak: state.longest_streak,
      deathCount: state.death_count,
      currentEstus: state.current_estus,
      maxEstus: state.max_estus,
      lastEstusRegen: state.last_estus_regen,
      lastDecayDate: state.last_decay_date,
      lastCompletionDate: state.last_completion_date,
    });
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateIntensity = useCallback(async (newIntensity: number) => {
    const db = await getDatabase();
    await updateFlameState(db, { flame_intensity: newIntensity });
    await refresh();
  }, [refresh]);

  const incrementDeath = useCallback(async () => {
    const db = await getDatabase();
    const state = await getFlameState(db);
    if (!state) return;
    await updateFlameState(db, {
      death_count: state.death_count + 1,
      streak_days: 0,
      flame_intensity: 0,
    });
    await refresh();
  }, [refresh]);

  const rekindleFlame = useCallback(async () => {
    const db = await getDatabase();
    await updateFlameState(db, {
      flame_intensity: 0.06,
      streak_days: 0,
    });
    await refresh();
  }, [refresh]);

  return {
    flame,
    isLoading,
    refresh,
    updateIntensity,
    incrementDeath,
    rekindleFlame,
  };
}
