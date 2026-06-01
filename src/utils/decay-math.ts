/**
 * Calculate how much flame decays for a missed commitment.
 * Each missed task reduces flame by a base amount.
 */
export function decayPerMissedTask(
  flameIntensity: number,
  totalMissed: number
): number {
  const baseDecay = 0.08;
  const totalDecay = baseDecay * totalMissed;
  // Cap to current flame intensity (can't go below 0)
  return Math.min(totalDecay, flameIntensity);
}

/**
 * Check if it's a new day and decay needs processing.
 */
export function needsDecay(lastDecayDate: string | null): boolean {
  if (!lastDecayDate) return false;
  const today = new Date().toISOString().split("T")[0];
  return lastDecayDate < today;
}

/**
 * Get today's date string (YYYY-MM-DD) in local timezone.
 */
export function todayDateString(): string {
  return new Date().toISOString().split("T")[0];
}
