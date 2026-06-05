// POST /api/decay/process — run overnight decay, handle death/rekindle
import { NextResponse } from "next/server";
import { requireSubscription, AuthError, SubscriptionError } from "@/lib/auth";
import {
  getFlameState,
  updateFlameState,
  getActiveCommitmentsForDate,
  getTodaysCompletedIds,
  insertDecayLog,
} from "@/lib/db";
import {
  DECAY_PER_MISS,
  REKINDLE_INTENSITY,
  todayDateString,
} from "@/lib/flame-math";

/** Return YYYY-MM-DD offset by N days. */
function offsetDateString(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export async function POST() {
  try {
    const user = await requireSubscription();
    const state = await getFlameState(user.id);
    if (!state) {
      return NextResponse.json({ error: "No flame state" }, { status: 500 });
    }

    const today = todayDateString();
    const lastDate = state.last_decay_date;

    // First ever run: set last_decay_date to yesterday
    if (!lastDate) {
      const yesterday = offsetDateString(today, -1);
      await updateFlameState(user.id, { last_decay_date: yesterday });
      return NextResponse.json({ firstRun: true });
    }

    // Already processed today
    if (lastDate === today) {
      // Rekindle if dead
      if (state.flame_intensity <= 0) {
        await updateFlameState(user.id, { flame_intensity: REKINDLE_INTENSITY });
        return NextResponse.json({ rekindled: true });
      }
      return NextResponse.json({ alreadyProcessed: true });
    }

    // Process each missed day
    let current = offsetDateString(lastDate, 1);
    let totalDecay = 0;

    while (current < today) {
      const active = await getActiveCommitmentsForDate(user.id, current);
      const completed = await getTodaysCompletedIds(user.id, current);
      const missed = active.filter((c) => !completed.has(c.id));
      const decay = missed.length * DECAY_PER_MISS;

      if (decay > 0) {
        totalDecay += decay;
        await insertDecayLog(
          user.id,
          current,
          decay,
          `${missed.length} oath${missed.length !== 1 ? "s" : ""} unkept`,
        );
      }

      current = offsetDateString(current, 1);
    }

    if (totalDecay > 0 || lastDate !== today) {
      let newIntensity = state.flame_intensity - totalDecay;
      let deathCount = state.death_count;
      let streakDays = state.streak_days;

      let died = false;
      if (newIntensity <= 0) {
        newIntensity = 0;
        deathCount += 1;
        streakDays = 0;
        died = true;
        await insertDecayLog(
          user.id,
          today,
          state.flame_intensity,
          "flame extinguished",
        );
      }

      await updateFlameState(user.id, {
        flame_intensity: Math.max(0, newIntensity),
        last_decay_date: today,
        death_count: deathCount,
        streak_days: streakDays,
        longest_streak: Math.max(state.longest_streak, state.streak_days),
      });

      return NextResponse.json({ totalDecay, died, newIntensity: Math.max(0, newIntensity) });
    }

    return NextResponse.json({ totalDecay: 0 });
  } catch (e: unknown) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }
    if (e instanceof SubscriptionError) {
      return NextResponse.json({ error: "subscription_required" }, { status: 402 });
    }
    console.error("POST /api/decay/process failed:", e);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}
