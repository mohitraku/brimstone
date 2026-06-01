import { View, Text, StyleSheet } from "react-native";
import { colors, fontSize, spacing } from "@/constants/theme";

interface Props {
  current: number;
  max: number;
}

export function EstusDisplay({ current, max }: Props) {
  return (
    <View style={styles.container}>
      {Array.from({ length: max }).map((_, i) => (
        <View
          key={i}
          style={[styles.charge, i < current ? styles.filled : styles.empty]}
        />
      ))}
      <Text style={styles.label}>
        {current}/{max}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderWidth: 1,
    borderColor: colors.border,
  },
  charge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
  },
  filled: {
    backgroundColor: colors.estus,
    borderColor: colors.estus,
  },
  empty: {
    backgroundColor: "transparent",
    borderColor: colors.estusEmpty,
  },
  label: {
    color: colors.textDim,
    fontSize: fontSize.xs,
    marginLeft: spacing.xs,
    fontFamily: "serif",
  },
});
