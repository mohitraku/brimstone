import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import type { Commitment } from "@/db/commitments";
import { colors, fontSize, spacing, radii } from "@/constants/theme";

interface Props {
  commitment: Commitment;
  isCompleted: boolean;
  onComplete: () => void;
  onUseEstus?: () => void;
  showEstusOption?: boolean;
}

export function CommitmentCard({
  commitment,
  isCompleted,
  onComplete,
  onUseEstus,
  showEstusOption,
}: Props) {
  return (
    <View style={[styles.card, isCompleted && styles.completed]}>
      <TouchableOpacity
        style={styles.mainRow}
        onPress={isCompleted ? undefined : onComplete}
        activeOpacity={0.6}
        disabled={isCompleted}
      >
        <Text style={styles.icon}>{commitment.icon ?? "🔥"}</Text>
        <View style={styles.content}>
          <Text
            style={[styles.title, isCompleted && styles.titleCompleted]}
            numberOfLines={1}
          >
            {commitment.title}
          </Text>
          <Text style={styles.frequency}>{commitment.frequency}</Text>
        </View>
        <View style={[styles.check, isCompleted && styles.checkDone]}>
          {isCompleted && <Text style={styles.checkMark}>{"✓"}</Text>}
        </View>
      </TouchableOpacity>

      {showEstusOption && onUseEstus && (
        <TouchableOpacity style={styles.estusRow} onPress={onUseEstus}>
          <Text style={styles.estusText}>Use Estus to forgive</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    overflow: "hidden",
  },
  completed: {
    opacity: 0.5,
    borderColor: colors.borderActive,
  },
  mainRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
  },
  icon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.md,
    fontFamily: "serif",
  },
  titleCompleted: {
    textDecorationLine: "line-through",
    color: colors.textDim,
  },
  frequency: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    marginTop: 2,
    fontFamily: "serif",
    fontStyle: "italic",
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderActive,
    alignItems: "center",
    justifyContent: "center",
  },
  checkDone: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkMark: {
    color: colors.bg,
    fontSize: 14,
    fontWeight: "700",
  },
  estusRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.sm,
    alignItems: "center",
  },
  estusText: {
    color: colors.estus,
    fontSize: fontSize.sm,
    fontFamily: "serif",
    fontStyle: "italic",
  },
});
