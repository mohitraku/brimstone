import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { MinimalButton } from "@/components/ui/MinimalButton";
import { colors, spacing, fontSize } from "@/constants/theme";
import { StatusBar } from "expo-status-bar";

export default function LoginScreen() {
  const { sendEmailOtp, verifyEmailOtp, sendPhoneOtp, verifyPhoneOtp } =
    useAuth();
  const [input, setInput] = useState("");
  const [otp, setOtp] = useState("");
  const [mode, setMode] = useState<"email" | "phone">("email");
  const [step, setStep] = useState<"input" | "otp">("input");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEmail = mode === "email";
  const isPhone = mode === "phone";

  const handleSubmit = async () => {
    if (!input.trim()) return;
    setError(null);
    setIsSubmitting(true);
    try {
      if (isEmail) {
        await sendEmailOtp(input.trim());
      } else {
        await sendPhoneOtp(input.trim());
      }
      setStep("otp");
    } catch (e) {
      setError(e instanceof Error ? e.message : "The shrine is silent");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) return;
    setError(null);
    setIsSubmitting(true);
    try {
      if (isEmail) {
        await verifyEmailOtp(input.trim(), otp.trim());
      } else {
        await verifyPhoneOtp(input.trim(), otp.trim());
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Wrong token");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style="light" />

      <View style={styles.top}>
        <Text style={styles.title}>Brimstone</Text>
        <Text style={styles.subtitle}>Kindle the flame</Text>
      </View>

      <View style={styles.form}>
        {error && <Text style={styles.error}>{error}</Text>}

        {step === "input" && (
          <>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder={isEmail ? "your@email.com" : "+1234567890"}
              placeholderTextColor={colors.textFaint}
              keyboardType={isEmail ? "email-address" : "phone-pad"}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
            />
            <MinimalButton
              title={isSubmitting ? "Approaching..." : "Enter the shrine"}
              onPress={handleSubmit}
              disabled={isSubmitting}
            />
            <View style={styles.toggleRow}>
              <Text
                style={styles.toggle}
                onPress={() => {
                  setMode(isEmail ? "phone" : "email");
                  setError(null);
                }}
              >
                {isEmail ? "Use phone instead" : "Use email instead"}
              </Text>
            </View>
          </>
        )}

        {step === "otp" && (
          <>
            <Text style={styles.hint}>
              A code was sent to{"\n"}
              {input}
            </Text>
            <TextInput
              style={styles.input}
              value={otp}
              onChangeText={setOtp}
              placeholder="000000"
              placeholderTextColor={colors.textFaint}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
            <MinimalButton
              title={isSubmitting ? "..." : "Confirm"}
              onPress={handleVerifyOtp}
              disabled={isSubmitting}
            />
            <View style={styles.toggleRow}>
              <Text
                style={styles.toggle}
                onPress={() => {
                  setStep("input");
                  setOtp("");
                  setError(null);
                }}
              >
                Try a different {isEmail ? "email" : "number"}
              </Text>
            </View>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    padding: spacing.xl,
  },
  top: {
    alignItems: "center",
    marginBottom: spacing.xxl,
  },
  title: {
    color: colors.flame.orange,
    fontSize: fontSize.title,
    fontFamily: "serif",
    letterSpacing: 4,
    textTransform: "uppercase",
  },
  subtitle: {
    color: colors.textDim,
    fontSize: fontSize.sm,
    fontFamily: "serif",
    fontStyle: "italic",
    marginTop: spacing.xs,
  },
  form: {
    gap: spacing.md,
  },
  input: {
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: spacing.md,
    color: colors.text,
    fontSize: fontSize.md,
    fontFamily: "serif",
  },
  error: {
    color: colors.danger,
    fontSize: fontSize.sm,
    fontFamily: "serif",
    textAlign: "center",
  },
  hint: {
    color: colors.textDim,
    fontSize: fontSize.sm,
    fontFamily: "serif",
    textAlign: "center",
  },
  toggleRow: {
    alignItems: "center",
  },
  toggle: {
    color: colors.textFaint,
    fontSize: fontSize.sm,
    fontFamily: "serif",
    fontStyle: "italic",
    textDecorationLine: "underline",
  },
});
