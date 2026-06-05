// Flame state hook — fetches flame data from API.
// Same signature as the current useFlame.ts for the RN app.
"use client";

import { useState, useCallback, useEffect } from "react";
import type { FlameUIState } from "@/types/database";

const CACHE_KEY = "brimstone_flame_cache";

export function useFlame() {
  const [flame, setFlame] = useState<FlameUIState | null>(() => {
    // Hydrate from localStorage for instant paint
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try { return JSON.parse(cached); } catch {}
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/flame");
      if (!res.ok) throw new Error(`Flame fetch failed: ${res.status}`);
      const data: FlameUIState = await res.json();
      setFlame(data);
      // Cache for offline
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch {}
    } catch (e) {
      console.error("useFlame.refresh failed:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  return { flame, isLoading, refresh };
}
