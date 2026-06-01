import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useFlame } from "@/hooks/useFlame";
import { colors, spacing, fontSize } from "@/constants/theme";

export default function RecordScreen() {
  const { flame } = useFlame();

  if (!flame) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>...</Text>
      </View>
    );
  }

  const {
    flameIntensity,
    streakDays,
    longestStreak,
    deathCount,
    currentEstus,
  } = flame;

  const isDead = flameIntensity <= 0;
  const flameLevel =
    flameIntensity <= 0
      ? "Extinguished"
      : flameIntensity < 0.2
        ? "Fading Ember"
        : flameIntensity < 0.4
          ? "Glowing Coal"
          : flameIntensity < 0.6
            ? "Steady Flame"
            : flameIntensity < 0.8
              ? "Roaring Blaze"
              : "Searing Inferno";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>The Record</Text>

      {/* Flame Status */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Flame</Text>
        <Text style={[styles.bigText, isDead && styles.deadText]}>
          {flameLevel}
        </Text>
        <View style={styles.intensityBar}>
          <View
            style={[
              styles.intensityFill,
              {
                width: `${flameIntensity * 100}%`,
                backgroundColor:
                  flameIntensity <= 0
                    ? colors.flame.ember
                    : flameIntensity < 0.3
                      ? colors.flame.red
                      : flameIntensity < 0.6
                        ? colors.flame.orange
                        : colors.flame.gold,
              },
            ]}
          />
        </View>
        <Text style={styles.stat}>Intensity: {Math.round(flameIntensity * 100)}%</Text>
      </View>

      {/* Streaks */}
      <View style={styles.statsRow}>
        <View style={[styles.card, styles.statCard]}>
          <Text style={styles.cardTitle}>Streak</Text>
          <Text style={styles.statValue}>
            {streakDays}
          </Text>
          <Text style={styles.statLabel}>
            {streakDays === 1 ? "day" : "days"}
          </Text>
        </View>
        <View style={[styles.card, styles.statCard]}>
          <Text style={styles.cardTitle}>Best</Text>
          <Text style={styles.statValue}>
            {longestStreak}
          </Text>
          <Text style={styles.statLabel}>
            {longestStreak === 1 ? "day" : "days"}
          </Text>
        </View>
      </View>

      {/* Deaths */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Deaths Borne</Text>
        <Text style={styles.bigText}>{deathCount}</Text>
        <Text style={styles.wisdom}>
          {deathCount === 0
            ? "The flame endures."
            : deathCount < 3
              ? "Each death is a lesson."
              : deathCount < 10
                ? "The ashes know your name."
                : "You rise, always."}
        </Text>
      </View>

      {/* Estus */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Estus Charges</Text>
        <Text style={styles.statValue}>
          {currentEstus}/2
        </Text>
        <Text style={styles.statLabel}>
          {currentEstus > 0
            ? "You carry hope."
            : "None remain. Wait for the dawn."}
        </Text>
      </View>

      {/* Sign out */}
      <View style={styles.bottomActions}>
        <Text style={styles.verse}>
          {"\"In the darkness, the flame remembers.\""}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontFamily: "serif",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: spacing.lg,
  },
  loading: {
    color: colors.textDim,
    fontSize: fontSize.md,
    fontFamily: "serif",
    textAlign: "center",
    marginTop: 100,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTitle: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontFamily: "serif",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  bigText: {
    color: colors.flame.orange,
    fontSize: fontSize.xxl,
    fontFamily: "serif",
    letterSpacing: 1,
  },
  deadText: {
    color: colors.flame.ember,
  },
  stat: {
    color: colors.textDim,
    fontSize: fontSize.sm,
    fontFamily: "serif",
    marginTop: spacing.sm,
  },
  wisdom: {
    color: colors.textDim,
    fontSize: fontSize.sm,
    fontFamily: "serif",
    fontStyle: "italic",
    marginTop: spacing.sm,
  },
  intensityBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    marginTop: spacing.md,
    overflow: "hidden",
  },
  intensityFill: {
    height: "100%",
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
  },
  statValue: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontFamily: "serif",
  },
  statLabel: {
    color: colors.textDim,
    fontSize: fontSize.sm,
    fontFamily: "serif",
    fontStyle: "italic",
  },
  bottomActions: {
    marginTop: spacing.lg,
    alignItems: "center",
  },
  verse: {
    color: colors.textFaint,
    fontSize: fontSize.sm,
    fontFamily: "serif",
    fontStyle: "italic",
    textAlign: "center",
  },
});
