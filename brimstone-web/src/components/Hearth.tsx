// The Hearth — main screen. Flame, today's oaths, cryptic stats overlay.
// No headers. No tabs. No hand-holding. Ported from React Native.
"use client";

import { useEffect, useState } from "react";
import { FlameScene } from "./FlameScene";
import { CommitmentCard } from "./CommitmentCard";
import { colors, spacing, fontSize } from "@/lib/theme";
import { flameLevelName, flameColor, isCommitmentActiveOnDate, todayDateString } from "@/lib/flame-math";
import type { FlameUIState } from "@/types/database";
import type { Commitment } from "@/types/database";

interface Props {
  flame: FlameUIState;
  commitments: Commitment[];
  completedIds: Set<string>;
  onComplete: (id: string) => Promise<number>;
  onUncomplete: (id: string) => Promise<number>;
  onForge: () => void;
}

export function Hearth({
  flame,
  commitments,
  completedIds,
  onComplete,
  onUncomplete,
  onForge,
}: Props) {
  const [overlayVisible, setOverlayVisible] = useState(true);

  // Overlay animation: flash full, hold 2.5s, fade to 0.12
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOverlayVisible(true);
    const fadeTimer = setTimeout(() => setOverlayVisible(false), 2800);
    return () => clearTimeout(fadeTimer);
  }, [flame.flameIntensity]);

  const today = todayDateString();
  const isDead = flame.flameIntensity <= 0;
  const levelName = flameLevelName(flame.flameIntensity);
  const fColor = flameColor(flame.flameIntensity);

  return (
    <div style={styles.root}>
      {/* ── Flame ──────────────────────────────────────────── */}
      <div style={styles.flameContainer}>
        <FlameScene intensity={flame.flameIntensity} />

        {/* Animated overlay */}
        <div
          style={{
            ...styles.overlay,
            opacity: overlayVisible ? 1 : 0.12,
            transition: overlayVisible ? "opacity 0.3s ease-out" : "opacity 1.8s ease-out",
            pointerEvents: "none",
          }}
        >
          <h1 style={{ ...styles.levelName, color: fColor }}>
            {levelName}
          </h1>

          {isDead ? (
            <div style={styles.deathBlock}>
              <p style={styles.deathText}>
                Deaths borne: {flame.deathCount}
              </p>
              <p style={styles.deathHint}>The ember stirs at dawn.</p>
            </div>
          ) : (
            <>
              {flame.streakDays > 0 && (
                <p style={styles.streakText}>
                  {flame.streakDays}{" "}
                  {flame.streakDays === 1 ? "dawn" : "dawns"} kindled
                </p>
              )}
              {flame.deathCount > 0 && (
                <p style={styles.scarText}>
                  borne {flame.deathCount} death
                  {flame.deathCount !== 1 ? "s" : ""}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Oaths ──────────────────────────────────────────── */}
      <div style={styles.oathsSection}>
        <div style={styles.oathsList}>
          {commitments.length === 0 ? (
            <div style={styles.emptyState}>
              <span style={styles.emptyIcon}>⬥</span>
              <p style={styles.emptyText}>the hearth is cold</p>
            </div>
          ) : (
            commitments.map((c) => (
              <CommitmentCard
                key={c.id}
                title={c.title}
                frequency={c.frequency}
                recurrence_days={c.recurrence_days}
                recurrence_dates={c.recurrence_dates}
                isCompleted={completedIds.has(c.id)}
                isActiveToday={
                  (c as any).isActiveToday ??
                  isCommitmentActiveOnDate(c, today)
                }
                onComplete={() => onComplete(c.id)}
                onUncomplete={() => onUncomplete(c.id)}
              />
            ))
          )}
        </div>

        {/* Forge button — centered "+" circle */}
        <button
          onClick={onForge}
          style={styles.forgeBtn}
          aria-label="Forge"
        >
          <span style={styles.forgeGlyph}>+</span>
        </button>
      </div>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100%",
  },
  flameContainer: {
    flex: 1,
    minHeight: "45%",
    position: "relative",
  },
  overlay: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  levelName: {
    fontSize: fontSize.xl,
    fontFamily: "serif",
    textTransform: "uppercase",
    letterSpacing: 3,
    textShadow: "0 2px 8px #000",
    margin: 0,
    fontWeight: "normal",
  },
  deathBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  deathText: {
    color: colors.danger,
    fontSize: fontSize.md,
    fontFamily: "serif",
    margin: 0,
  },
  deathHint: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontFamily: "serif",
    marginTop: spacing.xs,
    fontStyle: "italic",
    margin: 0,
  },
  streakText: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontFamily: "serif",
    marginTop: spacing.xs,
    opacity: 0.7,
    margin: 0,
  },
  scarText: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontFamily: "serif",
    marginTop: 2,
    opacity: 0.6,
    margin: 0,
  },
  oathsSection: {
    flex: 1,
    minHeight: "35%",
    borderTop: `1px solid ${colors.border}`,
    position: "relative",
    paddingBottom: 60,
  },
  oathsList: {
    padding: spacing.md,
    paddingTop: spacing.lg,
    overflowY: "auto",
    maxHeight: "100%",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 28,
    color: colors.textFaint,
    opacity: 0.3,
  },
  emptyText: {
    color: colors.textFaint,
    fontSize: fontSize.sm,
    fontFamily: "serif",
    marginTop: spacing.sm,
    opacity: 0.5,
    fontStyle: "italic",
    margin: 0,
  },
  forgeBtn: {
    position: "absolute",
    bottom: 16,
    left: "50%",
    transform: "translateX(-50%)",
    width: 44,
    height: 44,
    borderRadius: "50%",
    backgroundColor: colors.surface,
    border: `1px solid ${colors.border}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: 0,
  },
  forgeGlyph: {
    color: colors.textFaint,
    fontSize: 24,
    fontFamily: "serif",
    lineHeight: "26px",
  },
};
