// A single oath — minimal, cryptic. No estus, no verbose labels.
import { StyleSheet, TouchableOpacity, Text, View } from "react-native";
import { colors, spacing, fontSize, radii } from "../theme";

const FREQUENCY_MARKS: Record<string, string> = {
  daily: "each dawn",
  weekdays: "each labor",
  weekly: "each seventh",
};

interface Props {
  title: string;
  icon: string | null;
  frequency: string;
  isCompleted: boolean;
  onComplete: () => void;
}

export function CommitmentCard({
  title,
  icon,
  frequency,
  isCompleted,
  onComplete,
}: Props) {
  return (
    <TouchableOpacity
      style={[styles.card, isCompleted && styles.cardCompleted]}
      onPress={onComplete}
      disabled={isCompleted}
      activeOpacity={0.7}
    >
      <View style={styles.sigil}>
        <Text style={styles.sigilText}>{icon ?? "⬥"}</Text>
      </View>

      <View style={styles.body}>
        <Text
          style={[styles.title, isCompleted && styles.titleCompleted]}
          numberOfLines={2}
        >
          {title}
        </Text>
        <Text style={styles.frequency}>
          {FREQUENCY_MARKS[frequency] ?? frequency}
        </Text>
      </View>

      <View style={[styles.check, isCompleted && styles.checkDone]}>
        {isCompleted && <Text style={styles.checkMark}>✓</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    opacity: 1,
  },
  cardCompleted: {
    opacity: 0.35,
    borderColor: colors.accentFaint,
  },
  sigil: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  sigilText: {
    fontSize: 22,
  },
  body: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.md,
    fontFamily: "serif",
  },
  titleCompleted: {
    textDecorationLine: "line-through",
    color: colors.textMuted,
  },
  frequency: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontFamily: "serif",
    marginTop: 2,
    textTransform: "lowercase",
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.textFaint,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.sm,
  },
  checkDone: {
    borderColor: colors.accent,
    backgroundColor: colors.accentFaint,
  },
  checkMark: {
    color: colors.gold,
    fontSize: 14,
    fontFamily: "serif",
  },
});
