// GET /api/flame — get flame state (recalculated server-side)
import { NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { getFlameState, updateFlameState, getTodaysCompletedIds, getAllCommitments } from "@/lib/db";
import { calculateFlameIntensity, todayDateString } from "@/lib/flame-math";

export async function GET() {
  try {
    const user = await requireAuth();
    const state = await getFlameState(user.id);
    if (!state) {
      return NextResponse.json(null, { status: 200 });
    }

    const today = todayDateString();
    const [completedIds, all] = await Promise.all([
      getTodaysCompletedIds(user.id, today),
      getAllCommitments(user.id),
    ]);

    const intensity = calculateFlameIntensity(
      completedIds.size,
      all.length,
      state.streak_days,
    );

    // Persist if changed
    if (Math.abs(intensity - state.flame_intensity) > 0.001) {
      await updateFlameState(user.id, { flame_intensity: intensity });
    }

    return NextResponse.json({
      flameIntensity: intensity,
      streakDays: state.streak_days,
      longestStreak: state.longest_streak,
      deathCount: state.death_count,
      lastDecayDate: state.last_decay_date,
    });
  } catch (e: unknown) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }
    console.error("GET /api/flame failed:", e);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}
