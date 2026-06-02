import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useFlame } from "@/hooks/useFlame";
import { useCommitments } from "@/hooks/useCommitments";
import { useBell } from "@/hooks/useBell";
import { useEstus } from "@/hooks/useEstus";
import { CommitmentCard } from "@/components/commitments/CommitmentCard";
import { colors, spacing, fontSize } from "@/constants/theme";

export default function CommitmentsScreen() {
  const router = useRouter();
  const { flame, refresh } = useFlame();
  const {
    commitments,
    completedIds,
    completeCommitment,
  } = useCommitments(refresh);
  const { announceCompletion } = useBell();
  const { useCharge } = useEstus(refresh);

  const handleComplete = async (id: string) => {
    const result = await completeCommitment(id);
    if (result) {
      await announceCompletion();
    }
  };

  const handleUseEstus = async (id: string) => {
    if (!flame) return;
    await useCharge(flame.flameIntensity, id);
  };

  const completedCount = completedIds.size;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Oaths Sworn</Text>
        <Text style={styles.counter}>
          {completedCount}/{commitments.length} today
        </Text>
      </View>

      {commitments.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>{"⚔"}</Text>
          <Text style={styles.emptyText}>
            No oaths sworn. Forge your first.
          </Text>
        </View>
      ) : (
        <FlatList
          data={commitments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <CommitmentCard
              commitment={item}
              isCompleted={completedIds.has(item.id)}
              onComplete={() => handleComplete(item.id)}
              onUseEstus={() => handleUseEstus(item.id)}
              showEstusOption={
                completedIds.has(item.id) === false &&
                (flame?.currentEstus ?? 0) > 0
              }
            />
          )}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.navigate("/modals/create-commitment")}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontFamily: "serif",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  counter: {
    color: colors.textDim,
    fontSize: fontSize.sm,
    fontFamily: "serif",
    fontStyle: "italic",
    marginTop: spacing.xs,
  },
  list: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyText: {
    color: colors.textFaint,
    fontSize: fontSize.md,
    fontFamily: "serif",
    fontStyle: "italic",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.flame.orange,
  },
  fabText: {
    color: colors.bg,
    fontSize: 28,
    fontWeight: "300",
    marginTop: -2,
  },
});
