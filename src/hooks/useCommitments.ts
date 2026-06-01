import { useState, useEffect, useCallback } from "react";
import {
  getAllCommitments,
  createCommitment,
  deleteCommitment,
  type Commitment,
} from "@/db/commitments";
import { getTodaysCompletedIds, insertEmber } from "@/db/embers";
import { getDatabase, getFlameState, updateFlameState } from "@/db/database";
import { calculateFlameIntensity, completionIntensityGain } from "@/utils/flame-math";
import { todayDateString } from "@/utils/decay-math";
import { v4 as uuid } from "uuid";

export function useCommitments(refreshFlame: () => Promise<void>) {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const all = await getAllCommitments();
    setCommitments(all);
    const today = todayDateString();
    const ids = await getTodaysCompletedIds(today);
    setCompletedIds(ids);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addCommitment = useCallback(
    async (title: string, frequency: string, icon: string | null) => {
      await createCommitment(uuid(), title, frequency, icon);
      await refresh();
    },
    [refresh]
  );

  const removeCommitment = useCallback(
    async (id: string) => {
      await deleteCommitment(id);
      await refresh();
    },
    [refresh]
  );

  const completeCommitment = useCallback(
    async (commitmentId: string) => {
      const db = await getDatabase();
      const state = await getFlameState(db);
      if (!state) return;

      const today = todayDateString();
      const all = await getAllCommitments();
      const gain = completionIntensityGain(all.length);

      // Insert ember record
      await insertEmber(uuid(), commitmentId, gain, today);

      // Update flame state
      const newCompleted = completedIds.size + 1;
      const intensity = calculateFlameIntensity(
        newCompleted,
        all.length,
        state.streak_days,
        state.current_estus,
        state.max_estus
      );

      await updateFlameState(db, {
        flame_intensity: intensity,
        last_completion_date: new Date().toISOString(),
      });

      await refresh();
      await refreshFlame();
      return { intensity, gain };
    },
    [completedIds, refresh, refreshFlame]
  );

  return {
    commitments,
    completedIds,
    isLoading,
    refresh,
    addCommitment,
    removeCommitment,
    completeCommitment,
  };
}
