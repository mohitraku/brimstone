// Database types — mirrors the Supabase schema.
// These replace the Prisma-generated types. Same pattern as current db.ts.

export interface FlameState {
  id: string;
  user_id: string;
  flame_intensity: number;
  streak_days: number;
  longest_streak: number;
  death_count: number;
  last_decay_date: string | null;
  last_completion_date: string | null;
}

export interface FlameUIState {
  flameIntensity: number;
  streakDays: number;
  longestStreak: number;
  deathCount: number;
  lastDecayDate: string | null;
}

export interface Commitment {
  id: string;
  user_id: string;
  title: string;
  frequency: "daily" | "recurring";
  recurrence_days: number[] | null;   // 0=Sun … 6=Sat
  recurrence_dates: number[] | null;  // 1–31
  is_deleted: boolean;
  created_at: string;
}

export interface Ember {
  id: string;
  user_id: string;
  commitment_id: string;
  gain: number;
  completed_date: string;
}

export interface DecayLogEntry {
  id: string;
  user_id: string;
  decay_date: string;
  amount: number;
  reason: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  polar_subscription_id: string | null;
  polar_price_id: string | null;
  status: "trialing" | "active" | "past_due" | "canceled" | "unpaid" | "incomplete" | "incomplete_expired" | "inactive";
  current_period_end: string | null;
  created_at: string;
}
