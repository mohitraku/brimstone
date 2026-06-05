// A single oath card — sigil, title, frequency mark, completion state.
// Ported from React Native to HTML/CSS. Identical visual output.
"use client";

import { colors, spacing, fontSize } from "@/lib/theme";

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
    <button
      onClick={onComplete}
      disabled={isCompleted}
      style={{
        ...styles.card,
        ...(isCompleted ? styles.cardDone : {}),
      }}
    >
      <span style={styles.sigil}>{icon ?? "⬥"}</span>
      <div style={styles.body}>
        <span
          style={{
            ...styles.title,
            ...(isCompleted ? styles.titleDone : {}),
          }}
        >
          {title}
        </span>
        <span style={styles.freq}>
          {FREQ_MARKS[frequency] ?? frequency}
        </span>
      </div>
      <span
        style={{
          ...styles.check,
          ...(isCompleted ? styles.checkDone : {}),
        }}
      >
        {isCompleted && <span style={styles.checkMark}>✓</span>}
      </span>
    </button>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    paddingTop: spacing.sm + 2,
    paddingBottom: spacing.sm + 2,
    paddingLeft: spacing.sm,
    paddingRight: spacing.sm,
    borderBottom: `1px solid ${colors.border}`,
    background: "none",
    width: "100%",
    cursor: "pointer",
    border: "none",
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    textAlign: "left",
    fontFamily: "serif",
  },
  cardDone: {
    opacity: 0.4,
    cursor: "default",
  },
  sigil: {
    fontSize: 18,
    width: 32,
    textAlign: "center",
    marginRight: spacing.sm,
    lineHeight: "24px",
  },
  body: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.md,
    fontFamily: "serif",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
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
    display: "block",
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: "50%",
    border: `1px solid ${colors.border}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.sm,
    flexShrink: 0,
  },
  checkDone: {
    borderColor: colors.accent,
    backgroundColor: colors.accentFaint,
  },
  checkMark: {
    color: colors.gold,
    fontSize: 14,
    fontFamily: "serif",
    lineHeight: "16px",
  },
};
