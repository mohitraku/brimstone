// A single oath card — title, frequency mark, completion state.
// Long-press to complete/undo. No iconography. Greyed-out when inactive.
"use client";

import { useRef, useState, useCallback } from "react";
import { colors, spacing, fontSize } from "@/lib/theme";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function describeFrequency(
  frequency: string,
  recurrence_days: number[] | null,
  recurrence_dates: number[] | null,
): string {
  if (frequency === "daily") return "each dawn";
  if (recurrence_days && recurrence_days.length > 0) {
    return recurrence_days.map((d) => DAY_NAMES[d]).join(", ");
  }
  if (recurrence_dates && recurrence_dates.length > 0) {
    return recurrence_dates.map((d) => {
      if (d === 1 || d === 21 || d === 31) return `${d}st`;
      if (d === 2 || d === 22) return `${d}nd`;
      if (d === 3 || d === 23) return `${d}rd`;
      return `${d}th`;
    }).join(", ");
  }
  return "certain days";
}

interface Props {
  title: string;
  frequency: string;
  recurrence_days: number[] | null;
  recurrence_dates: number[] | null;
  isCompleted: boolean;
  isActiveToday: boolean;
  onComplete: () => void;
  onUncomplete: () => void;
}

const HOLD_MS = 500;

export function CommitmentCard({
  title,
  frequency,
  recurrence_days,
  recurrence_dates,
  isCompleted,
  isActiveToday,
  onComplete,
  onUncomplete,
}: Props) {
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdStart = useRef<number>(0);
  const moved = useRef(false);

  const clearHold = useCallback(() => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    setHoldProgress(0);
  }, []);

  const startHold = useCallback(() => {
    if (!isActiveToday) return;
    moved.current = false;
    holdStart.current = Date.now();

    const tick = () => {
      if (moved.current) {
        clearHold();
        return;
      }
      const elapsed = Date.now() - holdStart.current;
      const progress = Math.min(elapsed / HOLD_MS, 1);
      setHoldProgress(progress);
      if (progress >= 1) {
        // Trigger action
        if (isCompleted) {
          onUncomplete();
        } else {
          onComplete();
        }
        setHoldProgress(0);
        holdTimer.current = null;
      } else {
        holdTimer.current = setTimeout(tick, 16);
      }
    };
    holdTimer.current = setTimeout(tick, 16);
  }, [isActiveToday, isCompleted, onComplete, onUncomplete, clearHold]);

  const handleTouchMove = useCallback(() => {
    moved.current = true;
    clearHold();
  }, [clearHold]);

  const freqDesc = describeFrequency(frequency, recurrence_days, recurrence_dates);

  return (
    <div
      role="button"
      onMouseDown={startHold}
      onMouseUp={clearHold}
      onMouseLeave={clearHold}
      onTouchStart={startHold}
      onTouchEnd={clearHold}
      onTouchMove={handleTouchMove}
      onTouchCancel={clearHold}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        ...styles.card,
        ...(isCompleted ? styles.cardDone : {}),
        ...(!isActiveToday ? styles.cardInactive : {}),
        cursor: isActiveToday ? "pointer" : "default",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Hold progress bar */}
      {holdProgress > 0 && (
        <div
          style={{
            ...styles.progressBar,
            width: `${holdProgress * 100}%`,
            backgroundColor: isCompleted ? colors.danger : colors.accent,
          }}
        />
      )}

      <div style={styles.body}>
        <span
          style={{
            ...styles.title,
            ...(isCompleted ? styles.titleDone : {}),
          }}
        >
          {title}
        </span>
        <span style={styles.freq}>{freqDesc}</span>
      </div>

      {/* Check circle — only when active today */}
      {isActiveToday && (
        <span
          style={{
            ...styles.check,
            ...(isCompleted ? styles.checkDone : {}),
            // Pulse during hold
            ...(holdProgress > 0 && !isCompleted ? { borderColor: colors.accent, transform: "scale(1.1)" } : {}),
            transition: holdProgress > 0 ? "none" : "border-color 0.2s, transform 0.2s",
          }}
        >
          {isCompleted && <span style={styles.checkMark}>✓</span>}
        </span>
      )}
    </div>
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
    textAlign: "left",
    fontFamily: "serif",
    color: colors.text,
    userSelect: "none",
    WebkitUserSelect: "none",
    touchAction: "manipulation",
  },
  cardDone: {
    opacity: 0.4,
  },
  cardInactive: {
    opacity: 0.35,
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
  progressBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    height: 2,
    borderRadius: 1,
    transition: "none",
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
