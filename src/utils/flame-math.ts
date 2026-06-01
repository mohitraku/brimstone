/**
 * Calculate flame intensity based on today's completions, streak, and estus.
 * No lower clamp — flame can reach 0.0 (extinguished).
 */
export function calculateFlameIntensity(
  completedToday: number,
  totalActiveCommitments: number,
  streakDays: number,
  currentEstus: number,
  maxEstus: number
): number {
  const completionRatio =
    totalActiveCommitments > 0
      ? completedToday / totalActiveCommitments
      : 0;

  // Today's completions contribute up to 0.60
  const todayImpact = completionRatio * 0.6;

  // Streak momentum: small bonus per consecutive day, caps at 0.20
  const streakImpact = Math.min(streakDays * 0.02, 0.2);

  // Estus bonus: tiny permanent glow from having unused charges
  const estusBonus = (currentEstus / maxEstus) * 0.05;

  return Math.max(0, Math.min(1, todayImpact + streakImpact + estusBonus));
}

/**
 * How much intensity a single completion adds.
 * Scales with commitment "weight" — MVP uses a flat value.
 */
export function completionIntensityGain(
  totalActiveCommitments: number
): number {
  if (totalActiveCommitments <= 0) return 0.3;
  return Math.max(0.05, 0.6 / totalActiveCommitments);
}
