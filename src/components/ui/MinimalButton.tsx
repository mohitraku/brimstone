import {
  TouchableOpacity,
  Text,
  StyleSheet,
  type ViewStyle,
} from "react-native";
import { colors, fontSize, radii, spacing } from "@/constants/theme";

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
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        styles.base,
        variant === "primary" && styles.primary,
        variant === "ghost" && styles.ghost,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          variant === "ghost" && styles.ghostText,
          disabled && styles.disabledText,
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
    paddingHorizontal: spacing.xl,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderActive,
  },
  primary: {
    backgroundColor: colors.accent,
    borderColor: "transparent",
  },
  ghost: {
    backgroundColor: "transparent",
    borderColor: colors.border,
  },
  disabled: {
    opacity: 0.4,
  },
  text: {
    color: colors.bg,
    fontSize: fontSize.md,
    fontFamily: "serif",
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  ghostText: {
    color: colors.textDim,
  },
  disabledText: {
    color: colors.textFaint,
  },
});
