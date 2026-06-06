// Game math — flame intensity, decay, level names, date helpers.

/** How much each missed oath decays the flame. */
export const DECAY_PER_MISS = 0.08;

/** Intensity set when flame rekindles after death. */
export const REKINDLE_INTENSITY = 0.06;

/**
 * Composite flame intensity from three inputs.
 * - completionRatio (0–1): today's completed / total active
 * - streakBonus: log-scale bonus for consecutive days
 *
 * Weights: completion 60%, streak 20%, baseline 20% (the 0.2 constant).
 * No estus — the flame answers to oaths alone.
 */
export function calculateFlameIntensity(
  completedToday: number,
  totalActive: number,
  streakDays: number,
): number {
  if (totalActive === 0) return 0.5; // no oaths bound — neutral flame

  const ratio = completedToday / totalActive;
  const streakBonus = streakDays > 0 ? Math.log2(streakDays + 1) * 0.06 : 0;

  // Weights: completion 0.6, streak 0.2, baseline 0.2
  const raw = 0.2 + ratio * 0.6 + streakBonus;

  return Math.min(1, Math.max(0, raw));
}

/** How much intensity one completion adds. */
export function completionIntensityGain(totalActive: number): number {
  if (totalActive <= 0) return 0;
  return 0.6 / totalActive;
}

/** Today as "YYYY-MM-DD" local. */
export function todayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** Flame level name — 7 tiers, cryptic. */
export function flameLevelName(intensity: number): string {
  if (intensity <= 0) return "Extinguished";
  if (intensity < 0.2) return "Fading Ember";
  if (intensity < 0.4) return "Sputtering Wick";
  if (intensity < 0.6) return "Steady Flame";
  if (intensity < 0.8) return "Roaring Pyre";
  if (intensity < 0.95) return "Blazing Inferno";
  return "Searing Inferno";
}

/** Warm color for a given intensity — shifts from dim red to bright gold. */
export function flameColor(intensity: number): string {
  if (intensity <= 0) return "#3a3430"; // cold ash
  const r = Math.round(180 + intensity * 75);
  const g = Math.round(60 + intensity * 140);
  const b = Math.round(10 + intensity * 30);
  return `rgb(${r},${g},${b})`;
}

/** Whether a commitment is active on a given date (client + server use). */
export function isCommitmentActiveOnDate(
  c: { frequency: string; recurrence_days: number[] | null; recurrence_dates: number[] | null },
  dateStr: string,
): boolean {
  if (c.frequency === "daily") return true;
  if (c.frequency === "recurring") {
    const d = new Date(dateStr + "T00:00:00");
    const dayOfWeek = d.getDay(); // 0=Sun
    const dayOfMonth = d.getDate();
    if (c.recurrence_days && c.recurrence_days.includes(dayOfWeek)) return true;
    if (c.recurrence_dates && c.recurrence_dates.includes(dayOfMonth)) return true;
    return false;
  }
  return true;
}
