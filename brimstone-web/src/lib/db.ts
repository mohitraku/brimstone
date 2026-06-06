// Server-side data layer — Supabase JS client with service role.
// Runs in Cloudflare Workers (API routes). HTTP-based, no TCP needed.
import { createClient } from "@supabase/supabase-js";
import type { FlameState, Commitment, Subscription } from "@/types/database";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
  );
}

// ── Flame State ──────────────────────────────────────────────

export async function getFlameState(userId: string): Promise<FlameState | null> {
  const { data } = await getServiceClient()
    .from("flame_state")
    .select("*")
    .eq("user_id", userId)
    .single();
  return data;
}

export async function updateFlameState(
  userId: string,
  patch: Partial<Pick<FlameState, "flame_intensity" | "streak_days" | "longest_streak" | "death_count" | "last_decay_date" | "last_completion_date">>,
): Promise<void> {
  await getServiceClient()
    .from("flame_state")
    .update(patch)
    .eq("user_id", userId);
}

// ── Commitments ──────────────────────────────────────────────

export async function getAllCommitments(userId: string): Promise<Commitment[]> {
  const { data } = await getServiceClient()
    .from("commitments")
    .select("*")
    .eq("user_id", userId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: true });
  return (data as Commitment[]) ?? [];
}

export async function createCommitment(
  userId: string,
  id: string,
  title: string,
  frequency: string,
  icon: string | null,
): Promise<void> {
  await getServiceClient()
    .from("commitments")
    .insert({ id, user_id: userId, title, frequency, icon });
}

export async function deleteCommitment(id: string): Promise<void> {
  await getServiceClient()
    .from("commitments")
    .update({ is_deleted: true })
    .eq("id", id);
}

export async function getActiveCommitmentsForDate(
  userId: string,
  dateStr: string,
): Promise<Commitment[]> {
  const db = getServiceClient();
  const dayOfWeek = new Date(dateStr + "T00:00:00").getDay(); // 0=Sun

  const { data } = await db
    .from("commitments")
    .select("*")
    .eq("user_id", userId)
    .eq("is_deleted", false);

  const all = (data as Commitment[]) ?? [];

  return all.filter((c) => {
    if (c.frequency === "daily") return true;
    if (c.frequency === "weekdays") return dayOfWeek >= 1 && dayOfWeek <= 5;
    if (c.frequency === "weekly") return dayOfWeek === 0;
    return true;
  });
}

// ── Embers ───────────────────────────────────────────────────

export async function insertEmber(
  userId: string,
  commitmentId: string,
  gain: number,
  completedDate: string,
): Promise<void> {
  const id = crypto.randomUUID();
  await getServiceClient()
    .from("embers")
    .insert({
      id,
      user_id: userId,
      commitment_id: commitmentId,
      gain,
      completed_date: completedDate,
    });
}

export async function getTodaysCompletedIds(
  userId: string,
  today: string,
): Promise<Set<string>> {
  const { data } = await getServiceClient()
    .from("embers")
    .select("commitment_id")
    .eq("user_id", userId)
    .eq("completed_date", today);

  return new Set(((data as { commitment_id: string }[]) ?? []).map((r) => r.commitment_id));
}

// ── Decay Log ────────────────────────────────────────────────

export async function insertDecayLog(
  userId: string,
  decayDate: string,
  amount: number,
  reason: string,
): Promise<void> {
  const id = crypto.randomUUID();
  await getServiceClient()
    .from("decay_log")
    .insert({
      id,
      user_id: userId,
      decay_date: decayDate,
      amount,
      reason,
    });
}

// ── Subscription ─────────────────────────────────────────────

export async function getSubscription(userId: string): Promise<Subscription | null> {
  const { data } = await getServiceClient()
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();
  return (data as Subscription) ?? null;
}

export async function upsertSubscription(
  userId: string,
  patch: Partial<Pick<Subscription, "polar_subscription_id" | "polar_price_id" | "status" | "current_period_end">>,
): Promise<void> {
  const existing = await getSubscription(userId);
  if (existing) {
    await getServiceClient()
      .from("subscriptions")
      .update(patch)
      .eq("user_id", userId);
  } else {
    await getServiceClient()
      .from("subscriptions")
      .insert({ user_id: userId, ...patch });
  }
}
