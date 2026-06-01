import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useCommitments } from "@/hooks/useCommitments";
import { useFlame } from "@/hooks/useFlame";
import { colors, spacing, fontSize, radii } from "@/constants/theme";
import { MinimalButton } from "@/components/ui/MinimalButton";

const FREQUENCIES = ["daily", "weekdays", "weekly"] as const;
const ICONS = ["🔥", "⚔", "💪", "📖", "🏃", "🧘", "🎯", "💡", "🌟", "🛡", "🕯", "🌙"];

export default function CreateCommitmentScreen() {
  const router = useRouter();
  const { refresh } = useFlame();
  const { addCommitment } = useCommitments(refresh);
  const [title, setTitle] = useState("");
  const [frequency, setFrequency] = useState<string>("daily");
  const [icon, setIcon] = useState<string>("🔥");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleForge = async () => {
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      await addCommitment(title.trim(), frequency, icon);
      router.back();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.handle} />

        <Text style={styles.title}>Forge an Oath</Text>

        {/* Title input */}
        <Text style={styles.label}>What do you swear to do?</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Your oath..."
          placeholderTextColor={colors.textFaint}
          autoFocus
        />

        {/* Frequency picker */}
        <Text style={styles.label}>How often?</Text>
        <View style={styles.freqRow}>
          {FREQUENCIES.map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.freqChip,
                frequency === f && styles.freqChipActive,
              ]}
              onPress={() => setFrequency(f)}
            >
              <Text
                style={[
                  styles.freqChipText,
                  frequency === f && styles.freqChipTextActive,
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Icon picker */}
        <Text style={styles.label}>Choose a sigil</Text>
        <View style={styles.iconGrid}>
          {ICONS.map((ic) => (
            <TouchableOpacity
              key={ic}
              style={[
                styles.iconChip,
                icon === ic && styles.iconChipActive,
              ]}
              onPress={() => setIcon(ic)}
            >
              <Text style={styles.iconText}>{ic}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.actions}>
          <MinimalButton
            title="Cancel"
            variant="ghost"
            onPress={() => router.back()}
          />
          <MinimalButton
            title={isSubmitting ? "..." : "Swear the Oath"}
            onPress={handleForge}
            disabled={isSubmitting || !title.trim()}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderActive,
    alignSelf: "center",
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontFamily: "serif",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: spacing.lg,
  },
  label: {
    color: colors.textDim,
    fontSize: fontSize.sm,
    fontFamily: "serif",
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    padding: spacing.md,
    color: colors.text,
    fontSize: fontSize.md,
    fontFamily: "serif",
  },
  freqRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  freqChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  freqChipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  freqChipText: {
    color: colors.textDim,
    fontSize: fontSize.sm,
    fontFamily: "serif",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  freqChipTextActive: {
    color: colors.bg,
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  iconChip: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bgCard,
  },
  iconChipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.bgElevated,
  },
  iconText: {
    fontSize: 22,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xl,
    justifyContent: "flex-end",
  },
});
