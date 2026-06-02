import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useUIStore } from "@/store/ui-store";

export function useBell() {
  const setBellTolled = useUIStore((s) => s.setBellTolled);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const subscribe = useCallback(() => {
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
  }, [setBellTolled]);

  useEffect(() => {
    subscribe();
    return () => {
      channelRef.current?.unsubscribe();
    };
  }, [subscribe]);

  const announceCompletion = useCallback(async () => {
    await supabase.from("global_events").insert({
      event_type: "completion",
    });
  }, []);

  return { announceCompletion };
}
