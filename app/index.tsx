// The Hearth — main screen. Flame, today's oaths, cryptic stats.
// No tab bar. No headers. No hand-holding.
import { useCallback, useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlameScene } from "../src/components/FlameScene";
import { CommitmentCard } from "../src/components/CommitmentCard";
import { useFlame } from "../src/useFlame";
import { useCommitments } from "../src/useCommitments";
import { colors, spacing, fontSize } from "../src/theme";
import { flameLevelName, flameColor, todayDateString } from "../src/flame-math";

export default function Index() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { flame, isLoading, refresh } = useFlame();
  const { commitments, completedIds, complete } = useCommitments(refresh);

  // Fading overlay for flame stats
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isLoading && flame) {
      // Flash the flame name on load, then fade
      Animated.sequence([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(overlayOpacity, {
          toValue: 0.15,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isLoading, flame?.deathCount, overlayOpacity]);

  const handleComplete = useCallback(
    async (id: string) => {
      await complete(id);
    },
    [complete],
  );

  if (isLoading || !flame) {
    return <View style={styles.container} />;
  }

  const isDead = flame.flameIntensity <= 0;
  const levelName = flameLevelName(flame.flameIntensity);
  const fColor = flameColor(flame.flameIntensity);

  // Today's applicable commitments (all active shown — simplicity)
  const todaysOaths = commitments;

  return (
    <View style={styles.container}>
      {/* ── Flame ────────────────────────────────────────────── */}
      <View style={styles.flameContainer}>
        <FlameScene intensity={flame.flameIntensity} />

        {/* Cryptic overlay — fades in/out */}
        <Animated.View
          style={[styles.overlay, { opacity: overlayOpacity }]}
          pointerEvents="none"
        >
          <Text style={[styles.levelName, { color: fColor }]}>
            {levelName}
          </Text>

          {isDead ? (
            <View style={styles.deathNotice}>
              <Text style={styles.deathText}>
                Deaths borne: {flame.deathCount}
              </Text>
              <Text style={styles.deathHint}>The ember stirs at dawn.</Text>
            </View>
          ) : (
            <>
              {flame.streakDays > 0 && (
                <Text style={styles.streakText}>
                  {flame.streakDays}{" "}
                  {flame.streakDays === 1 ? "dawn" : "dawns"} kindled
                </Text>
              )}
              {flame.deathCount > 0 && (
                <Text style={styles.scarText}>
                  borne {flame.deathCount} death
                  {flame.deathCount !== 1 ? "s" : ""}
                </Text>
              )}
            </>
          )}
        </Animated.View>
      </View>

      {/* ── Oaths ────────────────────────────────────────────── */}
      <View style={[styles.oathsSection, { paddingBottom: insets.bottom + 60 }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.oathsList}
        >
          {todaysOaths.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>⬥</Text>
              <Text style={styles.emptyText}>the hearth is cold</Text>
            </View>
          ) : (
            todaysOaths.map((c) => (
              <CommitmentCard
                key={c.id}
                title={c.title}
                icon={c.icon}
                frequency={c.frequency}
                isCompleted={completedIds.has(c.id)}
                onComplete={() => handleComplete(c.id)}
              />
            ))
          )}
        </ScrollView>

        {/* Subtle forge button — not a FAB, just a tappable glyph */}
        <TouchableOpacity
          style={[styles.forgeButton, { bottom: insets.bottom + 16 }]}
          onPress={() => router.push("/create-commitment")}
          activeOpacity={0.6}
        >
          <Text style={styles.forgeGlyph}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flameContainer: {
    flex: 1,
    minHeight: "45%",
  },
  overlay: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  levelName: {
    fontSize: fontSize.xl,
    fontFamily: "serif",
    textTransform: "uppercase",
    letterSpacing: 3,
    textShadowColor: "#000",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  deathNotice: {
    alignItems: "center",
    marginTop: spacing.sm,
  },
  deathText: {
    color: colors.danger,
    fontSize: fontSize.md,
    fontFamily: "serif",
  },
  deathHint: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontFamily: "serif",
    marginTop: spacing.xs,
    fontStyle: "italic",
  },
  streakText: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontFamily: "serif",
    marginTop: spacing.xs,
    opacity: 0.7,
  },
  scarText: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontFamily: "serif",
    marginTop: 2,
    opacity: 0.6,
  },
  oathsSection: {
    flex: 1,
    minHeight: "35%",
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  oathsList: {
    padding: spacing.md,
    paddingTop: spacing.lg,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 28,
    color: colors.textFaint,
    opacity: 0.3,
  },
  emptyText: {
    color: colors.textFaint,
    fontSize: fontSize.sm,
    fontFamily: "serif",
    marginTop: spacing.sm,
    opacity: 0.5,
    fontStyle: "italic",
  },
  forgeButton: {
    position: "absolute",
    alignSelf: "center",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  forgeGlyph: {
    color: colors.textFaint,
    fontSize: 24,
    fontFamily: "serif",
    lineHeight: 26,
  },
});
