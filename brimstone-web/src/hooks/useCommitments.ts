// Commitment hook — oath CRUD via API routes.
// Same signature as the current useCommitments.ts for the RN app.
"use client";

import { useState, useCallback, useEffect } from "react";
import type { Commitment } from "@/types/database";

export function useCommitments(onChange?: () => void) {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/commitments");
      if (!res.ok) throw new Error(`Commitments fetch failed: ${res.status}`);
      const data = await res.json();
      setCommitments(data.commitments ?? []);
      setCompletedIds(new Set(data.completedIds ?? []));
    } catch (e) {
      console.error("useCommitments.refresh failed:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const add = useCallback(
    async (
      title: string,
      frequency: string,
      recurrence_days: number[] | null,
      recurrence_dates: number[] | null,
    ) => {
      await fetch("/api/commitments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, frequency, recurrence_days, recurrence_dates }),
      });
      await refresh();
      onChange?.();
    },
    [refresh, onChange],
  );

  const remove = useCallback(
    async (id: string) => {
      await fetch(`/api/commitments/${id}`, { method: "DELETE" });
      await refresh();
      onChange?.();
    },
    [refresh, onChange],
  );

  const complete = useCallback(
    async (commitmentId: string): Promise<number> => {
      // Optimistic update
      setCompletedIds((prev) => new Set([...prev, commitmentId]));

      try {
        const res = await fetch(`/api/commitments/${commitmentId}/complete`, {
          method: "POST",
        });
        if (!res.ok) {
          // Revert optimistic update
          setCompletedIds((prev) => {
            const next = new Set(prev);
            next.delete(commitmentId);
            return next;
          });
          throw new Error(`Complete failed: ${res.status}`);
        }
        const data = await res.json();
        await refresh();
        onChange?.();
        return data.flameIntensity ?? 0;
      } catch (e) {
        console.error("complete failed:", e);
        return 0;
      }
    },
    [refresh, onChange],
  );

  const uncomplete = useCallback(
    async (commitmentId: string): Promise<number> => {
      // Optimistic update — remove from completedIds
      setCompletedIds((prev) => {
        const next = new Set(prev);
        next.delete(commitmentId);
        return next;
      });

      try {
        const res = await fetch(`/api/commitments/${commitmentId}/complete`, {
          method: "DELETE",
        });
        if (!res.ok) {
          // Revert
          setCompletedIds((prev) => new Set([...prev, commitmentId]));
          throw new Error(`Uncomplete failed: ${res.status}`);
        }
        const data = await res.json();
        await refresh();
        onChange?.();
        return data.flameIntensity ?? 0;
      } catch (e) {
        console.error("uncomplete failed:", e);
        return 0;
      }
    },
    [refresh, onChange],
  );

  return { commitments, completedIds, isLoading, refresh, add, remove, complete, uncomplete };
}
