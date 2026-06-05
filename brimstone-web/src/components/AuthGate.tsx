// Auth gate — login form + subscription prompt.
// No labels, no "Sign Up"/"Log In" distinction. Fumble in the dark.
"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { colors, spacing, fontSize, radii } from "@/lib/theme";

export function AuthGate() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    await login(trimmed);
    setSent(true);
    setSubmitting(false);
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.glyph}>⬥</div>

      {sent ? (
        <p style={styles.sentText}>check thy inbox</p>
      ) : (
        <>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="_"
            autoFocus
            style={styles.input}
          />
          <button
            onClick={handleSubmit}
            disabled={!email.trim() || submitting}
            style={{
              ...styles.btn,
              ...((!email.trim() || submitting) ? styles.btnDisabled : {}),
            }}
          >
            Receive Link
          </button>
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: spacing.lg,
    padding: spacing.xl,
  },
  glyph: {
    fontSize: 48,
    color: colors.textFaint,
    opacity: 0.3,
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.md,
    color: colors.text,
    fontSize: fontSize.lg,
    fontFamily: "serif",
    padding: spacing.md,
    width: 260,
    textAlign: "center",
    outline: "none",
  },
  btn: {
    backgroundColor: colors.accent,
    color: colors.bg,
    border: "none",
    borderRadius: radii.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    fontSize: fontSize.md,
    fontFamily: "serif",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    cursor: "pointer",
    width: 260,
  },
  btnDisabled: {
    opacity: 0.4,
    cursor: "default",
  },
  sentText: {
    color: colors.textFaint,
    fontSize: fontSize.md,
    fontFamily: "serif",
    fontStyle: "italic",
    opacity: 0.6,
  },
};
