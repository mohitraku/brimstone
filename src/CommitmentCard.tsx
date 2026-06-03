// A single oath card — sigil, title, frequency mark, completion state.
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, spacing, fontSize, radii } from "./theme";

const FREQ_MARKS: Record<string, string> = {
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
      style={[styles.card, isCompleted && styles.cardDone]}
      onPress={onComplete}
      activeOpacity={0.6}
      disabled={isCompleted}
    >
      <Text style={styles.sigil}>{icon ?? "⬥"}</Text>
      <View style={styles.body}>
        <Text
          style={[styles.title, isCompleted && styles.titleDone]}
          numberOfLines={2}
        >
          {title}
        </Text>
        <Text style={styles.freq}>
          {FREQ_MARKS[frequency] ?? frequency}
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
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cardDone: {
    opacity: 0.4,
  },
  sigil: {
    fontSize: 18,
    width: 32,
    textAlign: "center",
    marginRight: spacing.sm,
  },
  body: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.md,
    fontFamily: "serif",
  },
  titleDone: {
    textDecorationLine: "line-through",
    color: colors.textFaint,
  },
  freq: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontFamily: "serif",
    marginTop: 2,
    opacity: 0.6,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
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
