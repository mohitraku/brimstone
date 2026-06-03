// Core flame mathematics — intensity calculation, decay, and helpers.
// Pure functions, no side effects.

import { colors } from "./theme";

/** Each missed oath costs this much flame intensity. */
export const DECAY_PER_MISS = 0.08;

/** The tiny ember a rekindled flame starts at after death. */
export const REKINDLE_INTENSITY = 0.06;

/** Maximum flame intensity. */
export const MAX_INTENSITY = 1.0;

/**
 * Calculate flame intensity from today's completions and streak.
 * No estus bonus — the flame's strength comes only from oaths kept.
 */
export function calculateFlameIntensity(
  completedToday: number,
  totalActiveCommitments: number,
  streakDays: number,
): number {
  const completionRatio =
    totalActiveCommitments > 0 ? completedToday / totalActiveCommitments : 0;

  // Completion makes up to 60% of intensity
  const todayImpact = completionRatio * 0.6;

  // Streak momentum — up to 20% (caps at 10-day streak)
  const streakImpact = Math.min(streakDays * 0.02, 0.2);

  return Math.max(0, Math.min(MAX_INTENSITY, todayImpact + streakImpact));
}

/**
 * How much intensity a single completion contributes.
 * Scales inversely with total commitments — fewer oaths = each matters more.
 */
export function completionIntensityGain(
  totalActiveCommitments: number,
): number {
  if (totalActiveCommitments <= 0) return 0.3;
  return Math.max(0.05, 0.6 / totalActiveCommitments);
}

/** Today's date as YYYY-MM-DD in local timezone. */
export function todayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Offset a date string by N days. */
export function offsetDateString(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** The flame's current name — cryptic, gothic thresholds. */
export function flameLevelName(intensity: number): string {
  if (intensity <= 0) return "Extinguished";
  if (intensity < 0.15) return "Fading Ember";
  if (intensity < 0.3) return "Glowing Coal";
  if (intensity < 0.5) return "Kindling";
  if (intensity < 0.7) return "Steady Flame";
  if (intensity < 0.85) return "Roaring Blaze";
  return "Searing Inferno";
}

/** Flame color at a given intensity — from ember red through deep orange to pale gold. */
export function flameColor(intensity: number): string {
  if (intensity <= 0) return colors.ember;
  if (intensity < 0.2) return "#6b1a0a";
  if (intensity < 0.4) return colors.deepOrange;
  if (intensity < 0.6) return colors.orange;
  if (intensity < 0.8) return colors.gold;
  return colors.pale;
}

/** Intensity as a bar fill fraction (0–1), for visual meters. */
export function intensityBarWidth(intensity: number): number {
  return Math.max(0, Math.min(1, intensity));
}
