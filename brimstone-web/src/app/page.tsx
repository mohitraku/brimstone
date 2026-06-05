"use client";

import { useState, useEffect, useCallback } from "react";
import { useFlame } from "@/hooks/useFlame";
import { useDecay } from "@/hooks/useDecay";
import { useCommitments } from "@/hooks/useCommitments";
import { useAuth } from "@/hooks/useAuth";
import { AuthGate } from "@/components/AuthGate";
import { Hearth } from "@/components/Hearth";
import { Forge } from "@/components/Forge";
import { colors, fontSize } from "@/lib/theme";

type ViewName = "hearth" | "forge";

export default function Home() {
  const { user, isLoading: authLoading } = useAuth();
  const { flame, isLoading: flameLoading, refresh } = useFlame();
  const { processDecay } = useDecay(refresh);
  const { commitments, completedIds, add, remove, complete } =
    useCommitments(refresh);

  const [view, setView] = useState<ViewName>("hearth");
  const [decayRan, setDecayRan] = useState(false);

  // Process overnight decay once on mount (after auth)
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function init() {
      try {
        await processDecay();
      } catch (e) {
        console.error("Decay init failed:", e);
      }
      if (!cancelled) setDecayRan(true);
    }
    init();
    return () => { cancelled = true; };
  }, [user, processDecay]);

  const handleComplete = useCallback(
    (id: string): Promise<number> => complete(id),
    [complete],
  );

  // Auth loading
  if (authLoading) {
    return (
      <div style={styles.root}>
        <p style={styles.loadingText}>the ember stirs…</p>
      </div>
    );
  }

  // Not authenticated — show gate
  if (!user) {
    return (
      <div style={styles.root}>
        <AuthGate />
      </div>
    );
  }

  // App loading — flame data still fetching or decay not yet processed
  if (flameLoading || !flame || !decayRan) {
    return (
      <div style={styles.root}>
        <p style={styles.loadingText}>the ember stirs…</p>
      </div>
    );
  }

  return (
    <div style={styles.root}>
      {view === "hearth" ? (
        <Hearth
          flame={flame}
          commitments={commitments}
          completedIds={completedIds}
          onComplete={handleComplete}
          onForge={() => setView("forge")}
        />
      ) : (
        <Forge
          commitments={commitments}
          onAdd={add}
          onRemove={remove}
          onBack={() => setView("hearth")}
        />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100dvh",
    width: "100%",
  },
  loadingText: {
    color: colors.textFaint,
    fontSize: fontSize.sm,
    fontFamily: "serif",
    fontStyle: "italic",
    opacity: 0.5,
    marginTop: 40,
  },
};
