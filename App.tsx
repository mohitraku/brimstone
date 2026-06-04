// Brimstone — life momentum builder. Single entry, no router, no bloat.
import { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFlame } from "./src/useFlame";
import { useDecay } from "./src/useDecay";
import { useCommitments } from "./src/useCommitments";
import { Hearth } from "./src/Hearth";
import { Forge } from "./src/Forge";
import { colors } from "./src/theme";

type ViewName = "hearth" | "forge";

export default function App() {
  const [view, setView] = useState<ViewName>("hearth");
  const { flame, isLoading, refresh } = useFlame();
  const { processDecay, rekindleIfDead } = useDecay(refresh);
  const { commitments, completedIds, add, remove, complete } =
    useCommitments(refresh);

  const [decayRan, setDecayRan] = useState(false);

  // Process overnight decay once on mount
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        await processDecay();
        await rekindleIfDead();
      } catch (e) {
        console.error("Decay init failed:", e);
      }
      if (!cancelled) setDecayRan(true);
    }
    init();
    return () => { cancelled = true; };
  }, [processDecay, rekindleIfDead]);

  const handleComplete = useCallback(
    (id: string): Promise<number> => complete(id),
    [complete],
  );

  // Loading guard — the ember stirs
  if (isLoading || !flame || !decayRan) {
    return (
      <View style={styles.root}>
        <StatusBar style="light" backgroundColor={colors.bg} />
        <Text style={styles.loadingText}>the ember stirs…</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <StatusBar style="light" backgroundColor={colors.bg} />
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
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: colors.textFaint,
    fontSize: 13,
    fontFamily: "serif",
    fontStyle: "italic",
    opacity: 0.5,
    marginTop: 40,
  },
});
