// Commitment hook — CRUD and completion tracking for oaths.
import { useState, useCallback, useEffect } from "react";
import {
  getAllCommitments,
  createCommitment,
  deleteCommitment,
  getTodaysCompletedIds,
  getDatabase,
  getFlameState,
  updateFlameState,
  insertEmber,
  generateId,
  type Commitment,
} from "./db";
import {
  completionIntensityGain,
  calculateFlameIntensity,
  todayDateString,
} from "./flame-math";

export function useCommitments(onChange?: () => void) {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [all, today, ids] = await Promise.all([
      getAllCommitments(),
      todayDateString(),
      getTodaysCompletedIds(todayDateString()),
    ]);
    setCommitments(all);
    setCompletedIds(ids);
    setIsLoading(false);
    // Re-fetch completedIds with the actual today string
    const freshIds = await getTodaysCompletedIds(todayDateString());
    setCompletedIds(freshIds);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(
    async (title: string, frequency: string, icon: string | null) => {
      await createCommitment(generateId(), title, frequency, icon);
      await refresh();
      onChange?.();
    },
    [refresh, onChange],
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteCommitment(id);
      await refresh();
      onChange?.();
    },
    [refresh, onChange],
  );

  /**
   * Complete an oath. Inserts an ember, recalculates flame intensity,
   * and persists everything. Returns the new intensity.
   */
  const complete = useCallback(
    async (commitmentId: string): Promise<number> => {
      const db = await getDatabase();
      const state = await getFlameState(db);
      if (!state) return 0;

      const today = todayDateString();
      const all = await getAllCommitments();
      const gain = completionIntensityGain(all.length);

      await insertEmber(generateId(), commitmentId, gain, today);

      const newCompletedCount = completedIds.size + 1;
      const intensity = calculateFlameIntensity(
        newCompletedCount,
        all.length,
        state.streak_days,
      );

      await updateFlameState(
        {
          flame_intensity: intensity,
          last_completion_date: new Date().toISOString(),
        },
        db,
      );

      await refresh();
      onChange?.();
      return intensity;
    },
    [completedIds, refresh, onChange],
  );

  return {
    commitments,
    completedIds,
    isLoading,
    refresh,
    add,
    remove,
    complete,
  };
}
