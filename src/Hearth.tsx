// The Hearth — main screen. Flame, today's oaths, cryptic stats overlay.
// No headers. No tabs. No hand-holding.
import { useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlameScene } from "./FlameScene";
import { CommitmentCard } from "./CommitmentCard";
import { colors, spacing, fontSize } from "./theme";
import { flameLevelName, flameColor } from "./flame-math";
import type { FlameUIState } from "./useFlame";
import type { Commitment } from "./db";

interface Props {
  flame: FlameUIState;
  commitments: Commitment[];
  completedIds: Set<string>;
  onComplete: (id: string) => Promise<number>;
  onForge: () => void;
}

export function Hearth({
  flame,
  commitments,
  completedIds,
  onComplete,
  onForge,
}: Props) {
  const insets = useSafeAreaInsets();
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // Flash flame name on mount, then fade to near-invisible
  useEffect(() => {
    Animated.sequence([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2500),
      Animated.timing(overlayOpacity, {
        toValue: 0.12,
        duration: 1800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [overlayOpacity]);

  const isDead = flame.flameIntensity <= 0;
  const levelName = flameLevelName(flame.flameIntensity);
  const fColor = flameColor(flame.flameIntensity);

  return (
    <View style={styles.root}>
      {/* ── Flame ──────────────────────────────────────────── */}
      <View style={styles.flameContainer}>
        <FlameScene intensity={flame.flameIntensity} />

        <Animated.View
          style={[styles.overlay, { opacity: overlayOpacity }]}
          pointerEvents="none"
        >
          <Text style={[styles.levelName, { color: fColor }]}>
            {levelName}
          </Text>

          {isDead ? (
            <View style={styles.deathBlock}>
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

      {/* ── Oaths ──────────────────────────────────────────── */}
      <View style={[styles.oathsSection, { paddingBottom: insets.bottom + 60 }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.oathsList}
        >
          {commitments.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>⬥</Text>
              <Text style={styles.emptyText}>the hearth is cold</Text>
            </View>
          ) : (
            commitments.map((c) => (
              <CommitmentCard
                key={c.id}
                title={c.title}
                icon={c.icon}
                frequency={c.frequency}
                isCompleted={completedIds.has(c.id)}
                onComplete={() => onComplete(c.id)}
              />
            ))
          )}
        </ScrollView>

        {/* Subtle forge button — centered glyph, not a FAB */}
        <TouchableOpacity
          style={[styles.forgeBtn, { bottom: insets.bottom + 16 }]}
          onPress={onForge}
          activeOpacity={0.6}
        >
          <Text style={styles.forgeGlyph}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
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
  deathBlock: {
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
  forgeBtn: {
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
