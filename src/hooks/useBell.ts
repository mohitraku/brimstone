import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useUIStore } from "@/store/ui-store";

export function useBell(isAuthenticated: boolean) {
  const setBellTolled = useUIStore((s) => s.setBellTolled);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const subscribe = useCallback(() => {
    if (!isAuthenticated) return;

    channelRef.current = supabase
      .channel("global-events")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "global_events",
        },
        (payload) => {
          const timestamp = new Date().toISOString();
          setBellTolled(timestamp);
        }
      )
      .subscribe();
  }, [isAuthenticated, setBellTolled]);

  useEffect(() => {
    subscribe();
    return () => {
      channelRef.current?.unsubscribe();
    };
  }, [subscribe]);

  const announceCompletion = useCallback(async () => {
    if (!isAuthenticated) return;
    await supabase.from("global_events").insert({
      event_type: "completion",
    });
  }, [isAuthenticated]);

  return { announceCompletion };
}
