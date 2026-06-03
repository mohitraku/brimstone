// Forge — create and manage oaths. Cryptic, minimal, no labels.
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, fontSize, radii } from "./theme";
import type { Commitment } from "./db";

const FREQUENCIES = [
  { key: "daily", mark: "each dawn" },
  { key: "weekdays", mark: "each labor" },
  { key: "weekly", mark: "each seventh" },
] as const;

const SIGILS = [
  "🔥", "⚔️", "💪", "📖", "🏃", "🧘", "🎯", "💡", "⭐", "🛡️", "🕯️", "🌙",
];

interface Props {
  commitments: Commitment[];
  onAdd: (title: string, frequency: string, icon: string | null) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onBack: () => void;
}

export function Forge({ commitments, onAdd, onRemove, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [sigil, setSigil] = useState(SIGILS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSwear = useCallback(async () => {
    if (!title.trim() || isSubmitting) return;
    setIsSubmitting(true);
    await onAdd(title.trim(), frequency, sigil);
    setTitle("");
    setIsSubmitting(false);
  }, [title, frequency, sigil, isSubmitting, onAdd]);

  const handleForsake = useCallback(
    (id: string, oathTitle: string) => {
      Alert.alert("", `forsake "${oathTitle}"?`, [
        { text: "no", style: "cancel" },
        { text: "yes", style: "destructive", onPress: () => onRemove(id) },
      ]);
    },
    [onRemove],
  );

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
        {/* Drag handle */}
        <View style={styles.handle} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Swear form ──────────────────────────────── */}
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

          {/* Frequency chips */}
          <View style={styles.chipRow}>
            {FREQUENCIES.map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[
                  styles.chip,
                  frequency === f.key && styles.chipActive,
                ]}
                onPress={() => setFrequency(f.key)}
                activeOpacity={0.6}
              >
                <Text
                  style={[
                    styles.chipText,
                    frequency === f.key && styles.chipTextActive,
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

          {/* Actions */}
          <TouchableOpacity
            style={[
              styles.swearBtn,
              (!title.trim() || isSubmitting) && styles.swearBtnDisabled,
            ]}
            onPress={handleSwear}
            disabled={!title.trim() || isSubmitting}
            activeOpacity={0.7}
          >
            <Text style={styles.swearText}>Swear</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.6}
          >
            <Text style={styles.backText}>turn back</Text>
          </TouchableOpacity>

          {/* ── Bound oaths ─────────────────────────────── */}
          {commitments.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionMark}>oaths bound</Text>

              {commitments.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={styles.oathRow}
                  onLongPress={() => handleForsake(c.id, c.title)}
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

// ── Styles ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
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
  chipRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  chipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentFaint,
  },
  chipText: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontFamily: "serif",
  },
  chipTextActive: {
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
  swearBtn: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  swearBtnDisabled: {
    opacity: 0.4,
  },
  swearText: {
    color: colors.bg,
    fontSize: fontSize.md,
    fontFamily: "serif",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  backBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  backText: {
    color: colors.textFaint,
    fontSize: fontSize.md,
    fontFamily: "serif",
    textTransform: "uppercase",
    letterSpacing: 1.5,
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
