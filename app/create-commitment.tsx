// Forge — create and manage oaths. Dark, cryptic, minimal.
import { useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCommitments } from "../src/useCommitments";
import { MinimalButton } from "../src/components/MinimalButton";
import { colors, spacing, fontSize, radii } from "../src/theme";

const FREQUENCIES = [
  { key: "daily", mark: "each dawn" },
  { key: "weekdays", mark: "each labor" },
  { key: "weekly", mark: "each seventh" },
] as const;

const SIGILS = ["🔥", "⚔️", "💪", "📖", "🏃", "🧘", "🎯", "💡", "⭐", "🛡️", "🕯️", "🌙"];

export default function CreateCommitment() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { commitments, add, remove } = useCommitments();

  const [title, setTitle] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [sigil, setSigil] = useState(SIGILS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSwear = useCallback(async () => {
    if (!title.trim() || isSubmitting) return;
    setIsSubmitting(true);
    await add(title.trim(), frequency, sigil);
    setTitle("");
    setIsSubmitting(false);
  }, [title, frequency, sigil, isSubmitting, add]);

  const handleDelete = useCallback(
    (id: string, oathTitle: string) => {
      // No confirmation — Dark Souls doesn't ask "are you sure?"
      // But we use a subtle native alert since swipe-to-delete requires
      // more gesture handler setup
      Alert.alert("", `forsake "${oathTitle}"?`, [
        { text: "no", style: "cancel" },
        {
          text: "yes",
          style: "destructive",
          onPress: () => remove(id),
        },
      ]);
    },
    [remove],
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.content, { paddingTop: insets.top + spacing.lg }]}>
        {/* Drag handle */}
        <View style={styles.handle} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Forge form ──────────────────────────────────── */}
          <Text style={styles.sectionMark}>swear an oath</Text>

          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="_"
            placeholderTextColor={colors.textFaint}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSwear}
            selectionColor={colors.accent}
          />

          {/* Frequency — three cryptic marks */}
          <View style={styles.frequencyRow}>
            {FREQUENCIES.map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[
                  styles.freqChip,
                  frequency === f.key && styles.freqChipActive,
                ]}
                onPress={() => setFrequency(f.key)}
                activeOpacity={0.6}
              >
                <Text
                  style={[
                    styles.freqText,
                    frequency === f.key && styles.freqTextActive,
                  ]}
                >
                  {f.mark}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Sigil grid */}
          <View style={styles.sigilGrid}>
            {SIGILS.map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.sigilCell,
                  sigil === s && styles.sigilCellActive,
                ]}
                onPress={() => setSigil(s)}
                activeOpacity={0.6}
              >
                <Text style={styles.sigilEmoji}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Action buttons */}
          <View style={styles.actions}>
            <MinimalButton
              title="Swear"
              onPress={handleSwear}
              variant="primary"
              disabled={!title.trim() || isSubmitting}
            />
            <View style={{ height: spacing.sm }} />
            <MinimalButton
              title="turn back"
              onPress={() => router.back()}
              variant="ghost"
            />
          </View>

          {/* ── Existing oaths ──────────────────────────────── */}
          {commitments.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionMark}>oaths bound</Text>

              {commitments.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={styles.oathRow}
                  onLongPress={() => handleDelete(c.id, c.title)}
                  activeOpacity={0.5}
                >
                  <Text style={styles.oathSigil}>{c.icon ?? "⬥"}</Text>
                  <Text style={styles.oathTitle} numberOfLines={1}>
                    {c.title}
                  </Text>
                  <Text style={styles.oathFreq}>
                    {FREQUENCIES.find((f) => f.key === c.frequency)?.mark ??
                      c.frequency}
                  </Text>
                </TouchableOpacity>
              ))}
              <Text style={styles.hint}>hold to forsake</Text>
            </>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  handle: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: spacing.lg,
  },
  sectionMark: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontFamily: "serif",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    color: colors.text,
    fontSize: fontSize.lg,
    fontFamily: "serif",
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  frequencyRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  freqChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  freqChipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentFaint,
  },
  freqText: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontFamily: "serif",
  },
  freqTextActive: {
    color: colors.gold,
  },
  sigilGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  sigilCell: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sigilCellActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentFaint,
  },
  sigilEmoji: {
    fontSize: 20,
  },
  actions: {
    marginBottom: spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  oathRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  oathSigil: {
    fontSize: 16,
    marginRight: spacing.sm,
    width: 28,
    textAlign: "center",
  },
  oathTitle: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
    fontFamily: "serif",
  },
  oathFreq: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontFamily: "serif",
    marginLeft: spacing.sm,
    opacity: 0.6,
  },
  hint: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontFamily: "serif",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: spacing.sm,
    opacity: 0.4,
  },
});
