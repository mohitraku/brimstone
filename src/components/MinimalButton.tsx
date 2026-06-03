// A single reusable button — two variants: primary and ghost.
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  type ViewStyle,
} from "react-native";
import { colors, spacing, fontSize, radii } from "../theme";

interface Props {
  title: string;
  onPress: () => void;
  variant?: "primary" | "ghost";
  disabled?: boolean;
  style?: ViewStyle;
}

export function MinimalButton({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  style,
}: Props) {
  return (
    <TouchableOpacity
      style={[
        styles.base,
        variant === "primary" ? styles.primary : styles.ghost,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.text,
          variant === "primary" ? styles.textPrimary : styles.textGhost,
          disabled && styles.textDisabled,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: colors.accent,
    borderWidth: 0,
  },
  ghost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabled: {
    opacity: 0.4,
  },
  text: {
    fontSize: fontSize.md,
    fontFamily: "serif",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  textPrimary: {
    color: colors.bg,
  },
  textGhost: {
    color: colors.textFaint,
  },
  textDisabled: {
    color: colors.textMuted,
  },
});
