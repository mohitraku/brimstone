import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useFlame } from "@/hooks/useFlame";
import { useCommitments } from "@/hooks/useCommitments";
import { useBell } from "@/hooks/useBell";
import { useAuth } from "@/hooks/useAuth";
import { FlameScene } from "@/components/flame/FlameScene";
import { EstusDisplay } from "@/components/estus/EstusDisplay";
import { CommitmentCard } from "@/components/commitments/CommitmentCard";
import { MinimalButton } from "@/components/ui/MinimalButton";
import { colors, spacing, fontSize } from "@/constants/theme";

export default function FlameScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { flame, refresh } = useFlame();
  const {
    commitments,
    completedIds,
    completeCommitment,
  } = useCommitments(refresh);
  const { announceCompletion } = useBell(!!user);

  const todayCommitments = commitments.slice(0, 3); // Show first 3

  const handleComplete = async (id: string) => {
    const result = await completeCommitment(id);
    if (result) {
      await announceCompletion();
    }
  };

  if (!flame) {
    return <View style={styles.container} />;
  }

  const { flameIntensity, streakDays, deathCount, currentEstus, maxEstus } =
    flame;

  const isDead = flameIntensity <= 0;

  return (
    <View style={styles.container}>
      {/* Flame scene fills top half */}
      <View style={styles.flameContainer}>
        <FlameScene intensity={flameIntensity} />
        {/* Overlay content on flame */}
        <View style={styles.flameOverlay}>
          {isDead ? (
            <View style={styles.deathNotice}>
              <Text style={styles.deathText}>The flame has died</Text>
              <Text style={styles.deathCount}>
                Deaths borne: {deathCount}
              </Text>
              <Text style={styles.deathHint}>
                A new ember will rise with the dawn
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.streakText}>
                The flame has burned for {streakDays}{" "}
                {streakDays === 1 ? "day" : "days"}
              </Text>
              <View style={styles.estusRow}>
                <EstusDisplay current={currentEstus} max={maxEstus} />
              </View>
            </>
          )}
        </View>
      </View>

      {/* Today's commitments */}
      <ScrollView
        style={styles.commitmentsScroll}
        contentContainerStyle={styles.commitmentsContent}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Oaths</Text>
          <Text
            style={styles.viewAll}
            onPress={() => router.navigate("/(tabs)/commitments")}
          >
            View all
          </Text>
        </View>

        {todayCommitments.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              No oaths sworn. What will you pursue?
            </Text>
            <MinimalButton
              title="Forge an Oath"
              variant="ghost"
              onPress={() => router.navigate("/modals/create-commitment")}
            />
          </View>
        ) : (
          todayCommitments.map((c) => (
            <CommitmentCard
              key={c.id}
              commitment={c}
              isCompleted={completedIds.has(c.id)}
              onComplete={() => handleComplete(c.id)}
            />
          ))
        )}
      </ScrollView>
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
  },
  flameOverlay: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    alignItems: "center",
    pointerEvents: "box-none",
  },
  streakText: {
    color: colors.textDim,
    fontSize: fontSize.sm,
    fontFamily: "serif",
    fontStyle: "italic",
    marginBottom: spacing.sm,
  },
  estusRow: {
    marginTop: spacing.xs,
    alignSelf: "flex-end",
    marginRight: spacing.lg,
  },
  deathNotice: {
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deathText: {
    color: colors.flame.red,
    fontSize: fontSize.lg,
    fontFamily: "serif",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  deathCount: {
    color: colors.textDim,
    fontSize: fontSize.sm,
    fontFamily: "serif",
    marginTop: spacing.xs,
  },
  deathHint: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontFamily: "serif",
    fontStyle: "italic",
    marginTop: spacing.sm,
  },
  commitmentsScroll: {
    flex: 0.5,
    backgroundColor: colors.bg,
  },
  commitmentsContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.textDim,
    fontSize: fontSize.sm,
    fontFamily: "serif",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  viewAll: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontFamily: "serif",
    fontStyle: "italic",
  },
  empty: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  emptyText: {
    color: colors.textFaint,
    fontSize: fontSize.sm,
    fontFamily: "serif",
    fontStyle: "italic",
    marginBottom: spacing.md,
  },
});
