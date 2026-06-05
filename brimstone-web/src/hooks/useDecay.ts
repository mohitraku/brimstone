// Decay hook — calls server to process overnight decay.
// Same signature as the current useDecay.ts for the RN app.
"use client";

import { useCallback } from "react";

export function useDecay(onChange?: () => void) {
  const processDecay = useCallback(async () => {
    try {
      const res = await fetch("/api/decay/process", { method: "POST" });
      if (!res.ok && res.status !== 402) {
        // 402 = subscription required (flame still viewable, mutation gated)
        console.error("Decay processing failed:", res.status);
      }
    } catch (e) {
      console.error("processDecay failed:", e);
    }
    // Always call onChange so the UI refreshes
    onChange?.();
  }, [onChange]);

  return { processDecay };
}
